import React, { useState } from "react";
import { removeCustomComponent, getStorageInfo, type CustomComponent } from "../utils/storage.utils";

/**
 * Props for the CustomComponentList component
 */
export interface CustomComponentListProps {
  /** Array of custom components to display */
  components: CustomComponent[];
  /** Callback fired when a component is removed */
  onComponentRemoved?: () => void;
  /** Callback fired when remove action is triggered with component details */
  onRemove?: (id: string, name: string) => void;
}

/**
 * CustomComponentList - Displays and manages uploaded custom components
 *
 * Features:
 * - Lists all uploaded custom components with metadata
 * - Shows component details (name, type, upload date, file size)
 * - Remove functionality with confirmation
 * - Storage usage indicator
 * - Empty state when no components
 * - Storage warning when approaching limits
 *
 * @param props - Component props
 * @returns JSX element
 */
export function CustomComponentList({ components, onComponentRemoved, onRemove }: CustomComponentListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const storageInfo = getStorageInfo();

  const handleRemove = async (component: CustomComponent) => {
    if (removingId) return; // Prevent multiple simultaneous removals

    const confirmMessage = `Are you sure you want to remove "${component.component.metadata.name}"?`;
    if (!window.confirm(confirmMessage)) return;

    setRemovingId(component.id);

    try {
      const success = removeCustomComponent(component.id);
      if (success) {
        onRemove?.(component.id, component.component.metadata.name);
        onComponentRemoved?.();
      } else {
        alert("Failed to remove component. Please try again.");
      }
    } catch (error) {
      console.error("Error removing component:", error);
      alert("An error occurred while removing the component.");
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return "Unknown";
    }
  };

  const formatFileSize = (component: CustomComponent): string => {
    try {
      const jsonString = JSON.stringify(component.component);
      const sizeBytes = new Blob([jsonString]).size;
      const sizeKB = Math.round(sizeBytes / 1024);
      return `${sizeKB}KB`;
    } catch {
      return "Unknown";
    }
  };

  if (components.length === 0) {
    return (
      <div className="custom-component-list empty">
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <div className="empty-text">No custom components uploaded yet</div>
          <div className="empty-subtext">Upload a .json component file to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-component-list">
      <div className="list-header">
        <div className="list-title">
          Uploaded Components ({components.length})
        </div>
        <div className="storage-info">
          {storageInfo.currentSizeMB.toFixed(1)}MB / {storageInfo.maxSizeMB}MB used
        </div>
      </div>

      <div className="component-items">
        {components.map((component) => (
          <div key={component.id} className="component-item">
            <div className="component-info">
              <div className="component-header">
                <span className="component-name">
                  {component.component.metadata.name}
                </span>
                <span className="component-type">
                  {component.component.metadata.type}
                </span>
              </div>
              
              {component.component.metadata.description && (
                <div className="component-description">
                  {component.component.metadata.description}
                </div>
              )}
              
              <div className="component-meta">
                <span className="meta-item">
                  <span className="meta-label">Uploaded:</span>
                  <span className="meta-value">{formatDate(component.uploadedAt)}</span>
                </span>
                
                <span className="meta-item">
                  <span className="meta-label">Size:</span>
                  <span className="meta-value">{formatFileSize(component)}</span>
                </span>
                
                {component.originalFilename && (
                  <span className="meta-item">
                    <span className="meta-label">File:</span>
                    <span className="meta-value">{component.originalFilename}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="component-actions">
              <button
                className="remove-button"
                onClick={() => handleRemove(component)}
                disabled={removingId === component.id}
                title={`Remove ${component.component.metadata.name}`}
              >
                {removingId === component.id ? "⏳" : "🗑️"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {storageInfo.currentSizeMB > storageInfo.maxSizeMB * 0.8 && (
        <div className="storage-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">
            Storage is {Math.round((storageInfo.currentSizeMB / storageInfo.maxSizeMB) * 100)}% full. 
            Consider removing unused components.
          </span>
        </div>
      )}
    </div>
  );
}
