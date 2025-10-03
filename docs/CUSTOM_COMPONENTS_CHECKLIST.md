# Custom Components Implementation Checklist

## Pre-Implementation
- [ ] Review and approve design in `ISSUE_CUSTOM_COMPONENTS.md`
- [ ] Review technical approach in `CUSTOM_COMPONENTS_SUMMARY.md`
- [ ] Create feature branch: `feature/custom-components`
- [ ] Set up development environment

## Phase 1: Foundation (Storage & Validation)

### Storage Utilities
- [ ] Create `src/utils/storage.utils.ts`
  - [ ] `saveCustomComponent(component, filename?)`
  - [ ] `loadCustomComponents()`
  - [ ] `removeCustomComponent(id)`
  - [ ] `clearCustomComponents()`
  - [ ] Add size limit checks (1MB per component, 10MB total)
- [ ] Create `__tests__/storage.utils.spec.ts`
  - [ ] Test save operation
  - [ ] Test load operation
  - [ ] Test remove operation
  - [ ] Test clear operation
  - [ ] Test size limit enforcement
  - [ ] Test localStorage fallback on errors
- [ ] Run tests: `npm test storage.utils.spec.ts`

### Validation Utilities
- [ ] Create `src/utils/validation.utils.ts`
  - [ ] `validateComponentJson(json)` - returns ValidationResult
  - [ ] `normalizeComponent(json)` - adds defaults
  - [ ] Helper: `checkFileSize(file)`
  - [ ] Helper: `checkDuplicateType(type)`
- [ ] Create `__tests__/validation.utils.spec.ts`
  - [ ] Test valid component JSON
  - [ ] Test missing metadata
  - [ ] Test missing metadata.type
  - [ ] Test missing metadata.name
  - [ ] Test missing ui/template
  - [ ] Test normalizeComponent adds category="custom"
- [ ] Run tests: `npm test validation.utils.spec.ts`

## Phase 2: UI Components

### Upload Component
- [ ] Create `src/ui/CustomComponentUpload.tsx`
  - [ ] File drop zone with drag-over state
  - [ ] Click-to-browse functionality
  - [ ] File validation (JSON only, size check)
  - [ ] Loading state display
  - [ ] Error message display
  - [ ] Success feedback
  - [ ] Call `onUpload` callback after successful upload
- [ ] Create `__tests__/CustomComponentUpload.spec.tsx`
  - [ ] Test render upload zone
  - [ ] Test drag-over state changes
  - [ ] Test file drop handling
  - [ ] Test click-to-browse
  - [ ] Test validation error display
  - [ ] Test loading state
- [ ] Run tests: `npm test CustomComponentUpload.spec.tsx`

### Component List (Optional for MVP)
- [ ] Create `src/ui/CustomComponentList.tsx` (if time permits)
  - [ ] List all custom components
  - [ ] Show component metadata
  - [ ] Remove button for each component
  - [ ] Confirm before delete
- [ ] Create `__tests__/CustomComponentList.spec.tsx`
  - [ ] Test list rendering
  - [ ] Test remove action

## Phase 3: Integration

### Update Category System
- [ ] Modify `src/utils/library.utils.js`
  - [ ] Add `custom: "Custom Components"` to `getCategoryDisplayName()`
  - [ ] Create `sortCategories(groups)` function
  - [ ] Modify `groupComponentsByCategory()` to sort with custom first
- [ ] Update `__tests__/utils.spec.ts`
  - [ ] Test custom category display name
  - [ ] Test category sorting order (custom first)
  - [ ] Test existing functionality still works
- [ ] Run tests: `npm test utils.spec.ts`

### Update Load Symphony
- [ ] Modify `src/symphonies/load.symphony.ts`
  - [ ] Import `loadCustomComponents` from storage.utils
  - [ ] Load custom components in `loadComponents` handler
  - [ ] Map custom components with `mapJsonComponentToTemplateCompat`
  - [ ] Merge custom components at beginning of list
- [ ] Update `__tests__/handlers.loadComponents.spec.ts`
  - [ ] Test custom components are loaded from storage
  - [ ] Test custom components merged with inventory
  - [ ] Test empty custom components array
- [ ] Run tests: `npm test handlers.loadComponents.spec.ts`

### Update LibraryPanel
- [ ] Modify `src/ui/LibraryPanel.tsx`
  - [ ] Import `CustomComponentUpload`
  - [ ] Add `reloadKey` state for forcing reload
  - [ ] Add `handleCustomUpload` callback
  - [ ] Include reloadKey in useEffect dependencies
  - [ ] Render `CustomComponentUpload` inside custom category
  - [ ] Ensure categories are sorted (custom first)
- [ ] Update `__tests__/LibraryPanel.spec.tsx`
  - [ ] Test custom category appears first
  - [ ] Test upload zone renders in custom category
  - [ ] Test reload after upload
- [ ] Run tests: `npm test LibraryPanel.spec.ts`

