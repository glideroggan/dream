import { css } from "@microsoft/fast-element";
import { MAX_GRID_COLUMNS, MAX_GRID_ROWS } from "../../constants/grid-constants";

// Generate dynamic CSS for row and column span classes
const generateSpanSelectorStyles = () => {
  let styles = '';
  
  // Generate styles for all possible spans
  for (let i = 1; i <= Math.max(MAX_GRID_COLUMNS, MAX_GRID_ROWS); i++) {
    // Add rules for both column and row spans
    styles += `
    :host(.col-span-${i}) {
      grid-column: span ${i};
    }
    :host(.row-span-${i}) {
      grid-row: span ${i};
    }
    `;
  }
  
  return styles;
};

export const styles = css`
  :host {
    display: block;
    width: 100%;
    height: auto;
    min-height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    border-radius: 8px;
    overflow: hidden;
    box-sizing: border-box;
    
    /* Widget specific variables with appropriate defaults and global fallbacks */
    /* Backgrounds and colors - distinct from parent for visual separation */
    --widget-background: #ffffff; 
    --widget-header-background: #fafafa;
    --widget-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    /* Text colors - inherit from global theme */
    --widget-text-color: var(--primary-text-color);
    --widget-header-text-color: var(--secondary-text-color);
    --widget-subtle-text: var(--inactive-color);
    
    /* Borders and dividers - inherit from global theme */
    --widget-border-color: var(--border-color, rgba(0,0,0,0.08));
    --widget-border-radius: 8px;
    --widget-divider-color: var(--divider-color);
    
    /* Primary action colors - inherit from global theme */
    --widget-primary-color: var(--accent-color);
    --widget-primary-hover: var(--primary-color);
    --widget-primary-text: var(--text-light);
    
    /* Secondary action colors - widget specific with appropriate defaults */
    --widget-secondary-color: #f0f0f0;
    --widget-secondary-hover: #e0e0e0;
    --widget-secondary-text: var(--primary-text-color);
    
    /* Status colors - use semantic colors from global theme */
    --widget-success-color: var(--widget-color);
    --widget-warning-color: var(--workflow-color);
    --widget-error-color: var(--notification-badge-bg);
    --widget-success-light: var(--widget-bg);
    --widget-warning-light: var(--workflow-bg);
    --widget-error-light: rgba(231, 76, 60, 0.1);
    
    /* Widget controls - buttons, headers, etc. */
    --widget-close-color: var(--secondary-text-color, #777);
    --widget-title-color: var(--primary-text-color, #333);
    
    /* Spacing - widget specific */
    --widget-padding: 16px;
    --widget-header-padding: 0.3rem 0.75rem;
    --widget-content-padding: 1rem;
    
    /* Control colors - derive from theme */
    --size-button-bg: var(--widget-secondary-color, #f0f0f0);
    --size-button-border: var(--widget-border-color, #ddd);
    --size-button-color: var(--widget-text-color, #666);
    --size-button-hover-bg: var(--widget-secondary-hover, #e0e0e0);
    --size-button-hover-border: var(--widget-border-color, #ccc);
    --size-button-active-bg: var(--widget-primary-color, #0078d4);
    --size-button-active-border: var(--widget-primary-color, #0078d4);
    --size-button-active-color: var(--widget-primary-text, white);
    
    /* Apply styles */
    background-color: var(--widget-background);
    box-shadow: var(--widget-shadow);
  }

  /* Apply dark theme styles when body has dark-theme class */
  :host-context(body.dark-theme) {
    --widget-background: #243546; /* Slightly lighter than app background for contrast */
    --widget-header-background: #1e2e3e;
    --widget-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    --widget-secondary-color: #2c3e50;
    --widget-secondary-hover: #34495e;
    --widget-error-light: rgba(231, 76, 60, 0.2);
    --widget-warning-light: rgba(243, 156, 18, 0.2);
    --widget-success-light: rgba(46, 204, 113, 0.2);
  }

  /* Support prefers-color-scheme when no explicit theme class is set */
  @media (prefers-color-scheme: dark) {
    :host-context(body:not(.light-theme-forced):not(.dark-theme)) {
      --widget-background: #243546;
      --widget-header-background: #1e2e3e;
      --widget-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      --widget-secondary-color: #2c3e50;
      --widget-secondary-hover: #34495e;
      --widget-error-light: rgba(231, 76, 60, 0.2);
      --widget-warning-light: rgba(243, 156, 18, 0.2);
      --widget-success-light: rgba(46, 204, 113, 0.2);
    }
  }

  /* Generate dynamic span selectors for host element */
  ${generateSpanSelectorStyles()}
  
  /* Only allow tooltips on interactive elements */
  :host .widget-wrapper:not(button):not([role="button"]):not(a)[title] {
    title: none;
  }
  
  .widget-wrapper {
    height: 100%;
    width: 100%;
    border-radius: var(--widget-border-radius);
    overflow: hidden;
    position: relative;
    background: var(--widget-background);
    box-shadow: var(--widget-shadow);
    box-sizing: border-box;
  }

  .widget-container {
    display: flex;
    flex-direction: column;
    height: auto; /* Changed from 100% to auto to allow shrinking */
    /* min-height: 100%; removed to allow shrinking */
    overflow: hidden; /* Let child elements handle their own overflow */
    position: relative; /* Required for absolutely positioned resize handles */
  }

  .widget-header {
    position: relative;
    padding: var(--widget-header-padding);
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--widget-border-color);
    background-color: var(--widget-header-background);
    height: 40px;
    z-index: 10; /* Keep header above widget content */
  }

  .widget-header-left, 
  .widget-header-right {
    flex: 1;
    display: flex;
  }

  .widget-header-left {
    justify-content: flex-start;
  }

  .widget-header-right {
    justify-content: flex-end;
  }

  .widget-header-center {
    flex: 0 0 auto;
    // padding: 0 8px;
    /* Ensure center content doesn't push out too far */
    max-width: 50%;
  }

  .widget-header h3 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--widget-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .widget-size-controls {
    display: flex;
    gap: 4px;
    margin-right: 12px;
    z-index: 10; /* Ensure controls are above other elements */
    position: relative; /* Create a stacking context */
    z-index: 15; /* Even higher than the header itself */
  }

  .size-button {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background-color: var(--size-button-bg);
    border: 1px solid var(--size-button-border);
    color: var(--size-button-color);
    font-size: 12px;
    font-weight: bold;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .size-button:hover {
    background-color: var(--size-button-hover-bg);
    border-color: var(--size-button-hover-border);
  }

  .size-button-active {
    background-color: var(--size-button-active-bg);
    border-color: var(--size-button-active-border);
    color: var(--size-button-active-color);
  }

  .widget-title {
    font-size: 1rem;
    font-weight: 600;
    text-align: center;
    color: var(--widget-title-color);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 100%;
  }

  /* Close button styles */
  .close-button {
    position: relative;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 18px;
    color: var(--widget-header-text-color);
    z-index: 10;
    opacity: 0.6;
    margin-left: 8px;
    padding: 0;
    background: none;
    cursor: pointer;
    color: var(--widget-close-color);
    font-size: 1.2rem;
    line-height: 1;
    padding: 0 0 0 8px;
    margin-left: auto;
  }
  
  .close-button:hover {
    opacity: 1;
    background-color: var(--widget-secondary-hover);
    color: var(--widget-text-color);
  }

  /* Only show close button on hover for cleaner look */
  .close-button {
    opacity: 0.6;
    transform: scale(0.8);
    transition: opacity 0.2s, transform 0.2s;
  }

  .widget-wrapper:hover .close-button {
    opacity: 0.8;
    transform: scale(1);
  }
  
  /* Add X to close button */
  .close-button::before,
  .close-button::after {
    content: '';
    position: absolute;
    width: 2px;
    height: 12px;
    background-color: currentColor;
    top: 6px;
  }
  
  .close-button::before {
    transform: rotate(45deg);
  }
  
  .close-button::after {
    transform: rotate(-45deg);
  }
  
  .widget-loading, .widget-error, .widget-timeout {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    text-align: center;
    color: var(--widget-text-color);
    box-sizing: border-box;
    overflow: auto;
    position: relative;
  }
  
  .widget-error {
    background-color: var(--widget-background);
    border: 1px solid var(--widget-error-light);
  }
  
  .widget-import-error {
    border: 1px solid var(--widget-warning-light, #fdebd0);
    background-color: var(--widget-warning-light);
  }
  
  .module-path {
    display: block;
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    margin: 0.5rem 0;
    font-size: 0.8rem;
    max-width: 100%;
    overflow-x: auto;
    white-space: nowrap;
    text-align: left;
    max-width: 90%;
  }
  
  .widget-error h3 {
    color: var(--widget-error-color);
    margin-top: 0;
    margin-bottom: 0.75rem;
    font-size: 1rem;
  }
  
  .widget-import-error h3 {
    color: var(--widget-warning-color);
  }
  
  .widget-error p {
    margin: 0.5rem 0;
    max-width: 100%;
    overflow-wrap: break-word;
    word-wrap: break-word;
    font-size: 0.9rem;
  }
  
  .widget-identifier {
    font-size: 0.7rem;
    color: var(--widget-subtle-text);
    margin-top: 0.5rem;
    font-style: italic;
    opacity: 0.75;
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--widget-primary-color);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 0.75rem;
    flex-shrink: 0;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .action-buttons {
    display: flex;
    margin-top: 1rem;
  }
  
  .retry-button, .dismiss-button, .cancel-button {
    padding: 6px 12px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 0.85rem;
    flex-shrink: 0;
  }
  
  .retry-button {
    background-color: var(--widget-primary-color);
    color: var(--widget-primary-text);
    border: none;
  }
  
  .retry-button:hover {
    background-color: var(--widget-primary-hover);
  }
  
  .dismiss-button {
    background-color: transparent;
    color: var(--widget-text-color);
    border: 1px solid var(--widget-border-color);
    margin-left: 0.5rem;
  }
  
  .dismiss-button:hover {
    background-color: var(--widget-secondary-hover);
  }
  
  .cancel-button {
    background-color: transparent;
    color: var(--widget-text-color);
    border: 1px solid var(--widget-border-color);
    margin-top: 0.75rem;
  }
  
  .cancel-button:hover {
    background-color: var(--widget-secondary-hover);
  }

  .widget-content {
    flex: 1;
    padding: var(--widget-content-padding, 1rem);
    overflow: auto; /* Changed from visible to auto to ensure content is scrollable */
    position: relative;
    min-height: 0; /* Allow content to determine sizing within constraints */
    display: flex;
    flex-direction: column;
  }

  /* Special styling for welcome widget to fill available space */
  .widget-content.welcome-content {
    padding: 0; /* Remove padding to maximize space */
    position: relative; /* Create stacking context */
    z-index: 1; /* Lower z-index than controls */
  }

  .widget-content ::slotted(*) {
    min-height: 0;
    flex: 1; /* Make slotted elements fill the available space */
  }

  /* Only add scrollbars when content is too large for the allocated grid cell */
  .widget-content.overflow {
    overflow: auto;
  }

  .loading-container,
  .error-container,
  .timeout-warning-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    min-height: 150px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid rgba(0, 120, 212, 0.2);
    border-top-color: #0078d4;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .loading-text {
    color: #666;
  }

  .timeout-warning-message {
    color: #856404;
    margin-bottom: 1rem;
  }

  .timeout-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .timeout-button {
    padding: 0.375rem 0.75rem;
    border-radius: 4px;
    border: 1px solid var(--widget-border-color);
    background-color: var(--widget-background);
    cursor: pointer;
    color: var(--widget-text-color);
  }

  .timeout-button-wait {
    background-color: var(--widget-primary-color);
    border-color: var(--widget-primary-color);
    color: var(--widget-primary-text);
  }

  .timeout-button-wait:hover {
    background-color: #bbdefb;
  }

  .error-container {
    color: #721c24;
    overflow: hidden;
  }

  .error-icon {
    font-size: 2rem;
    font-weight: bold;
    color: #dc3545;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid #dc3545;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .error-message {
    margin-bottom: 1rem;
    max-width: 100%;
    word-break: break-word;
  }

  /* State-based styling */
  .widget-container[state="error"] .widget-header,
  .widget-container[state="import-error"] .widget-header {
    background-color: rgba(220, 53, 69, 0.1);
    border-bottom-color: rgba(220, 53, 69, 0.2);
  }

  .widget-container[state="timeout-warning"] .widget-header {
    background-color: rgba(255, 193, 7, 0.1);
    border-bottom-color: rgba(255, 193, 7, 0.2);
  }

  @media (max-width: 300px) {
    .widget-error, .widget-loading, .widget-timeout {
      padding: 0.75rem;
    }
    
    .widget-error h3 {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    
    .widget-error p {
      font-size: 0.8rem;
    }
    
    .retry-button, .dismiss-button, .cancel-button {
      padding: 4px 8px;
      font-size: 0.75rem;
    }
  }

  .span-controls {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-right: 10px;
  }

  .span-control-group {
    display: flex;
    align-items: center;
    background-color: var(--widget-secondary-color);
    border-radius: 4px;
    padding: 0 2px;
    border: 1px solid var(--widget-border-color);
  }

  .span-label {
    font-size: 10px;
    color: var(--widget-subtle-text);
    padding: 0 2px;
    font-weight: bold;
  }

  .span-value {
    font-size: 12px;
    width: 18px;
    text-align: center;
    font-weight: 600;
    color: var(--widget-text-color);
  }

  .span-button {
    border: none;
    background: transparent;
    width: 20px;
    height: 20px;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 0;
    margin: 0;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    position: relative; /* Create stacking context */
    z-index: 20; /* Higher than any other UI element */
    isolation: isolate; /* Create stacking context */
  }

  .span-button:hover {
    background-color: rgba(0, 0, 0, 0.15);
    transform: scale(1.1);
  }
  
  .span-button:active {
    background-color: rgba(0, 0, 0, 0.25);
    transform: scale(0.95);
  }

  .auto-size-toggle {
    width: 24px;
    height: 20px;
    border-radius: 4px;
    background-color: var(--widget-secondary-color);
    border: 1px solid var(--widget-border-color);
    color: var(--widget-text-color);
    font-size: 11px;
    font-weight: bold;
    padding: 0;
    margin-left: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .auto-size-toggle:hover {
    background-color: var(--widget-secondary-hover);
  }
  
.auto-size-toggle.active {
    background-color: var(--widget-primary-color);
    border-color: var(--widget-primary-color);
    color: var(--widget-primary-text);
  }

  /* ================== DRAG HANDLE STYLES ================== */
  
  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    cursor: grab;
    opacity: 0.5;
    transition: opacity 0.2s, transform 0.2s;
    border-radius: 4px;
    margin-right: 8px;
  }
  
  .drag-handle:hover {
    opacity: 1;
    background-color: var(--widget-secondary-hover, rgba(0, 0, 0, 0.05));
  }
  
  .drag-handle:active {
    cursor: grabbing;
    transform: scale(0.95);
  }
  
  .drag-handle-icon {
    font-size: 14px;
    color: var(--widget-subtle-text, #999);
    line-height: 1;
  }
  
  /* Size indicator (read-only display) */
  .size-indicator {
    font-size: 11px;
    color: var(--widget-subtle-text, #999);
    padding: 2px 6px;
    background-color: var(--widget-secondary-color, rgba(0, 0, 0, 0.05));
    border-radius: 4px;
    margin-right: 8px;
    font-family: monospace;
  }
  
  /* ================== RESIZE HANDLE STYLES ================== */
  
  .resize-handle {
    position: absolute;
    z-index: 100;
    opacity: 0;
    transition: opacity 0.2s, background-color 0.2s;
  }
  
  /* Show resize handles on hover */
  .widget-container:hover .resize-handle {
    opacity: 1;
  }
  
  /* Corner resize handles */
  .resize-handle-se,
  .resize-handle-sw,
  .resize-handle-ne,
  .resize-handle-nw {
    width: 16px;
    height: 16px;
    background-color: var(--widget-primary-color, #0078d4);
    border-radius: 50%;
    border: 2px solid var(--widget-background, #fff);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .resize-handle-se {
    bottom: -6px;
    right: -6px;
    cursor: nwse-resize;
  }
  
  .resize-handle-sw {
    bottom: -6px;
    left: -6px;
    cursor: nesw-resize;
  }
  
  .resize-handle-ne {
    top: -6px;
    right: -6px;
    cursor: nesw-resize;
  }
  
  .resize-handle-nw {
    top: -6px;
    left: -6px;
    cursor: nwse-resize;
  }
  
  /* Edge resize handles */
  .resize-handle-e,
  .resize-handle-w {
    width: 6px;
    height: calc(100% - 32px);
    top: 16px;
    background-color: transparent;
  }
  
  .resize-handle-e:hover,
  .resize-handle-w:hover {
    background-color: var(--widget-primary-color, #0078d4);
    opacity: 0.3;
  }
  
  .resize-handle-e {
    right: 0;
    cursor: ew-resize;
  }
  
  .resize-handle-w {
    left: 0;
    cursor: ew-resize;
  }
  
  .resize-handle-n,
  .resize-handle-s {
    height: 6px;
    width: calc(100% - 32px);
    left: 16px;
    background-color: transparent;
  }
  
  .resize-handle-n:hover,
  .resize-handle-s:hover {
    background-color: var(--widget-primary-color, #0078d4);
    opacity: 0.3;
  }
  
  .resize-handle-n {
    top: 0;
    cursor: ns-resize;
  }
  
  .resize-handle-s {
    bottom: 0;
    cursor: ns-resize;
  }
  
  /* Resize handle hover states */
  .resize-handle:hover {
    opacity: 1 !important;
    transform: scale(1.2);
  }
  
  /* ================== DRAGGING STATE STYLES ================== */
  
  .widget-container.dragging {
    opacity: 0.7;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    transform: scale(1.02);
    z-index: 1000;
  }
  
  :host(.widget-dragging) {
    opacity: 0.5;
    z-index: 1000;
    /* Note: Do NOT use pointer-events: none here - it cancels the HTML5 drag operation */
  }
  
  :host(.widget-resizing) {
    z-index: 1000;
  }
  
  /* Make header draggable */
  .widget-header {
    cursor: grab;
  }
  
  .widget-header:active {
    cursor: grabbing;
  }
`;
