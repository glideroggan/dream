# UI Primitives Integration Plan

## Overview

This document outlines the phased approach to integrate the new UI primitives system into the existing KidWallet application. The primitives are already created and working; this plan covers replacing existing inline-styled elements with the new design-token-based primitives.

## Primitives Available

| Primitive | File | Purpose |
|-----------|------|---------|
| `<dream-button>` | `primitives/button/button.ts` | Primary, secondary, ghost, danger variants |
| `<dream-input>` | `primitives/input/input.ts` | Text inputs with label, error states |
| `<dream-select>` | `primitives/select/select.ts` | Dropdown selects with label |
| `<dream-card>` | `primitives/card/card.ts` | Content containers with padding variants |
| `<dream-checkbox>` | `primitives/checkbox-primitive.ts` | Checkbox with label |
| `<dream-toast>` | `primitives/toast/toast.ts` | Notification toasts (success, error, warning, info) |
| `<dream-skeleton>` | `primitives/skeleton/skeleton.ts` | Loading placeholders |
| `<dream-tooltip>` | `primitives/tooltip/tooltip.ts` | Hover tooltips |

## Phase 1: Widgets (Priority: High)

Widgets have the most inline-styled buttons that should use `<dream-button>`.

### 1.1 Account Widget
**File**: `app/src/widgets/account-widget/account-widget.ts`
**Elements to replace**:
- transfer-button -> `<dream-button variant="primary">`
- primary-button -> `<dream-button variant="primary">`
- cta-button -> `<dream-button variant="secondary">`
- action buttons -> `<dream-button variant="ghost">`

### 1.2 Swish Widget
**File**: `app/src/widgets/swish-widget.ts`
**Elements to replace**:
- transfer-button -> `<dream-button variant="primary">`
- history-button -> `<dream-button variant="ghost">`
- manage-button -> `<dream-button variant="ghost">`

### 1.3 Loans Widget
**File**: `app/src/widgets/loans/loans-widget.ts`
**Elements to replace**:
- payment-button -> `<dream-button variant="primary">`
- details-button -> `<dream-button variant="ghost">`
- new-loan-button -> `<dream-button variant="secondary">`
- Progress bars -> Consider creating `<dream-progress>` primitive

### 1.4 Welcome Widget
**File**: `app/src/widgets/welcome/welcome-widget.ts`
**Elements to replace**:
- action-button -> `<dream-button variant="primary">`
- dismiss-button -> `<dream-button variant="ghost">`
- Tab buttons -> Consider creating `<dream-tabs>` primitive

### 1.5 Financial Health Widget
**File**: `app/src/widgets/financial-health-widget/financial-health-widget.ts`
**Elements to replace**:
- primary-button -> `<dream-button variant="primary">`

### 1.6 Slow Widget
**File**: `app/src/widgets/slow-widget.ts`
**Elements to replace**:
- Progress bar -> Consider creating `<dream-progress>` primitive

---

## Phase 2: Workflows (Priority: Medium)

Workflows use forms with inputs, selects, and buttons.

### 2.1 Transfer Workflow
**File**: `app/src/workflows/transfer/transfer-workflow.ts`
**Elements to replace**:
- `<to-account-field>` -> Evaluate if `<dream-select>` can replace
- Already uses `<dream-checkbox>` (verify it's the primitive)
- Form buttons -> `<dream-button>`
- Text inputs -> `<dream-input>`

### 2.2 Swish Workflow
**File**: `app/src/workflows/swish-workflow.ts`
**Elements to replace**:
- `<dream-checkbox>` -> Verify using primitive version
- Form buttons -> `<dream-button>`
- Text inputs -> `<dream-input>`

### 2.3 Add Contact Workflow
**File**: `app/src/workflows/payments/add-contact-workflow.ts`
**Elements to replace**:
- `<dream-checkbox>` -> Verify using primitive version
- Form buttons -> `<dream-button>`
- Text inputs -> `<dream-input>`

### 2.4 KYC Workflow
**File**: `app/src/workflows/kyc/kyc-workflow.ts`
**Elements to replace**:
- `<kyc-basic>`, `<kyc-standard>`, `<kyc-enhanced>` components contain forms
- These sub-components should use primitives internally
- This is a larger refactor - may need dedicated pass

### 2.5 Other Workflows (Already Using Basic HTML)
These use basic HTML elements that can be replaced:
- `loan-workflow.ts` - buttons, inputs, selects
- `edit-upcoming-workflow.ts` - buttons, inputs, selects
- `create-account-workflow.ts` - buttons, inputs, selects
- `card-workflow.ts` - buttons, inputs, selects
- `account-info-workflow.ts` - buttons, inputs
- `card-detail-workflow.ts` - buttons
- `signing-workflow.ts` - buttons, inputs

---

## Phase 3: Missing Primitives (Priority: Low)

Based on widget/workflow analysis, these primitives should be created:

| Primitive | Use Case |
|-----------|----------|
| `<dream-progress>` | Progress bars in loans-widget, slow-widget |
| `<dream-tabs>` | Tab navigation in welcome-widget |
| `<dream-badge>` | Status badges in loans-widget |
| `<dream-modal>` | Already exists? Verify integration |

---

## Phase 4: Cleanup (Priority: Low)

After integration:
1. Remove unused inline styles from widgets/workflows
2. Audit for any remaining hardcoded colors
3. Verify dark mode works across all components
4. Update any remaining `<button>`, `<input>`, `<select>` to primitives

---

## Migration Strategy

### Per-Component Approach
1. Import the primitive: `import '@primitives/button/button.js'`
2. Replace inline-styled element with primitive
3. Map existing classes/styles to primitive variants/props
4. Test in both light and dark mode
5. Verify no visual regression

### Import Pattern
```typescript
// In component file
import '@primitives/button/button.js';
import '@primitives/input/input.js';

// In template
html`
  <dream-button variant="primary" @click=${this.handleClick}>
    Submit
  </dream-button>
`
```

---

## Verification Checklist

For each migrated component:
- [ ] Primitive imported correctly
- [ ] Visual appearance matches original (or improves)
- [ ] Dark mode contrast is good
- [ ] Focus states work for accessibility
- [ ] Click/input handlers still work
- [ ] No TypeScript errors
- [ ] No console errors

---

## Progress Tracking

### Phase 1: Widgets
- [ ] account-widget
- [ ] swish-widget
- [ ] loans-widget
- [ ] welcome-widget
- [ ] financial-health-widget
- [ ] slow-widget

### Phase 2: Workflows
- [ ] transfer-workflow
- [ ] swish-workflow
- [ ] add-contact-workflow
- [ ] kyc-workflow (+ sub-components)
- [ ] loan-workflow
- [ ] edit-upcoming-workflow
- [ ] create-account-workflow
- [ ] card-workflow
- [ ] account-info-workflow
- [ ] card-detail-workflow
- [ ] signing-workflow

### Phase 3: New Primitives
- [ ] dream-progress
- [ ] dream-tabs
- [ ] dream-badge

### Phase 4: Cleanup
- [ ] Remove unused styles
- [ ] Audit hardcoded colors
- [ ] Dark mode verification
- [ ] Final HTML element audit
