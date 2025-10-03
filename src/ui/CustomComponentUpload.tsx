import React, { useState, useRef } from "react";
import { validateFile, validateAndParseJson } from "../utils/validation.utils";
import { saveCustomComponent } from "../utils/storage.utils";

/**
 * Props for the CustomComponentUpload component
 */
export interface CustomComponentUploadProps {
  /** Callback fired when upload completes (success or failure) */
  onUpload?: (success: boolean, message: string) => void;
  /** Callback fired when a component is successfully added */
  onComponentAdded?: () => void;
}

/**
 * CustomComponentUpload - A drag-and-drop file upload component for custom components
 *
 * Features:
 * - Drag and drop .json files
 * - Click to browse file picker
 * - File validation (size, format, structure)
 * - Visual feedback for drag states and upload progress
 * - Error handling and user feedback
 *
 * @param props - Component props
 * @returns JSX element
 */
export function CustomComponentUpload({ onUpload, onComponentAdded }: CustomComponentUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleFileUpload = async (file: File) => {
    clearMessages();
    setLoading(true);

    try {
      // Validate file first
      const fileValidation = validateFile(file);
      if (!fileValidation.isValid) {
        setError(fileValidation.errors.join(", "));
        onUpload?.(false, fileValidation.errors.join(", "));
        return;
      }

      // Show warnings if any
      if (fileValidation.warnings.length > 0) {
        console.warn("File validation warnings:", fileValidation.warnings);
      }

      // Read file content
      const fileContent = await readFileAsText(file);
      
      // Validate and parse JSON
      const jsonValidation = validateAndParseJson(fileContent);
      if (!jsonValidation.isValid) {
        setError(jsonValidation.errors.join(", "));
        onUpload?.(false, jsonValidation.errors.join(", "));
        return;
      }

      // Show JSON warnings if any
      if (jsonValidation.warnings.length > 0) {
        console.warn("Component validation warnings:", jsonValidation.warnings);
      }

      // Save component
      const saveResult = await saveCustomComponent(
        jsonValidation.normalizedComponent,
        file.name
      );

      if (saveResult.success) {
        setSuccess(`Component "${saveResult.component.component.metadata.name}" uploaded successfully!`);
        onUpload?.(true, `Component uploaded successfully!`);
        onComponentAdded?.();
      } else {
        setError(saveResult.error);
        onUpload?.(false, saveResult.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(`Failed to process file: ${errorMessage}`);
      onUpload?.(false, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    if (files.length > 1) {
      setError("Please upload only one file at a time");
      return;
    }

    handleFileUpload(files[0]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    handleFileUpload(files[0]);
    
    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (loading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="custom-component-upload">
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''} ${loading ? 'loading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={loading}
        />
        
        <div className="upload-content">
          <span className="upload-icon">
            {loading ? "⏳" : "📁"}
          </span>
          <div className="upload-text">
            {loading ? (
              "Processing..."
            ) : (
              <>
                <div className="upload-primary">Drop .json file or click to browse</div>
                <div className="upload-secondary">Maximum file size: 1MB</div>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="upload-message upload-error">
          <span className="message-icon">❌</span>
          <span className="message-text">{error}</span>
        </div>
      )}

      {success && (
        <div className="upload-message upload-success">
          <span className="message-icon">✅</span>
          <span className="message-text">{success}</span>
        </div>
      )}
    </div>
  );
}
