import { css } from "@microsoft/fast-element";

export const styles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    border-radius: 12px;
    overflow: hidden;
    box-sizing: border-box;
    transition: box-shadow var(--duration-normal, 180ms) var(--easing-default, ease),
                transform var(--duration-normal, 180ms) var(--easing-default, ease);
    
    /* Widget specific variables - use theme elevation system */
    --widget-background: var(--background-color, #ffffff); 
    --widget-header-background: linear-gradient(
      to bottom, 
      rgba(247, 249, 247, 0.8) 0%, 
      rgba(242, 246, 244, 0.4) 100%
    );
    --widget-shadow: var(--elevation-2, 0 2px 8px rgba(30, 58, 76, 0.08), 0 4px 16px rgba(30, 58, 76, 0.04));
    --widget-shadow-hover: var(--elevation-2-hover, 0 4px 12px rgba(30, 58, 76, 0.12), 0 8px 24px rgba(30, 58, 76, 0.06));
    
    /* Text colors - inherit from global theme */
    --widget-text-color: var(--primary-text-color, #333);
    --widget-header-text-color: var(--secondary-text-color, #666);
    --widget-subtle-text: var(--inactive-color, #888);
    
    /* Borders and dividers - use teal-tinted borders */
    --widget-border-color: var(--border-color, rgba(30, 58, 76, 0.08));
    --widget-border-radius: 12px;
    
    /* Primary action colors */
    --widget-primary-color: var(--accent-color, #0078d4);
    --widget-primary-hover: var(--primary-color, #005a9e);
    --widget-primary-text: var(--text-light, white);
    
    /* Secondary action colors */
    --widget-secondary-color: #f0f0f0;
    --widget-secondary-hover: #e0e0e0;
    
    /* Status colors */
    --widget-error-color: var(--notification-badge-bg, #dc3545);
    --widget-error-light: rgba(231, 76, 60, 0.1);
    
    /* Widget controls */
    --widget-close-color: var(--secondary-text-color, #999);
    --widget-title-color: var(--primary-text-color, #333);
    
    /* Spacing */
    --widget-header-padding: 0.5rem 1rem;
    --widget-content-padding: 1rem;
    
    /* Apply styles */
    background-color: var(--widget-background);
    box-shadow: var(--widget-shadow);
    border: 1px solid var(--widget-border-color);
  }
  
  :host(:hover) {
    box-shadow: var(--widget-shadow-hover);
    transform: translateY(-2px);
  }

  /* Dark theme support */
  :host-context(body.dark-theme) {
    --widget-background: var(--background-color, #243546);
    --widget-header-background: linear-gradient(
      to bottom,
      rgba(30, 46, 62, 0.9) 0%,
      rgba(36, 53, 70, 0.6) 100%
    );
    --widget-shadow: var(--elevation-2, 0 2px 8px rgba(0, 0, 0, 0.3));
    --widget-shadow-hover: var(--elevation-2-hover, 0 4px 16px rgba(0, 0, 0, 0.4));
    --widget-secondary-color: #2c3e50;
    --widget-secondary-hover: #34495e;
    --widget-error-light: rgba(231, 76, 60, 0.2);
    --widget-border-color: rgba(255, 255, 255, 0.08);
  }

  @media (prefers-color-scheme: dark) {
    :host-context(body:not(.light-theme-forced):not(.dark-theme)) {
      --widget-background: var(--background-color, #243546);
      --widget-header-background: linear-gradient(
        to bottom,
        rgba(30, 46, 62, 0.9) 0%,
        rgba(36, 53, 70, 0.6) 100%
      );
      --widget-shadow: var(--elevation-2, 0 2px 8px rgba(0, 0, 0, 0.3));
      --widget-shadow-hover: var(--elevation-2-hover, 0 4px 16px rgba(0, 0, 0, 0.4));
      --widget-secondary-color: #2c3e50;
      --widget-secondary-hover: #34495e;
      --widget-error-light: rgba(231, 76, 60, 0.2);
      --widget-border-color: rgba(255, 255, 255, 0.08);
    }
  }

  /* ================== WIDGET CONTAINER ================== */

  .widget-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    position: relative;
    background: var(--widget-background);
    border-radius: var(--widget-border-radius);
  }

  /* ================== HEADER ================== */

  .widget-header {
    position: relative;
    padding: var(--widget-header-padding);
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--widget-border-color);
    background: var(--widget-header-background);
    height: 44px;
    z-index: 10;
    user-select: none;
    cursor: grab;
    
    /* Subtle 3D border effect */
    box-shadow: var(--border-3d-shadow, 0 1px 0 rgba(255, 255, 255, 0.5));
  }
  
  .widget-header:active {
    cursor: grabbing;
  }

  .widget-header-left, 
  .widget-header-right {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .widget-header-left {
    justify-content: flex-start;
  }

  .widget-header-right {
    justify-content: flex-end;
    gap: 4px;
  }

  .widget-header-center {
    flex: 0 0 auto;
    max-width: 50%;
  }

  .widget-title {
    font-size: 0.9rem;
    font-weight: 600;
    text-align: center;
    color: var(--widget-title-color);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 100%;
    letter-spacing: 0.01em;
  }

  /* ================== DRAG HANDLE ================== */

  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    cursor: grab;
    opacity: 0.4;
    transition: opacity 0.2s, transform 0.2s, background-color 0.2s;
    border-radius: 6px;
    margin-right: 10px;
  }
  
  .drag-handle:hover {
    opacity: 1;
    background-color: var(--widget-secondary-hover, rgba(0, 0, 0, 0.08));
  }
  
  .drag-handle:active {
    cursor: grabbing;
    transform: scale(0.92);
    background-color: var(--widget-secondary-color, rgba(0, 0, 0, 0.12));
  }
  
  .drag-handle-icon {
    font-size: 16px;
    color: var(--widget-subtle-text, #888);
    line-height: 1;
    letter-spacing: 1px;
  }

  /* ================== CLOSE BUTTON ================== */

  .close-button {
    position: relative;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background-color: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--widget-close-color);
    z-index: 10;
    opacity: 0;
    padding: 0;
    transition: opacity 0.2s, background-color 0.2s, transform 0.2s;
  }
  
  .widget-container:hover .close-button {
    opacity: 0.6;
  }
  
  .close-button:hover {
    opacity: 1;
    background-color: rgba(220, 53, 69, 0.1);
    color: #dc3545;
  }
  
  .close-button:active {
    transform: scale(0.9);
  }
  
  .close-icon {
    font-size: 18px;
    line-height: 1;
  }

  /* ================== SETTINGS ================== */

  .settings-container {
    position: relative;
    display: inline-flex;
  }

  .settings-button {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background-color: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--widget-subtle-text, #888);
    z-index: 10;
    opacity: 0;
    padding: 0;
    transition: opacity 0.2s, background-color 0.2s, transform 0.2s, color 0.2s;
  }

  .widget-container:hover .settings-button {
    opacity: 0.7;
  }

  .settings-button:hover {
    opacity: 1;
    background-color: rgba(0, 120, 212, 0.1);
    color: var(--widget-primary-color, #0078d4);
  }

  .settings-button:active {
    transform: scale(0.9);
  }

  .settings-icon {
    font-size: 14px;
    line-height: 1;
  }

  .settings-popover {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: var(--widget-background, #fff);
    border: 1px solid var(--widget-border-color, #e0e0e0);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    padding: 12px;
    min-width: 160px;
    z-index: 1000;
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--widget-border-color, #e0e0e0);
    font-weight: 600;
    font-size: 13px;
    color: var(--widget-text-color, #333);
  }

  .settings-close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    color: var(--widget-subtle-text, #888);
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }

  .settings-close:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--widget-text-color, #333);
  }

  .settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .settings-row:last-child {
    margin-bottom: 0;
  }

  .settings-row label {
    font-size: 12px;
    color: var(--widget-text-color, #333);
    margin-right: 12px;
  }

  .span-input {
    width: 60px;
    padding: 4px 8px;
    border: 1px solid var(--widget-border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 12px;
    text-align: center;
    background: var(--widget-background, #fff);
    color: var(--widget-text-color, #333);
  }

  .span-input:focus {
    outline: none;
    border-color: var(--widget-primary-color, #0078d4);
    box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.1);
  }

  /* ================== WIDGET CONTENT ================== */

  .widget-content {
    flex: 1;
    padding: var(--widget-content-padding, 1rem);
    overflow: auto;
    position: relative;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  
  .widget-content.hidden {
    display: none;
  }

  .widget-content ::slotted(*) {
    min-height: 0;
    flex: 1;
  }

  /* ================== LOADING STATE ================== */

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    min-height: 150px;
    flex: 1;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid rgba(0, 120, 212, 0.2);
    border-top-color: var(--widget-primary-color, #0078d4);
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    color: var(--widget-subtle-text, #666);
    font-size: 0.875rem;
  }

  /* ================== ERROR STATE ================== */

  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    min-height: 150px;
    flex: 1;
    color: var(--widget-text-color, #721c24);
  }

  .error-icon {
    font-size: 2rem;
    font-weight: bold;
    color: var(--widget-error-color, #dc3545);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid var(--widget-error-color, #dc3545);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .error-message {
    margin-bottom: 1rem;
    max-width: 100%;
    word-break: break-word;
    font-size: 0.875rem;
  }

  .error-actions {
    display: flex;
    gap: 0.5rem;
  }

  .retry-button,
  .dismiss-button {
    padding: 6px 12px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 0.85rem;
  }

  .retry-button {
    background-color: var(--widget-primary-color, #0078d4);
    color: var(--widget-primary-text, white);
    border: none;
  }

  .retry-button:hover {
    background-color: var(--widget-primary-hover, #005a9e);
  }

  .dismiss-button {
    background-color: transparent;
    color: var(--widget-text-color, #333);
    border: 1px solid var(--widget-border-color, #ddd);
  }

  .dismiss-button:hover {
    background-color: var(--widget-secondary-hover, #e0e0e0);
  }

  /* State-based header styling */
  .widget-container[data-state="error"] .widget-header,
  .widget-container[data-state="timeout"] .widget-header {
    background-color: rgba(220, 53, 69, 0.1);
    border-bottom-color: rgba(220, 53, 69, 0.2);
  }

  /* ================== RESIZE HANDLES ================== */

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

  /* ================== DRAGGING/RESIZING STATES ================== */

  .widget-container.dragging {
    opacity: 0.7;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    transform: scale(1.02);
    z-index: 1000;
  }
  
  .widget-container.resizing {
    z-index: 1000;
  }

  :host(.widget-dragging) {
    opacity: 0.5;
    z-index: 1000;
  }
  
  :host(.widget-resizing) {
    z-index: 1000;
  }
`;
