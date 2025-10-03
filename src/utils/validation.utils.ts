/**
 * Validation utilities for custom components
 * Handles JSON validation and normalization for uploaded component files
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalizedComponent?: any;
}

/**
 * Validates that a value is a non-empty string
 * @param value - Value to validate
 * @param fieldName - Name of the field for error messages
 * @returns True if valid string
 */
function isValidString(value: any, fieldName: string): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return `${fieldName} must be a non-empty string`;
  }
  return null;
}

/**
 * Validates that a value is a valid object (not null, not array)
 * @param value - Value to validate
 * @param fieldName - Name of the field for error messages
 * @returns Error message or null if valid
 */
function isValidObject(value: any, fieldName: string): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return `${fieldName} must be a valid object`;
  }
  return null;
}

/**
 * Validates component metadata structure
 * @param metadata - Metadata object to validate
 * @returns Array of error messages
 */
function validateMetadata(metadata: any): string[] {
  const errors: string[] = [];
  
  if (!metadata || typeof metadata !== 'object') {
    errors.push('metadata is required and must be an object');
    return errors;
  }

  // Required fields
  const typeError = isValidString(metadata.type, 'metadata.type');
  if (typeError) errors.push(typeError);

  const nameError = isValidString(metadata.name, 'metadata.name');
  if (nameError) errors.push(nameError);

  // Optional fields validation
  if (metadata.category !== undefined) {
    const categoryError = isValidString(metadata.category, 'metadata.category');
    if (categoryError) errors.push(categoryError);
  }

  if (metadata.description !== undefined) {
    const descError = isValidString(metadata.description, 'metadata.description');
    if (descError) errors.push(descError);
  }

  // Validate type format (should be kebab-case, no spaces)
  if (typeof metadata.type === 'string' && metadata.type.trim()) {
    if (!/^[a-z0-9-]+$/.test(metadata.type)) {
      errors.push('metadata.type should contain only lowercase letters, numbers, and hyphens (e.g., "custom-button")');
    }
  }

  return errors;
}

/**
 * Validates component UI structure
 * @param ui - UI object to validate
 * @returns Array of error messages
 */
function validateUI(ui: any): string[] {
  const errors: string[] = [];

  if (!ui || typeof ui !== 'object') {
    errors.push('ui is required and must be an object');
    return errors;
  }

  // Must have either template or some UI definition
  if (!ui.template && !ui.styles && !ui.html) {
    errors.push('ui must contain at least one of: template, styles, or html');
  }

  // If template exists, validate it's either a string (Handlebars) or object (JSON structure)
  if (ui.template !== undefined) {
    const isString = typeof ui.template === 'string';
    const isObject = ui.template && typeof ui.template === 'object' && !Array.isArray(ui.template);

    if (!isString && !isObject) {
      errors.push('ui.template must be either a string (Handlebars template) or an object (JSON structure)');
    }
  }

  // If styles exists, validate it's an object
  if (ui.styles !== undefined) {
    const stylesError = isValidObject(ui.styles, 'ui.styles');
    if (stylesError) errors.push(stylesError);
  }

  return errors;
}

/**
 * Validates the overall component structure
 * @param component - Component object to validate
 * @returns Validation result with errors and warnings
 */
export function validateComponentJson(component: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if it's a valid object
  if (!component || typeof component !== 'object' || Array.isArray(component)) {
    return {
      isValid: false,
      errors: ['Component must be a valid JSON object'],
      warnings: []
    };
  }

  // Validate metadata
  const metadataErrors = validateMetadata(component.metadata);
  errors.push(...metadataErrors);

  // Validate UI
  const uiErrors = validateUI(component.ui);
  errors.push(...uiErrors);

  // Check for unknown top-level properties (warnings only)
  const knownProperties = ['metadata', 'ui', 'integration', 'interactions', 'events', 'properties'];
  const unknownProps = Object.keys(component).filter(key => !knownProperties.includes(key));
  if (unknownProps.length > 0) {
    warnings.push(`Unknown properties found: ${unknownProps.join(', ')}. These will be preserved but may not be used.`);
  }

  // Additional warnings
  if (component.metadata?.category && component.metadata.category !== 'custom') {
    warnings.push(`metadata.category is "${component.metadata.category}" but will be treated as "custom" in the library`);
  }

  const isValid = errors.length === 0;
  const result: ValidationResult = {
    isValid,
    errors,
    warnings
  };

  if (isValid) {
    result.normalizedComponent = normalizeComponent(component);
  }

  return result;
}

/**
 * Normalizes a component by ensuring required fields and proper structure
 * @param component - Component to normalize
 * @returns Normalized component
 */
export function normalizeComponent(component: any): any {
  return {
    metadata: {
      type: component.metadata.type.trim(),
      name: component.metadata.name.trim(),
      category: component.metadata.category?.trim() || 'custom',
      description: component.metadata.description?.trim() || `${component.metadata.name} component`
    },
    ui: component.ui,
    // Preserve any additional properties
    ...Object.keys(component)
      .filter(key => !['metadata', 'ui'].includes(key))
      .reduce((acc, key) => ({ ...acc, [key]: component[key] }), {})
  };
}

/**
 * Validates a JSON string and parses it
 * @param jsonString - JSON string to validate and parse
 * @returns Validation result with parsed component if valid
 */
export function validateAndParseJson(jsonString: string): ValidationResult {
  try {
    const parsed = JSON.parse(jsonString);
    return validateComponentJson(parsed);
  } catch (error) {
    return {
      isValid: false,
      errors: [`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown parsing error'}`],
      warnings: []
    };
  }
}

/**
 * Validates a file before processing
 * @param file - File object to validate
 * @returns Validation result for the file
 */
export function validateFile(file: File): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file type
  if (!file.name.toLowerCase().endsWith('.json')) {
    errors.push('File must have a .json extension');
  }

  // Check file size (1MB limit)
  const maxSize = 1024 * 1024; // 1MB in bytes
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    errors.push(`File too large (${sizeMB}MB). Maximum size is 1MB.`);
  }

  // Check MIME type if available
  if (file.type && !file.type.includes('json') && !file.type.includes('text')) {
    warnings.push(`File MIME type is "${file.type}". Expected JSON or text file.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
