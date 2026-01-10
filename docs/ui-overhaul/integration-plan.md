# UI Primitives Integration Plan

## Current Status

**Last Updated**: 2026-01-10  
**Branch**: `feature/ui-primitives-overhaul`

| Category | Total Files | Migrated | Remaining | Progress |
|----------|-------------|----------|-----------|----------|
| Workflows (forms) | 12 | 12 | 0 | 100% |
| KYC Sub-components | 5 | 5 | 0 | 100% |
| Workflows (buttons) | 4 | 4 | 0 | 100% |
| Widgets (buttons) | 0 | 0 | 0 | N/A |
| Other Components | 1 | 0 | 1 | 0% |

---

## Migration Status - Form Elements (Inputs/Selects/Checkboxes)

### ✅ COMPLETED

| File | Elements Migrated | Date | Notes |
|------|-------------------|------|-------|
| `workflows/transfer/transfer-workflow.ts` | 2 inputs, 1 select, 1 checkbox | 2026-01-10 | Fixed `markInvalid()` for custom elements |
| `workflows/create-account/create-account-workflow.ts` | 1 input, 1 select | 2026-01-10 | |
| `workflows/loan/loan-workflow.ts` | 1 input, 2 selects, 1 checkbox | 2026-01-10 | |
| `workflows/card/card-workflow.ts` | 1 select | 2026-01-10 | |
| `workflows/payments/add-contact-workflow.ts` | 4 inputs, 1 checkbox | 2026-01-10 | Has textarea (kept native) |
| `workflows/edit-upcoming-workflow.ts` | 5 inputs | 2026-01-10 | Removed redundant CSS |
| `workflows/account-info/account-info-workflow.ts` | 1 input (rename) | 2026-01-10 | Added focus()/select() to InputPrimitive |
| `kyc/kyc-basic-component.ts` | 4 inputs (text, email, tel, date) | 2026-01-10 | Fixed date picker calendar icon |
| `kyc/step1-component.ts` | 2 inputs (text, date), 1 select | 2026-01-10 | |
| `kyc/step2-component.ts` | 1 input, 1 select | 2026-01-10 | Has fake upload button (kept as-is) |
| `kyc/step3-component.ts` | 4 inputs, 1 select, 1 checkbox | 2026-01-10 | Migrated custom SVG checkbox to dream-checkbox |
| `kyc/kyc-enhanced-component.ts` | 3 inputs, 1 select, 2 checkboxes | 2026-01-10 | File input kept native (no primitive) |

**Primitives fixed during migration:**
- `dream-input`: Added `date`/`time` type support, fixed CustomEvent emission, added `focus()`/`select()` methods
- `dream-select`: Fixed Shadow DOM slot handling (options sync)

---

### ✅ KYC Workflows - COMPLETE

All KYC components have been migrated to use UI primitives:

| File | Migrated Elements | Notes |
|------|-------------------|-------|
| `kyc-basic-component.ts` | 4 `dream-input` | text, email, tel, date types |
| `step1-component.ts` | 2 `dream-input`, 1 `dream-select` | Personal info form |
| `step2-component.ts` | 1 `dream-input`, 1 `dream-select` | ID verification form |
| `step3-component.ts` | 4 `dream-input`, 1 `dream-select`, 1 `dream-checkbox` | Address form with consent |
| `kyc-enhanced-component.ts` | 3 `dream-input`, 1 `dream-select`, 2 `dream-checkbox` | Enhanced verification |

**Total migrated**: 15 inputs, 4 selects, 4 checkboxes

---

### ⚪ PENDING - Other Workflows (TO AUDIT)

| File | Status | Notes |
|------|--------|-------|
| `workflows/swish-workflow.ts` | ✅ Uses `dream-checkbox` | No raw inputs found |
| `workflows/account-info/account-info-workflow.ts` | ✅ Migrated | 1 text input (rename) → `dream-input` |
| `workflows/card-detail/card-detail-workflow.ts` | ✅ No migration needed | Uses `dream-button` already, no form inputs |
| `workflows/signing/signing-workflow.ts` | ✅ No migration needed | Uses native buttons (Phase 2), no form inputs |

---

### ⚪ LOW PRIORITY - Components

| File | Raw Elements | Notes |
|------|-------------|-------|
| `components/widget-wrapper-v2/widget-wrapper-v2-template.ts` | 2 number inputs | Admin settings panel - likely to be deprecated |

---

## Notes for Later

Capture decisions to be made after the migration is complete:

| Element/Pattern | Where Found | Notes | Decision |
|-----------------|-------------|-------|----------|
| `<input type="file">` | kyc-enhanced-component.ts | No `dream-file-input` primitive exists | **KEEP NATIVE** - file inputs work fine as-is |
| `<textarea>` | add-contact-workflow.template.ts | No `dream-textarea` primitive exists | TBD - create primitive or keep native? |
| `<to-account-field>` | transfer-workflow | Custom autocomplete component | Intentionally NOT migrated - specialized component |
| ~~Custom SVG checkbox~~ | ~~step3-component.ts~~ | ~~Hand-rolled checkbox with SVG checkmark~~ | ✅ Migrated to `dream-checkbox` |
| ~~Native checkboxes~~ | ~~kyc-enhanced-component.ts~~ | ~~2 checkboxes using native `<input type="checkbox">`~~ | ✅ Migrated to `dream-checkbox` |
| **Date picker calendar icon** | `dream-input type="date"` | Browser limitation: native date picker popup may not render properly in Shadow DOM | **DEFER** - Consider custom date picker component or JS library (flatpickr) if needed |

