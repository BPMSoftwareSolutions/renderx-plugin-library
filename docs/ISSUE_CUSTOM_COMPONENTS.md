# Feature Request: Custom Components Category with Drag-and-Drop Upload

## Summary
Add a new "Custom Components" category as the first category in the Component Library panel that allows users to drag-and-drop or browse for component JSON files to dynamically load custom components into the library.

## Background
Currently, the library loads components from the host's inventory system (`window.RenderX.inventory.listComponents()`) or from a static `/json-components/` directory. All components are categorized as "Basic Components", "Layout Components", etc. based on their `data-category` attribute or metadata.

We need to support user-uploaded custom components that can be loaded at runtime without requiring them to be pre-registered with the inventory system.

## Requirements

### 1. UI Components
- **Upload Zone**: Add a file upload zone in the "Custom Components" category
  - Support drag-and-drop of `.json` files
  - Support click-to-browse file picker
  - Show visual feedback during drag-over
  - Display upload status (loading, success, error)
  
- **Custom Component Display**: Once loaded, display custom components as regular library items
  - Show component icon, name, and description from JSON metadata
  - Allow dragging to canvas like built-in components
  - Persist custom components in browser storage (localStorage/IndexedDB)

- **Component Management**:
  - Show a list of loaded custom components
  - Allow removing individual custom components
  - Display component source/origin indicator
  - Show component validation status

### 2. Category Ordering
The "Custom Components" category must appear **first** in the library panel, before "Basic Components" and "Layout Components".

**Affected Files:**
- `src/ui/LibraryPanel.tsx` - Rendering order of categories
- `src/utils/library.utils.js` - `getCategoryDisplayName()` and `groupComponentsByCategory()`

### 3. Component Loading & Storage

**Component Sources:**
1. Host SDK inventory (existing)
2. Static `/json-components/` (existing)
3. **User-uploaded files (new)**

**Storage Strategy:**
- Store custom components in browser localStorage or IndexedDB
- Key: `renderx:custom-components`
- Value: Array of component JSON objects
- Load custom components on panel initialization
- Merge with inventory components before rendering

**Affected Files:**
- `src/symphonies/load.symphony.ts` - `loadComponents` handler needs to merge custom components
- New file: `src/utils/storage.utils.ts` - Handle persistence operations

### 4. File Validation

Uploaded JSON files must be validated before loading:

**Required Fields:**
```json
{
  "metadata": {
    "type": "string",      // Component type (e.g., "custom-button")
    "name": "string",      // Display name
    "category": "custom",  // Should default to "custom"
    "description": "string (optional)"
  },
  "ui": {
    "template": { ... },   // Component template definition
    "styles": { ... }      // Optional CSS styles
  }
}
```

**Validation Rules:**
- Must be valid JSON
- Must have `metadata.type` and `metadata.name`
- Must have `ui.template` or compatible structure
- Size limit: 1MB per file
- Reject duplicates (same `metadata.type`)

**New File:**
- `src/utils/validation.utils.ts` - JSON validation functions

### 5. Error Handling

- Invalid JSON format → Show inline error message
- Missing required fields → Show specific validation error
- Duplicate component → Prompt to overwrite
- Storage quota exceeded → Show warning and suggest cleanup
- File too large → Show size limit error

### 6. CSS Injection

Custom components may include CSS that needs to be registered:

**Current Behavior:**
- `LibraryPanel.tsx` calls `registerCssForComponents()` after components load
- CSS is extracted from `template.css` or `ui.styles.css`

**Required Changes:**
- Ensure custom components' CSS is properly registered
- Handle CSS conflicts between custom and built-in components
- Consider CSS scoping/isolation for safety

**Affected Files:**
- `src/ui/LibraryPanel.tsx` - `registerCssForComponents()` already handles this

### 7. Testing Requirements

**New Test Files:**
- `__tests__/storage.utils.spec.ts` - Test localStorage/IndexedDB operations
- `__tests__/validation.utils.spec.ts` - Test JSON validation
- `__tests__/CustomComponentUpload.spec.tsx` - Test upload UI component
- Update `__tests__/LibraryPanel.spec.tsx` - Test category ordering

**Test Cases:**
- Upload valid component JSON
- Upload invalid JSON (malformed, missing fields)
- Upload duplicate component
- Persist and reload custom components
- Remove custom component
- Custom components appear before built-in components
- Custom components render correctly in preview
- Custom components can be dragged to canvas

## Technical Architecture

### New Components

```
src/
  ui/
    CustomComponentUpload.tsx      // Upload zone component
    CustomComponentList.tsx        // Manage loaded custom components
  utils/
    storage.utils.ts               // localStorage/IndexedDB helpers
    validation.utils.ts            // JSON validation functions
  
__tests__/
  CustomComponentUpload.spec.tsx
  CustomComponentList.spec.tsx
  storage.utils.spec.ts
  validation.utils.spec.ts
```

### Data Flow

```
User Upload
    ↓
Validate JSON
    ↓
Store in localStorage
    ↓
Merge with inventory components
    ↓
Group by category (custom first)
    ↓
Render in LibraryPanel
```

### Storage Schema

```typescript
interface CustomComponent {
  id: string;                    // Generated: `custom-${type}-${timestamp}`
  uploadedAt: string;            // ISO timestamp
  source: 'user-upload';
  originalFilename?: string;
  component: {
    metadata: {
      type: string;
      name: string;
      category?: string;         // Defaults to 'custom'
      description?: string;
    };
    ui: any;                     // Full component definition
  };
}

// localStorage key: 'renderx:custom-components'
// Value: CustomComponent[]
```

## UI Mockup

