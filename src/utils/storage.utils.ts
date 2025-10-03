/**
 * Storage utilities for custom components
 * Handles localStorage operations for user-uploaded components
 */

const STORAGE_KEY = 'renderx:custom-components';
const MAX_SIZE_MB = 10;
const MAX_COMPONENT_SIZE_MB = 1;

export interface CustomComponent {
  id: string;
  uploadedAt: string;
  source: 'user-upload';
  originalFilename?: string;
  component: {
    metadata: {
      type: string;
      name: string;
      category?: string;
      description?: string;
    };
    ui: any;
  };
}

/**
 * Generates a unique ID for a custom component
 * @param type - Component type from metadata
 * @returns Unique component ID
 */
function generateComponentId(type: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `custom-${type}-${timestamp}-${random}`;
}

/**
 * Gets the current storage size in MB
 * @returns Storage size in megabytes
 */
function getStorageSize(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return 0;
    return new Blob([data]).size / (1024 * 1024);
  } catch {
    return 0;
  }
}

/**
 * Checks if adding a component would exceed storage limits
 * @param componentSize - Size of component in bytes
 * @returns True if within limits
 */
function checkStorageLimit(componentSize: number): boolean {
  const componentSizeMB = componentSize / (1024 * 1024);
  if (componentSizeMB > MAX_COMPONENT_SIZE_MB) {
    return false;
  }
  
  const currentSizeMB = getStorageSize();
  return (currentSizeMB + componentSizeMB) <= MAX_SIZE_MB;
}

/**
 * Saves a custom component to localStorage
 * @param component - Component JSON data
 * @param originalFilename - Original filename (optional)
 * @returns Promise resolving to the saved component or error
 */
export async function saveCustomComponent(
  component: any,
  originalFilename?: string
): Promise<{ success: true; component: CustomComponent } | { success: false; error: string }> {
  try {
    // Validate required fields
    if (!component?.metadata?.type || !component?.metadata?.name) {
      return { success: false, error: 'Component must have metadata.type and metadata.name' };
    }

    // Check component size
    const componentStr = JSON.stringify(component);
    const componentSize = new Blob([componentStr]).size;
    
    if (!checkStorageLimit(componentSize)) {
      const sizeMB = (componentSize / (1024 * 1024)).toFixed(2);
      if (componentSize > MAX_COMPONENT_SIZE_MB * 1024 * 1024) {
        return { success: false, error: `Component too large (${sizeMB}MB). Maximum size is ${MAX_COMPONENT_SIZE_MB}MB.` };
      } else {
        return { success: false, error: `Storage quota exceeded. Current usage: ${getStorageSize().toFixed(2)}MB, Maximum: ${MAX_SIZE_MB}MB.` };
      }
    }

    // Load existing components
    const existingComponents = loadCustomComponents();
    
    // Check for duplicates by type
    const existingComponent = existingComponents.find(c => c.component.metadata.type === component.metadata.type);
    if (existingComponent) {
      return { success: false, error: `Component with type "${component.metadata.type}" already exists. Remove it first or use a different type.` };
    }

    // Create custom component record
    const customComponent: CustomComponent = {
      id: generateComponentId(component.metadata.type),
      uploadedAt: new Date().toISOString(),
      source: 'user-upload',
      originalFilename,
      component: {
        ...component,
        metadata: {
          ...component.metadata,
          category: component.metadata.category || 'custom'
        }
      }
    };

    // Save to localStorage
    const updatedComponents = [...existingComponents, customComponent];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedComponents));

    return { success: true, component: customComponent };
  } catch (error) {
    return { success: false, error: `Failed to save component: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Loads all custom components from localStorage
 * @returns Array of custom components
 */
export function loadCustomComponents(): CustomComponent[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const components = JSON.parse(data);
    return Array.isArray(components) ? components : [];
  } catch {
    return [];
  }
}

/**
 * Removes a custom component by ID
 * @param id - Component ID to remove
 * @returns True if component was removed, false if not found
 */
export function removeCustomComponent(id: string): boolean {
  try {
    const components = loadCustomComponents();
    const filteredComponents = components.filter(c => c.id !== id);
    
    if (filteredComponents.length === components.length) {
      return false; // Component not found
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredComponents));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears all custom components from storage
 * @returns True if successful
 */
export function clearCustomComponents(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets storage usage information
 * @returns Storage usage details
 */
export function getStorageInfo(): {
  currentSizeMB: number;
  maxSizeMB: number;
  componentCount: number;
  availableMB: number;
} {
  const components = loadCustomComponents();
  const currentSizeMB = getStorageSize();
  
  return {
    currentSizeMB: Math.round(currentSizeMB * 100) / 100,
    maxSizeMB: MAX_SIZE_MB,
    componentCount: components.length,
    availableMB: Math.round((MAX_SIZE_MB - currentSizeMB) * 100) / 100
  };
}