---

## Established Patterns

### Import Pattern
```typescript
import '@primitives/input'
import '@primitives/select'
import '@primitives/checkbox-primitive'
```

### Event Handling (FAST Element)

Primitives emit CustomEvents via `$emit()`:
```typescript
// In primitive (dream-input, dream-select)
this.$emit('input', { value: this.value, name: this.name });
this.$emit('change', { value: this.value, name: this.name });
```

Consumers handle events:
```typescript
handleAmountChange(event: Event) {
  const customEvent = event as CustomEvent;
  this.amount = customEvent.detail?.value;
}
```

### Validation Pattern for Custom Elements

Custom elements don't have `setCustomValidity()`. Use the `error` attribute instead:

```typescript
private markInvalid(elementId: string): void {
  const element = this.shadowRoot?.getElementById(elementId);
  if (element) {
    if ('error' in element) {
      // Custom element (dream-input, dream-select)
      (element as any).error = true;
      (element as any).errorMessage = this.errorMessage;
    } else if ('setCustomValidity' in element) {
      // Native element
      (element as HTMLInputElement).setCustomValidity(this.errorMessage!);
      (element as HTMLInputElement).reportValidity();
    }
  }
}

private resetInvalidStates(): void {
  ['field1', 'field2'].forEach((id) => {
    const element = this.shadowRoot?.getElementById(id);
    if (element) {
      if ('error' in element) {
        (element as any).error = false;
        (element as any).errorMessage = '';
      } else if ('setCustomValidity' in element) {
        (element as HTMLInputElement).setCustomValidity('');
      }
    }
  });
}
```

---

## Primitives Available

| Primitive | File | Supported Types/Variants |
|-----------|------|--------------------------|
| `<dream-input>` | `primitives/input/input.ts` | text, email, password, search, tel, url, date, time, number |
| `<dream-select>` | `primitives/select/select.ts` | - |
| `<dream-checkbox>` | `primitives/checkbox-primitive.ts` | - |
| `<dream-button>` | `primitives/button/button.ts` | primary, secondary, ghost, danger |
| `<dream-card>` | `primitives/card/card.ts` | - |
| `<dream-toast>` | `primitives/toast/toast.ts` | success, error, warning, info |
| `<dream-skeleton>` | `primitives/skeleton/skeleton.ts` | - |
| `<dream-tooltip>` | `primitives/tooltip/tooltip.ts` | - |

---

## Next Steps

### ✅ Immediate (Form Elements) - COMPLETE
~~1. **Migrate KYC workflows** - 5 files, fixes date picker issue~~

### Remaining Audits
~~2. **Audit remaining workflows**~~
   ~~- account-info-workflow~~ ✅ Migrated
   ~~- card-detail-workflow~~ ✅ No form inputs
   ~~- signing-workflow~~ ✅ Buttons only (Phase 2)

### Later (Buttons - Phase 2) - ✅ COMPLETE
~~3. **Migrate workflow buttons to `dream-button`**~~

Migrated files:
- `kyc/kyc-enhanced-component.ts` - 2 buttons (remove, submit)
- `kyc/kyc-basic-component.ts` - 1 button (submit)
- `kyc/step2-component.ts` - 1 button (upload)
- `signing/signing-workflow.ts` - 8 buttons (examples, actions, demo controls)

### Future (New Primitives - Phase 3)
4. **Evaluate need for new primitives**
   - `dream-textarea`
   - `dream-file-input` (low priority - native works fine)
   - `dream-progress`
   - `dream-tabs`
   - `dream-badge`

---

## Verification Checklist

For each migrated component:
- [ ] Import primitive (`import '@primitives/input'`)
- [ ] Replace raw HTML element with primitive
- [ ] Update event handlers to use `CustomEvent.detail.value`
- [ ] Update validation to use `error` attribute (not `setCustomValidity`)
- [ ] Remove redundant CSS for migrated elements
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Verify focus states (accessibility)
- [ ] Build passes (`npm run build`)
- [ ] No console errors

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-01-10 | **Button Migration Complete (Phase 2)** - Migrated 12 buttons in 4 files (kyc-enhanced, kyc-basic, step2, signing) |
| 2026-01-10 | **Workflow Audit Complete** - Migrated account-info-workflow rename input, added focus()/select() to InputPrimitive |
| 2026-01-10 | **KYC Migration Complete** - Migrated all 5 KYC components (15 inputs, 4 selects, 4 checkboxes) |
| 2026-01-10 | Added detailed migration status, completed 6 workflow migrations, documented patterns |
| (initial) | Created initial integration plan |
