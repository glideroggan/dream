import { css } from "@microsoft/fast-element";

/**
 * Design Tokens for Dream Primitive Library
 * 
 * These tokens provide consistent spacing, typography, radius, shadows,
 * motion, and z-index values across all primitive components.
 * 
 * Usage: Import and compose with component styles
 * ```typescript
 * import { designTokens } from "../tokens/design-tokens.css";
 * const styles = css`${designTokens} :host { ... }`;
 * ```
 * 
 * Or use the CSS variables directly in any component:
 * `padding: var(--space-md);`
 */

export const designTokens = css`
  :host {
    /* ============ SPACING (4px base scale) ============ */
    /* Use for padding, margins, gaps */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;
    --space-2xl: 48px;
    
    /* ============ TYPOGRAPHY ============ */
    /* Font sizes */
    --font-size-xs: 12px;
    --font-size-sm: 14px;
    --font-size-base: 16px;
    --font-size-lg: 18px;
    --font-size-xl: 24px;
    --font-size-2xl: 32px;
    
    /* Font weights */
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    
    /* Line heights */
    --line-height-tight: 1.25;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.75;
    
    /* Font family - matches theme */
    --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    
    /* ============ BORDER RADIUS ============ */
    /* sm: inputs, small chips, table cells */
    /* md: buttons, cards (default) */
    /* lg: modals, large panels */
    /* full: pills, avatars */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-full: 9999px;
    
    /* ============ ELEVATION (Shadows) ============ */
    /* sm: subtle cards */
    /* md: dropdowns, popovers */
    /* lg: modals, dialogs */
    /* xl: toasts, notifications */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
    
    /* ============ MOTION ============ */
    /* Durations */
    --duration-fast: 120ms;
    --duration-normal: 180ms;
    --duration-slow: 240ms;
    --duration-slower: 300ms;
    
    /* Easings */
    --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
    --easing-in: cubic-bezier(0.4, 0, 1, 1);
    --easing-out: cubic-bezier(0, 0, 0.2, 1);
    --easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
    
    /* ============ FOCUS RING ============ */
    /* Consistent, accessible focus indicator */
    --focus-ring-color: var(--accent-color, #88BDF2);
    --focus-ring-width: 2px;
    --focus-ring-offset: 2px;
    --focus-ring: 0 0 0 var(--focus-ring-offset) var(--background-color, #fff),
                  0 0 0 calc(var(--focus-ring-offset) + var(--focus-ring-width)) var(--focus-ring-color);
    
    /* ============ Z-INDEX SCALE ============ */
    /* Consistent layering across components */
    --z-base: 0;
    --z-dropdown: 100;
    --z-sticky: 200;
    --z-overlay: 300;
    --z-modal: 400;
    --z-toast: 500;
    --z-tooltip: 600;
    
    /* ============ COMPONENT-SPECIFIC TOKENS ============ */
    /* Button tokens */
    --button-padding-x-sm: var(--space-sm);
    --button-padding-y-sm: var(--space-xs);
    --button-padding-x-md: var(--space-md);
    --button-padding-y-md: var(--space-sm);
    --button-padding-x-lg: var(--space-lg);
    --button-padding-y-lg: var(--space-sm);
    --button-min-width: 80px;
    --button-border-radius: var(--radius-sm);
    
    /* Input tokens */
    --input-padding-x: var(--space-sm);
    --input-padding-y: 10px;
    --input-border-radius: var(--radius-sm);
    --input-border-width: 1px;
    --input-min-height: 40px;
    
    /* Card tokens */
    --card-padding: var(--space-md);
    --card-border-radius: var(--radius-md);
    
    /* Toast tokens */
    --toast-padding: var(--space-md);
    --toast-border-radius: var(--radius-md);
    --toast-max-width: 400px;
  }
  
  /* Dark theme adjustments for shadows */
  :host-context(body.dark-theme) {
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2);
    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.35), 0 10px 10px rgba(0, 0, 0, 0.25);
  }
  
  @media (prefers-color-scheme: dark) {
    :host-context(body:not(.light-theme-forced):not(.dark-theme)) {
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
      --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.2);
      --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2);
      --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.35), 0 10px 10px rgba(0, 0, 0, 0.25);
    }
  }
`;

/**
 * CSS string version for injection into global styles or non-FAST contexts
 */
export const designTokensCSS = `
  :root {
    /* Spacing */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;
    --space-2xl: 48px;
    
    /* Typography */
    --font-size-xs: 12px;
    --font-size-sm: 14px;
    --font-size-base: 16px;
    --font-size-lg: 18px;
    --font-size-xl: 24px;
    --font-size-2xl: 32px;
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    --line-height-tight: 1.25;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.75;
    
    /* Border Radius */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-full: 9999px;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
    
    /* Motion */
    --duration-fast: 120ms;
    --duration-normal: 180ms;
    --duration-slow: 240ms;
    --duration-slower: 300ms;
    --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
    --easing-in: cubic-bezier(0.4, 0, 1, 1);
    --easing-out: cubic-bezier(0, 0, 0.2, 1);
    
    /* Z-Index */
    --z-base: 0;
    --z-dropdown: 100;
    --z-sticky: 200;
    --z-overlay: 300;
    --z-modal: 400;
    --z-toast: 500;
    --z-tooltip: 600;
  }
`;
