import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomComponentList } from "../src/ui/CustomComponentList";
import type { CustomComponent } from "../src/utils/storage.utils";

// Mock the storage utilities
vi.mock("../src/utils/storage.utils", () => ({
  removeCustomComponent: vi.fn(),
  getStorageInfo: vi.fn()
}));

import { removeCustomComponent, getStorageInfo } from "../src/utils/storage.utils";

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

// Mock window.alert
const mockAlert = vi.fn();
global.alert = mockAlert;

describe("CustomComponentList", () => {
  const mockOnComponentRemoved = vi.fn();
  const mockOnRemove = vi.fn();

  const sampleComponents: CustomComponent[] = [
    {
      id: "custom-button-123",
      uploadedAt: "2023-10-01T10:00:00.000Z",
      source: "user-upload",
      originalFilename: "button.json",
      component: {
        metadata: {
          type: "custom-button",
          name: "Custom Button",
          category: "custom",
          description: "A custom button component"
        },
        ui: {
          template: { tag: "button", text: "Click me" }
        }
      }
    },
    {
      id: "custom-input-456",
      uploadedAt: "2023-10-01T11:00:00.000Z",
      source: "user-upload",
      component: {
        metadata: {
          type: "custom-input",
          name: "Custom Input",
          category: "custom"
        },
        ui: {
          template: { tag: "input", type: "text" }
        }
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (getStorageInfo as any).mockReturnValue({
      currentSizeMB: 2.5,
      maxSizeMB: 10,
      componentCount: 2,
      availableMB: 7.5
    });
    
    (removeCustomComponent as any).mockReturnValue(true);
    mockConfirm.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders empty state when no components", () => {
    render(<CustomComponentList components={[]} />);
    
    expect(screen.getByText("No custom components uploaded yet")).toBeInTheDocument();
    expect(screen.getByText("Upload a .json component file to get started")).toBeInTheDocument();
    expect(screen.getByText("📦")).toBeInTheDocument();
  });

  it("renders component list with correct information", () => {
    render(<CustomComponentList components={sampleComponents} />);
    
    // Check header
    expect(screen.getByText("Uploaded Components (2)")).toBeInTheDocument();
    expect(screen.getByText("2.5MB / 10MB used")).toBeInTheDocument();
    
    // Check first component
    expect(screen.getByText("Custom Button")).toBeInTheDocument();
    expect(screen.getByText("custom-button")).toBeInTheDocument();
    expect(screen.getByText("A custom button component")).toBeInTheDocument();
    expect(screen.getByText("button.json")).toBeInTheDocument();
    
    // Check second component
    expect(screen.getByText("Custom Input")).toBeInTheDocument();
    expect(screen.getByText("custom-input")).toBeInTheDocument();
    
    // Check remove buttons
    const removeButtons = screen.getAllByTitle(/Remove/);
    expect(removeButtons).toHaveLength(2);
  });

  it("formats dates correctly", () => {
    render(<CustomComponentList components={sampleComponents} />);
    
    // The exact format depends on locale, but should contain date and time
    const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it("calculates and displays file sizes", () => {
    render(<CustomComponentList components={sampleComponents} />);
    
    // Should show size in KB
    const sizeElements = screen.getAllByText(/\d+KB/);
    expect(sizeElements.length).toBeGreaterThan(0);
  });

  it("handles component removal successfully", async () => {
    render(
      <CustomComponentList 
        components={sampleComponents} 
        onComponentRemoved={mockOnComponentRemoved}
        onRemove={mockOnRemove}
      />
    );
    
    const removeButton = screen.getByTitle("Remove Custom Button");
    
    fireEvent.click(removeButton);
    
    // Should show confirmation dialog
    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to remove "Custom Button"?');
    
    await waitFor(() => {
      expect(removeCustomComponent).toHaveBeenCalledWith("custom-button-123");
      expect(mockOnRemove).toHaveBeenCalledWith("custom-button-123", "Custom Button");
      expect(mockOnComponentRemoved).toHaveBeenCalled();
    });
  });

  it("handles removal cancellation", async () => {
    mockConfirm.mockReturnValue(false);
    
    render(<CustomComponentList components={sampleComponents} />);
    
    const removeButton = screen.getByTitle("Remove Custom Button");
    
    fireEvent.click(removeButton);
    
    expect(mockConfirm).toHaveBeenCalled();
    expect(removeCustomComponent).not.toHaveBeenCalled();
  });

  it("handles removal failure", async () => {
    (removeCustomComponent as any).mockReturnValue(false);
    
    render(<CustomComponentList components={sampleComponents} />);
    
    const removeButton = screen.getByTitle("Remove Custom Button");
    
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith("Failed to remove component. Please try again.");
    });
  });

  it("handles removal error", async () => {
    (removeCustomComponent as any).mockImplementation(() => {
      throw new Error("Storage error");
    });
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<CustomComponentList components={sampleComponents} />);
    
    const removeButton = screen.getByTitle("Remove Custom Button");
    
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Error removing component:", expect.any(Error));
      expect(mockAlert).toHaveBeenCalledWith("An error occurred while removing the component.");
    });
    
    consoleSpy.mockRestore();
  });

  it("shows loading state during removal", async () => {
    // Mock a delayed removal
    (removeCustomComponent as any).mockImplementation(() => {
      return new Promise(resolve => setTimeout(() => resolve(true), 100));
    });
    
    render(<CustomComponentList components={sampleComponents} />);
    
    const removeButton = screen.getByTitle("Remove Custom Button");
    
    fireEvent.click(removeButton);
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText("⏳")).toBeInTheDocument();
    });
  });

  it("prevents multiple simultaneous removals", async () => {
    render(<CustomComponentList components={sampleComponents} />);
    
    const removeButtons = screen.getAllByTitle(/Remove/);
    
    // Click first button
    fireEvent.click(removeButtons[0]);
    
    // Try to click second button immediately
    fireEvent.click(removeButtons[1]);
    
    // Should only call confirm once
    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows storage warning when near capacity", () => {
    (getStorageInfo as any).mockReturnValue({
      currentSizeMB: 8.5,
      maxSizeMB: 10,
      componentCount: 2,
      availableMB: 1.5
    });
    
    render(<CustomComponentList components={sampleComponents} />);
    
    expect(screen.getByText(/Storage is 85% full/)).toBeInTheDocument();
    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });

  it("does not show storage warning when below threshold", () => {
    (getStorageInfo as any).mockReturnValue({
      currentSizeMB: 5.0,
      maxSizeMB: 10,
      componentCount: 2,
      availableMB: 5.0
    });
    
    render(<CustomComponentList components={sampleComponents} />);
    
    expect(screen.queryByText(/Storage is/)).not.toBeInTheDocument();
  });

  it("handles components without descriptions", () => {
    const componentsWithoutDesc = [
      {
        ...sampleComponents[0],
        component: {
          ...sampleComponents[0].component,
          metadata: {
            ...sampleComponents[0].component.metadata,
            description: undefined
          }
        }
      }
    ];
    
    render(<CustomComponentList components={componentsWithoutDesc} />);
    
    expect(screen.getByText("Custom Button")).toBeInTheDocument();
    expect(screen.queryByText("A custom button component")).not.toBeInTheDocument();
  });

  it("handles components without original filename", () => {
    const componentsWithoutFilename = [
      {
        ...sampleComponents[0],
        originalFilename: undefined
      }
    ];
    
    render(<CustomComponentList components={componentsWithoutFilename} />);
    
    expect(screen.getByText("Custom Button")).toBeInTheDocument();
    expect(screen.queryByText("button.json")).not.toBeInTheDocument();
  });

  it("handles invalid dates gracefully", () => {
    const componentsWithInvalidDate = [
      {
        ...sampleComponents[0],
        uploadedAt: "invalid-date"
      }
    ];
    
    render(<CustomComponentList components={componentsWithInvalidDate} />);
    
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });
});