### Add Styling
- [ ] Update `src/ui/LibraryPanel.css`
  - [ ] `.custom-component-upload` styles
  - [ ] `.upload-zone` styles
  - [ ] `.upload-zone:hover` and `.drag-over` states
  - [ ] `.upload-icon` styles
  - [ ] `.upload-text` styles
  - [ ] `.upload-error` styles
  - [ ] Ensure responsive design

## Phase 4: Testing & QA

### Unit Tests
- [ ] All new unit tests pass
- [ ] Code coverage > 80% for new files
- [ ] Run full test suite: `npm test`
- [ ] Fix any failing tests

### Integration Tests
- [ ] Test custom component upload flow end-to-end
- [ ] Test persistence across page reloads
- [ ] Test error handling for invalid files

### Manual Testing
- [ ] Test drag-and-drop valid JSON file
- [ ] Test click-to-browse valid JSON file
- [ ] Test upload invalid JSON (shows error)
- [ ] Test upload JSON with missing fields (shows error)
- [ ] Test upload JSON with invalid structure (shows error)
- [ ] Test file too large (shows error)
- [ ] Test custom components persist after page reload
- [ ] Test custom category appears first
- [ ] Test custom component preview renders correctly
- [ ] Test drag custom component to canvas
- [ ] Test custom component CSS is applied

### Browser Compatibility
- [ ] Test in Chrome (latest)
- [ ] Test in Firefox (latest)
- [ ] Test in Safari (latest)
- [ ] Test in Edge (latest)

### Edge Cases
- [ ] Test with localStorage disabled
- [ ] Test with localStorage full/quota exceeded
- [ ] Test uploading duplicate component type
- [ ] Test uploading very large JSON (near limit)
- [ ] Test uploading 10+ components
- [ ] Test removing all custom components
- [ ] Test invalid JSON format

## Phase 5: Polish & Documentation

### Code Quality
- [ ] Run linter: `npm run lint`
- [ ] Fix all linting errors/warnings
- [ ] Add JSDoc comments to all new functions
- [ ] Add TypeScript types for all parameters
- [ ] Remove any console.logs or debug code

### Documentation
- [ ] Update `README.md` with usage instructions
- [ ] Add "Custom Components" section to README
  - [ ] How to upload custom components
  - [ ] Component JSON format requirements
  - [ ] Size limits and restrictions
  - [ ] How to remove custom components
- [ ] Add inline code comments for complex logic
- [ ] Create example custom component JSON

### Error Handling
- [ ] Add error boundaries around custom component rendering
- [ ] Ensure all errors are user-friendly
- [ ] Add fallback UI for failed components

## Phase 6: Code Review & Deployment

### Pre-Review
- [ ] Self-review all changes
- [ ] Test all functionality one more time
- [ ] Ensure no unrelated changes included
- [ ] Squash/clean up commit history if needed

### Code Review
- [ ] Create Pull Request
- [ ] Add description with screenshots/demos
- [ ] Link to issue/design documents
- [ ] Request review from team
- [ ] Address review feedback

### Deployment
- [ ] Merge to main branch
- [ ] Run CI/CD pipeline
- [ ] Verify build succeeds
- [ ] Tag release version (if applicable)
- [ ] Deploy to staging
- [ ] Test on staging environment
- [ ] Deploy to production

## Post-Launch

### Monitoring
- [ ] Monitor for errors in production
- [ ] Check localStorage usage patterns
- [ ] Gather user feedback

### Future Enhancements (Phase 2)
- [ ] Component management UI (edit, duplicate)
- [ ] Export/import custom components collection
- [ ] Component search/filter
- [ ] Component tags/categories
- [ ] Component versioning
- [ ] Team sharing capabilities

---

## Quick Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test storage.utils.spec.ts

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Build project
npm run build

# Start dev server (if applicable)
npm run dev
```

## Files Summary

### New Files (8)
1. `src/utils/storage.utils.ts` (~100 lines)
2. `src/utils/validation.utils.ts` (~60 lines)
3. `src/ui/CustomComponentUpload.tsx` (~120 lines)
4. `src/ui/CustomComponentList.tsx` (~80 lines, optional)
5. `__tests__/storage.utils.spec.ts` (~150 lines)
6. `__tests__/validation.utils.spec.ts` (~100 lines)
7. `__tests__/CustomComponentUpload.spec.tsx` (~150 lines)
8. `__tests__/CustomComponentList.spec.tsx` (~100 lines, optional)

### Modified Files (5)
1. `src/utils/library.utils.js` (+20 lines)
2. `src/symphonies/load.symphony.ts` (+15 lines)
3. `src/ui/LibraryPanel.tsx` (+30 lines)
4. `src/ui/LibraryPanel.css` (+50 lines)
5. `__tests__/utils.spec.ts` (+30 lines)
6. `__tests__/LibraryPanel.spec.tsx` (+20 lines)
7. `__tests__/handlers.loadComponents.spec.ts` (+40 lines)

### Documentation Files (3)
1. `ISSUE_CUSTOM_COMPONENTS.md` (this issue)
2. `CUSTOM_COMPONENTS_SUMMARY.md` (tech summary)
3. `README.md` (updated with usage)

**Total Estimated Changes**: ~1,000 lines of code + tests
