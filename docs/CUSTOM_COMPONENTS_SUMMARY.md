# Custom Components Feature - Implementation Summary

## Quick Overview

**Goal**: Add a "Custom Components" category to the library panel where users can upload their own component JSON files via drag-and-drop or file browser.

## Key Technical Findings

### Current Architecture
1. **Component Loading** (`src/symphonies/load.symphony.ts`):
   - Uses `window.RenderX.inventory.listComponents()` from Host SDK
   - Fallback to fetch from `/json-components/` directory
   - Components are mapped using `mapJsonComponentToTemplate()`

2. **Category System** (`src/utils/library.utils.js`):
   - Components grouped by `data-category` attribute or `metadata.category`
   - Category display names managed by `getCategoryDisplayName()`
   - Currently supports: "basic", "layout", "form", "ui"

3. **UI Rendering** (`src/ui/LibraryPanel.tsx`):
   - Groups components with `groupComponentsByCategory()`
   - Renders categories in Object.entries() order (non-deterministic)
   - Registers CSS for components via `registerCssForComponents()`

## Required Changes

### 1. Add "Custom" Category Support
**File**: `src/utils/library.utils.js`

```javascript
// Add to categoryNames map
custom: "Custom Components"

// Modify groupComponentsByCategory to ensure custom category appears first
export function groupComponentsByCategory(components) {
  const groups = {};
  
  components.forEach(component => {
    const category = component?.template?.attributes?.["data-category"] ||
                    component?.metadata?.category ||
                    "basic";

    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(component);
  });

  // Sort categories to ensure 'custom' comes first
  return sortCategories(groups);
}

function sortCategories(groups) {
  const order = ['custom', 'basic', 'layout', 'form', 'ui'];
  const sorted = {};
  
  // Add categories in preferred order
  order.forEach(cat => {
    if (groups[cat]) sorted[cat] = groups[cat];
  });
  
  // Add remaining categories
  Object.keys(groups).forEach(cat => {
    if (!sorted[cat]) sorted[cat] = groups[cat];
  });
  
  return sorted;
}
```

### 2. Create Storage Utilities
**New File**: `src/utils/storage.utils.ts`

```typescript
const STORAGE_KEY = 'renderx:custom-components';
const MAX_SIZE_MB = 10;

export interface CustomComponent {
  id: string;
  uploadedAt: string;
  source: 'user-upload';
  originalFilename?: string;
  component: any;
}

export function saveCustomComponent(component: any, filename?: string): string {
  const components = loadCustomComponents();
  const id = `custom-${component.metadata.type}-${Date.now()}`;
  
  const customComp: CustomComponent = {
    id,
    uploadedAt: new Date().toISOString(),
    source: 'user-upload',
    originalFilename: filename,
    component
  };
  
  components.push(customComp);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(components));
  
  return id;
}

export function loadCustomComponents(): CustomComponent[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function removeCustomComponent(id: string): void {
  const components = loadCustomComponents();
  const filtered = components.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
```

### 3. Create Validation Utilities
**New File**: `src/utils/validation.utils.ts`

```typescript
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateComponentJson(json: any): ValidationResult {
  const errors: string[] = [];
  
  if (!json.metadata) {
    errors.push('Missing required field: metadata');
  } else {
    if (!json.metadata.type) errors.push('Missing metadata.type');
    if (!json.metadata.name) errors.push('Missing metadata.name');
  }
  
  if (!json.ui && !json.template) {
    errors.push('Missing required field: ui or template');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function normalizeComponent(json: any): any {
  return {
    ...json,
    metadata: {
      ...json.metadata,
      category: json.metadata?.category || 'custom'
    }
  };
}
```

### 4. Create Upload Component
**New File**: `src/ui/CustomComponentUpload.tsx`

```tsx
import React, { useState } from 'react';
import { validateComponentJson, normalizeComponent } from '../utils/validation.utils';
import { saveCustomComponent } from '../utils/storage.utils';

export function CustomComponentUpload({ onUpload }: { onUpload: () => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      const validation = validateComponentJson(json);
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        return;
      }
      
      const normalized = normalizeComponent(json);
      saveCustomComponent(normalized, file.name);
      
      onUpload(); // Trigger reload
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON file');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      handleFile(file);
    } else {
      setError('Please drop a .json file');
    }
  };

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) handleFile(file);
    };
    input.click();
  };

  return (
    <div className="custom-component-upload">
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <span className="upload-icon">📁</span>
        <div className="upload-text">
          {loading ? 'Loading...' : 'Drop .json file or click to browse'}
        </div>
      </div>
      {error && <div className="upload-error">{error}</div>}
    </div>
  );
}
```

### 5. Modify Load Symphony
**File**: `src/symphonies/load.symphony.ts`

Add custom components loading:

