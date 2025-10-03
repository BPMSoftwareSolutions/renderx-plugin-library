import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomComponentUpload } from "../src/ui/CustomComponentUpload";

// Mock the utility functions
vi.mock("../src/utils/validation.utils", () => ({
  validateFile: vi.fn(),
  validateAndParseJson: vi.fn()
}));

vi.mock("../src/utils/storage.utils", () => ({
  saveCustomComponent: vi.fn()
}));

import { validateFile, validateAndParseJson } from "../src/utils/validation.utils";
import { saveCustomComponent } from "../src/utils/storage.utils";

// Mock FileReader
const mockFileReader = {
  readAsText: vi.fn(),
  onload: null as any,
  onerror: null as any,
  result: null as any
};

global.FileReader = vi.fn(() => mockFileReader) as any;

describe("CustomComponentUpload", () => {
  const mockOnUpload = vi.fn();
  const mockOnComponentAdded = vi.fn();

  const validComponent = {
    metadata: {
      type: "custom-button",
      name: "Custom Button"
    },
    ui: {
      template: { tag: "button", text: "Click me" }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFileReader.result = null;
    
    // Default mock implementations
    (validateFile as any).mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });
    
    (validateAndParseJson as any).mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
      normalizedComponent: validComponent
    });
    
    (saveCustomComponent as any).mockResolvedValue({
      success: true,
      component: {
        id: "test-id",
        component: validComponent
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders upload zone with correct initial state", () => {
    render(<CustomComponentUpload />);
    
    expect(screen.getByText("Drop .json file or click to browse")).toBeInTheDocument();
    expect(screen.getByText("Maximum file size: 1MB")).toBeInTheDocument();
    expect(screen.getByText("📁")).toBeInTheDocument();
  });

  it("shows loading state during file processing", async () => {
    render(<CustomComponentUpload onUpload={mockOnUpload} />);
    
    const file = new File(['{"test": "data"}'], "test.json", { type: "application/json" });
    const input = screen.getByRole("button");
    
    // Mock FileReader to delay the onload callback
    mockFileReader.readAsText.mockImplementation(() => {
      setTimeout(() => {
        mockFileReader.result = '{"test": "data"}';
        mockFileReader.onload?.({ target: { result: '{"test": "data"}' } });
      }, 100);
    });

    // Simulate file drop
    fireEvent.drop(input, { dataTransfer: { files: [file] } });
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText("Processing...")).toBeInTheDocument();
      expect(screen.getByText("⏳")).toBeInTheDocument();
    });
  });

  it("handles successful file upload", async () => {
    render(<CustomComponentUpload onUpload={mockOnUpload} onComponentAdded={mockOnComponentAdded} />);
    
    const file = new File(['{"test": "data"}'], "test.json", { type: "application/json" });
    const input = screen.getByRole("button");
    
    // Mock FileReader success
    mockFileReader.readAsText.mockImplementation(() => {
      mockFileReader.result = '{"test": "data"}';
      setTimeout(() => mockFileReader.onload?.({ target: { result: '{"test": "data"}' } }), 0);
    });

    fireEvent.drop(input, { dataTransfer: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/uploaded successfully/)).toBeInTheDocument();
      expect(screen.getByText("✅")).toBeInTheDocument();
    });

    expect(mockOnUpload).toHaveBeenCalledWith(true, "Component uploaded successfully!");
    expect(mockOnComponentAdded).toHaveBeenCalled();
  });

  it("handles file validation errors", async () => {
    (validateFile as any).mockReturnValue({
      isValid: false,
      errors: ["File must have a .json extension"],
      warnings: []
    });

    render(<CustomComponentUpload onUpload={mockOnUpload} />);
    
    const file = new File(['{"test": "data"}'], "test.txt", { type: "text/plain" });
    const input = screen.getByRole("button");
    
    fireEvent.drop(input, { dataTransfer: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText("File must have a .json extension")).toBeInTheDocument();
      expect(screen.getByText("❌")).toBeInTheDocument();
    });

    expect(mockOnUpload).toHaveBeenCalledWith(false, "File must have a .json extension");
  });

  it("handles JSON validation errors", async () => {
    (validateAndParseJson as any).mockReturnValue({
      isValid: false,
      errors: ["metadata.type must be a non-empty string"],
      warnings: []
    });

    render(<CustomComponentUpload onUpload={mockOnUpload} />);
    
    const file = new File(['{"invalid": "json"}'], "test.json", { type: "application/json" });
    const input = screen.getByRole("button");
    
    mockFileReader.readAsText.mockImplementation(() => {
      mockFileReader.result = '{"invalid": "json"}';
      setTimeout(() => mockFileReader.onload?.({ target: { result: '{"invalid": "json"}' } }), 0);
    });

    fireEvent.drop(input, { dataTransfer: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText("metadata.type must be a non-empty string")).toBeInTheDocument();
    });

    expect(mockOnUpload).toHaveBeenCalledWith(false, "metadata.type must be a non-empty string");
  });

  it("handles storage errors", async () => {
    (saveCustomComponent as any).mockResolvedValue({
      success: false,
      error: "Component with type already exists"
    });

    render(<CustomComponentUpload onUpload={mockOnUpload} />);
    
    const file = new File(['{"test": "data"}'], "test.json", { type: "application/json" });
    const input = screen.getByRole("button");
    
    mockFileReader.readAsText.mockImplementation(() => {
      mockFileReader.result = '{"test": "data"}';
      setTimeout(() => mockFileReader.onload?.({ target: { result: '{"test": "data"}' } }), 0);
    });

    fireEvent.drop(input, { dataTransfer: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText("Component with type already exists")).toBeInTheDocument();
    });

    expect(mockOnUpload).toHaveBeenCalledWith(false, "Component with type already exists");
  });

  it("handles multiple files error", async () => {
    render(<CustomComponentUpload />);
    
    const files = [
      new File(['{"test": "data1"}'], "test1.json", { type: "application/json" }),
      new File(['{"test": "data2"}'], "test2.json", { type: "application/json" })
    ];
    const input = screen.getByRole("button");
    
    fireEvent.drop(input, { dataTransfer: { files } });
    
    await waitFor(() => {
      expect(screen.getByText("Please upload only one file at a time")).toBeInTheDocument();
    });
  });

  it("handles drag over and drag leave events", () => {
    render(<CustomComponentUpload />);
    
    const uploadZone = screen.getByRole("button");
    
    // Test drag over
    fireEvent.dragOver(uploadZone);
    expect(uploadZone).toHaveClass("drag-over");
    
    // Test drag leave
    fireEvent.dragLeave(uploadZone);
    expect(uploadZone).not.toHaveClass("drag-over");
  });

  it("handles click to browse files", () => {
    render(<CustomComponentUpload />);
    
    const uploadZone = screen.getByRole("button");
    const fileInput = uploadZone.querySelector('input[type="file"]') as HTMLInputElement;
    
    const clickSpy = vi.spyOn(fileInput, 'click');
    
    fireEvent.click(uploadZone);
    
    expect(clickSpy).toHaveBeenCalled();
  });

  it("handles keyboard navigation", () => {
    render(<CustomComponentUpload />);
    
    const uploadZone = screen.getByRole("button");
    const fileInput = uploadZone.querySelector('input[type="file"]') as HTMLInputElement;
    
    const clickSpy = vi.spyOn(fileInput, 'click');
    
    // Test Enter key
    fireEvent.keyDown(uploadZone, { key: 'Enter' });
    expect(clickSpy).toHaveBeenCalled();
    
    clickSpy.mockClear();
    
    // Test Space key
    fireEvent.keyDown(uploadZone, { key: ' ' });
    expect(clickSpy).toHaveBeenCalled();
  });

  it("handles FileReader errors", async () => {
    render(<CustomComponentUpload onUpload={mockOnUpload} />);
    
    const file = new File(['{"test": "data"}'], "test.json", { type: "application/json" });
    const input = screen.getByRole("button");
    
    // Mock FileReader error
    mockFileReader.readAsText.mockImplementation(() => {
      setTimeout(() => mockFileReader.onerror?.(), 0);
    });

    fireEvent.drop(input, { dataTransfer: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to process file/)).toBeInTheDocument();
    });

    expect(mockOnUpload).toHaveBeenCalledWith(false, expect.stringContaining("Failed to read file"));
  });
});
