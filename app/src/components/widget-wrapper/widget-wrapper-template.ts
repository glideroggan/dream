import { html, when } from "@microsoft/fast-element";
import { WidgetWrapper } from "./widget-wrapper";

export const template = html<WidgetWrapper>/*html*/`
  <div class="widget-container ${x => x.isDragging ? 'dragging' : ''}" state="${x => x.state}">
    <!-- Resize handles (corners) -->
    ${when(x => x.showSizeControls, html<WidgetWrapper>/*html*/`
      <div class="resize-handle resize-handle-se" 
           @pointerdown="${(x, c) => x.handleResizeStart(c.event as PointerEvent, 'se')}"
           title="Drag to resize"></div>
      <div class="resize-handle resize-handle-sw" 
           @pointerdown="${(x, c) => x.handleResizeStart(c.event as PointerEvent, 'sw')}"
           title="Drag to resize"></div>
      <div class="resize-handle resize-handle-ne" 
           @pointerdown="${(x, c) => x.handleResizeStart(c.event as PointerEvent, 'ne')}"
           title="Drag to resize"></div>
      <div class="resize-handle resize-handle-nw" 
           @pointerdown="${(x, c) => x.handleResizeStart(c.event as PointerEvent, 'nw')}"
           title="Drag to resize"></div>
      <!-- Edge resize handles -->
      <div class="resize-handle resize-handle-e" 
           @pointerdown="${(x, c) => x.handleResizeStart(c.event as PointerEvent, 'e')}"
           title="Drag to resize width"></div>
      <div class="resize-handle resize-handle-w" 
           @pointerdown="${(x, c) => x.handleResizeStart(c.event as PointerEvent, 'w')}"
           title="Drag to resize width"></div>
      <div class="resize-handle resize-handle-s" 
           @pointerdown="${(x, c) => x.handleResizeStart(c.event as PointerEvent, 's')}"
           title="Drag to resize height"></div>
      <div class="resize-handle resize-handle-n" 
           @pointerdown="${(x, c) => x.handleResizeStart(c.event as PointerEvent, 'n')}"
           title="Drag to resize height"></div>
    `)}
    
    <div class="widget-header">
      <div class="widget-header-left">
        <!-- Drag handle icon -->
        <div class="drag-handle" title="Drag to move widget">
          <span class="drag-handle-icon">&#x2630;</span>
        </div>
      </div>
      
      <div class="widget-header-center">
        <div class="widget-title">${x => x.displayName}</div>
      </div>
      
      <div class="widget-header-right">
        <!-- Size indicator (read-only) -->
        ${when(x => x.showSizeControls, html<WidgetWrapper>/*html*/`
          <span class="size-indicator" title="Current size (columns x rows)">
            ${x => x.colSpan} × ${x => x.rowSpan}
          </span>
        `)}
        ${when(x => !x.hideCloseButton, html<WidgetWrapper>/*html*/`
          <button class="close-button" @click="${x => x.closeWidget()}" title="Close widget">
            <span class="close-icon">×</span>
          </button>
        `)}
      </div>
    </div>
    
    ${when(x => x.state === 'loading', html<WidgetWrapper>/*html*/`
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading widget...</div>
      </div>
    `)}
    
    ${when(x => x.state === 'timeout-warning', html<WidgetWrapper>/*html*/`
      <div class="timeout-warning-container">
        <div class="timeout-warning-message">This widget is taking longer than expected to load.</div>
        <div class="timeout-buttons">
          <button class="timeout-button" @click="${x => x.cancel()}">Cancel</button>
          <button class="timeout-button timeout-button-wait">Continue waiting</button>
        </div>
      </div>
    `)}
    
    ${when(x => x.state === 'error', html<WidgetWrapper>/*html*/`
      <div class="error-container">
        <div class="error-icon">!</div>
        <div class="error-message">${x => x.errorMessage}</div>
        <button class="retry-button" @click="${x => x.retry()}">Retry</button>
        <button class="dismiss-button" @click="${x => x.dismiss()}">Dismiss</button>
      </div>
    `)}
    
    ${when(x => x.state === 'import-error', html<WidgetWrapper>/*html*/`
      <div class="error-container">
        <div class="error-icon">!</div>
        <div class="error-message">
          Failed to load widget module: ${x => x.errorMessage}
          ${when(x => x.moduleImportPath, html<WidgetWrapper>/*html*/`
            <div class="module-path">Module path: ${x => x.moduleImportPath}</div>
          `)}
        </div>
        <button class="retry-button" @click="${x => x.retry()}">Retry</button>
        <button class="dismiss-button" @click="${x => x.dismiss()}">Dismiss</button>
      </div>
    `)}
    
    <div class="widget-content ${x => x.seamlessIntegration ? 'seamless' : ''} ${x => x.widgetId === 'welcome' ? 'welcome-content' : ''}">
      ${when(x => x.state === 'loaded', html<WidgetWrapper>/*html*/`
        <slot></slot>
      `)}
    </div>
  </div>
`;