```typescript
import { loadCustomComponents } from '../utils/storage.utils';

export const handlers = {
  async loadComponents(_data: any, ctx: any) {
    let list: any[] = [];
    
    try {
      // Load from inventory (existing code)
      // ... existing inventory loading code ...
      
      // Load custom components from storage
      const customComponents = loadCustomComponents();
      const customMapped = customComponents.map(cc => 
        mapJsonComponentToTemplateCompat(cc.component)
      );
      
      // Merge custom components with inventory components
      list = [...customMapped, ...list];
      
    } catch {
      // Leave list empty on error
    }

    ctx.payload.components = Array.isArray(list) ? list : [];
    return { count: ctx.payload.components.length };
  },
  // ... rest of handlers
};
```

### 6. Update LibraryPanel
**File**: `src/ui/LibraryPanel.tsx`

```tsx
import { CustomComponentUpload } from './CustomComponentUpload';

export function LibraryPanel() {
  const conductor = useConductor();
  const [items, setItems] = React.useState<any[]>([]);
  const [reloadKey, setReloadKey] = React.useState(0);

  const handleCustomUpload = () => {
    setReloadKey(k => k + 1); // Force reload
  };

  React.useEffect(() => {
    // ... existing load logic
  }, [conductor, reloadKey]); // Add reloadKey dependency

  const groupedComponents = groupComponentsByCategory(safeItems);

  return (
    <div className="library-sidebar">
      {/* ... header ... */}
      
      <div className="library-component-library rx-lib">
        {Object.entries(groupedComponents).map(([category, components]) => (
          <div key={category} className="library-component-category">
            <div className="library-category-title">
              {getCategoryDisplayName(category)}
            </div>
            
            {/* Add upload zone for custom category */}
            {category === 'custom' && (
              <CustomComponentUpload onUpload={handleCustomUpload} />
            )}
            
            <div className="library-component-grid">
              {components.map((component) => (
                <LibraryPreview
                  key={component.id}
                  component={component}
                  conductor={conductor}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 7. Add CSS Styles
**File**: `src/ui/LibraryPanel.css`

```css
.custom-component-upload {
  margin-bottom: 12px;
}

.upload-zone {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--panel-bg);
}

.upload-zone:hover,
.upload-zone.drag-over {
  border-color: var(--accent-border);
  background: var(--hover-bg);
  transform: translateY(-2px);
}

.upload-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 12px;
  color: var(--muted-text);
}

.upload-error {
  margin-top: 8px;
  padding: 8px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  font-size: 11px;
  color: #c00;
}
```

## Testing Strategy

### Unit Tests
1. **storage.utils.spec.ts**: Test save/load/remove operations
2. **validation.utils.spec.ts**: Test JSON validation rules
3. **utils.spec.ts**: Update to test category sorting

### Integration Tests
1. **CustomComponentUpload.spec.tsx**: Test file upload UI
2. **LibraryPanel.spec.tsx**: Update to test custom category rendering

### Manual Testing Checklist
- [ ] Drag-and-drop valid JSON file
- [ ] Click to browse and upload
- [ ] Upload invalid JSON (shows error)
- [ ] Upload component with missing fields (shows error)
- [ ] Custom components persist after refresh
- [ ] Custom category appears first
- [ ] Can drag custom component to canvas

## Migration Path

### Phase 1 (MVP)
- Basic file upload (drag-and-drop + browse)
- localStorage persistence
- Category sorting
- JSON validation

### Phase 2 (Enhancement)
- Component management UI (list, remove)
- Export/import custom components collection
- Component preview improvements
- Duplicate detection with merge option

### Phase 3 (Advanced)
- IndexedDB for larger storage
- Component versioning
- Team sharing capabilities
- Hot reload on component update

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| localStorage size limits | Medium | Start with 1MB per component limit, warn at 80% capacity |
| Invalid JSON crashes app | High | Comprehensive validation + error boundaries |
| CSS conflicts | Medium | Consider CSS scoping or namespacing |
| Security (XSS) | High | Sanitize all user-provided HTML content |
| Browser compatibility | Low | Test in major browsers, use polyfills if needed |

## Open Design Decisions

1. **Storage**: localStorage (simpler) vs IndexedDB (more scalable)
   - **Recommendation**: Start with localStorage

2. **Component Updates**: Allow editing vs delete-and-reupload
   - **Recommendation**: Delete-and-reupload for MVP

3. **Bulk Operations**: Import/export multiple components at once
   - **Recommendation**: Add in Phase 2

4. **Validation Strictness**: Strict validation vs permissive
   - **Recommendation**: Strict validation to prevent errors

## Resources Needed

- **Development Time**: ~36 hours (3-5 days)
- **Testing Time**: ~8 hours
- **Code Review**: ~2 hours
- **Documentation**: ~2 hours

**Total: ~48 hours (6 days)**