```
┌─────────────────────────────────────┐
│ 🧩 Component Library                │
│ Drag components to the canvas       │
├─────────────────────────────────────┤
│                                     │
│ ┌─ CUSTOM COMPONENTS ─────────────┐│
│ │                                 ││
│ │  📁 Upload Component            ││
│ │  Drop .json file or click       ││
│ │  to browse                      ││
│ │                                 ││
│ │  ┌────────┐  ┌────────┐        ││
│ │  │ 🎨     │  │ 🔧     │        ││
│ │  │ Custom │  │ Widget │        ││
│ │  │ Button │  │        │        ││
│ │  └────────┘  └────────┘        ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─ BASIC COMPONENTS ──────────────┐│
│ │  ┌────────┐  ┌────────┐        ││
│ │  │ 🔘     │  │ 📝     │        ││
│ │  │ Button │  │ Input  │        ││
│ │  └────────┘  └────────┘        ││
│ └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

## Implementation Steps

### Phase 1: Storage & Validation (Foundation)
1. Create `src/utils/storage.utils.ts`
   - `saveCustomComponent(component)`
   - `loadCustomComponents()`
   - `removeCustomComponent(id)`
   - `clearCustomComponents()`

2. Create `src/utils/validation.utils.ts`
   - `validateComponentJson(json)`
   - `normalizeComponent(json)`

3. Add tests for storage and validation utilities

### Phase 2: Upload UI Component
1. Create `src/ui/CustomComponentUpload.tsx`
   - File drop zone with drag-over styling
   - File input for browse button
   - Validation feedback (success/error messages)
   - Loading state during file processing

2. Create `src/ui/CustomComponentList.tsx`
   - List of loaded custom components
   - Remove button for each component
   - Component metadata display

3. Add tests for UI components

### Phase 3: Integration with LibraryPanel
1. Update `src/symphonies/load.symphony.ts`
   - Modify `loadComponents` handler to load and merge custom components
   - Add custom components from storage to the component list

2. Update `src/utils/library.utils.js`
   - Add `"custom": "Custom Components"` to `categoryNames` in `getCategoryDisplayName()`
   - Modify category sorting to ensure "custom" appears first

3. Update `src/ui/LibraryPanel.tsx`
   - Import and render `CustomComponentUpload` in the "Custom Components" category
   - Sort categories to show "custom" first
   - Ensure CSS registration works for custom components

4. Update tests in `__tests__/LibraryPanel.spec.tsx`

### Phase 4: Polish & Documentation
1. Add CSS styling for upload zone and custom component indicators
2. Add error boundaries for custom component rendering
3. Update README.md with usage instructions
4. Add JSDoc comments to new utilities
5. Consider adding a "Import/Export Custom Components" feature for sharing

## Security Considerations

1. **XSS Prevention**: 
   - Sanitize any HTML content in custom components
   - Use DOMPurify or similar for user-provided HTML

2. **Code Injection**:
   - Do not use `eval()` or `Function()` on uploaded JSON
   - Parse JSON safely with `JSON.parse()`

3. **Storage Quota**:
   - Implement size limits per component (1MB)
   - Implement total storage limit (10MB)
   - Show storage usage indicator

4. **CSS Isolation**:
   - Consider using CSS modules or scoped styles
   - Prefix custom component CSS classes

## Open Questions

1. **Persistence Strategy**: Should we use localStorage or IndexedDB?
   - localStorage: Simpler, 5-10MB limit
   - IndexedDB: More complex, larger storage, better for binary data
   - **Recommendation**: Start with localStorage, migrate to IndexedDB if needed

2. **Component Versioning**: Should we support updating existing custom components?
   - Yes, with version tracking and migration support
   - Or keep it simple: delete and re-upload

3. **Export/Import**: Should users be able to export their custom components collection?
   - Useful for backup and sharing
   - Export as single JSON file with all custom components
   - Import should validate and merge (not replace)

4. **Component Sharing**: Should there be a way to share custom components with team members?
   - Could integrate with project workspace/repository
   - Export to file and share manually (simpler MVP)

5. **Hot Reload**: Should changes to custom components update live on the canvas?
   - Nice-to-have, not required for MVP
   - Would require more complex state management

## Success Criteria

- [ ] Users can drag-and-drop `.json` component files into the library
- [ ] Users can click to browse and upload component files
- [ ] Custom components persist across browser sessions
- [ ] Custom components appear in a "Custom Components" category (first category)
- [ ] Custom components can be dragged to canvas and render correctly
- [ ] Invalid JSON shows clear error messages
- [ ] Users can remove custom components
- [ ] All tests pass with >80% coverage
- [ ] No console errors or warnings
- [ ] Works in Chrome, Firefox, Safari, Edge

## Related Files

### Files to Modify
- `src/ui/LibraryPanel.tsx`
- `src/utils/library.utils.js`
- `src/symphonies/load.symphony.ts`
- `__tests__/LibraryPanel.spec.tsx`
- `__tests__/utils.spec.ts`

### Files to Create
- `src/ui/CustomComponentUpload.tsx`
- `src/ui/CustomComponentList.tsx`
- `src/utils/storage.utils.ts`
- `src/utils/validation.utils.ts`
- `__tests__/CustomComponentUpload.spec.tsx`
- `__tests__/CustomComponentList.spec.tsx`
- `__tests__/storage.utils.spec.ts`
- `__tests__/validation.utils.spec.ts`

## Estimated Complexity
**Medium-High** (3-5 days for experienced developer)

- Storage utilities: 4 hours
- Validation utilities: 4 hours
- Upload UI component: 8 hours
- Integration with LibraryPanel: 8 hours
- Testing: 8 hours
- Documentation & polish: 4 hours

**Total: ~36 hours**
