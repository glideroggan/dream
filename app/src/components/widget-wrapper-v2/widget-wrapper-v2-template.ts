import { html, when } from "@microsoft/fast-element";
import { WidgetWrapperV2 } from "./widget-wrapper-v2";

export const template = html<WidgetWrapperV2>/*html*/`
  <div class="widget-container ${x => x.isDragging ? 'dragging' : ''} ${x => x.isResizing ? 'resizing' : ''}" 
       data-state="${x => x.state}">
    
    <!-- Resize handles (8 directions) -->
    ${when(x => x.showSizeControls, html<WidgetWrapperV2>/*html*/`
      <!-- Corner handles -->
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
      <!-- Edge handles -->
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
    
    <!-- Header -->
    <div class="widget-header">
      <div class="widget-header-left">
        <div class="drag-handle" title="Drag to move widget">
          <span class="drag-handle-icon">&#x2630;</span>
        </div>
      </div>
      
      <div class="widget-header-center">
        <div class="widget-title">${x => x.displayName}</div>
      </div>
      
      <div class="widget-header-right">
        <!-- Settings button -->
        ${when(x => x.showSizeControls, html<WidgetWrapperV2>/*html*/`
          <div class="settings-container">
            <button class="settings-button" 
                    @click="${x => x.toggleSettings()}" 
                    title="Widget size settings">
              <span class="settings-icon">⚙</span>
            </button>
            ${when(x => x.isSettingsOpen, html<WidgetWrapperV2>/*html*/`
              <div class="settings-popover">
                <div class="settings-header">
                  <span>Size Settings</span>
                  <button class="settings-close" @click="${x => x.closeSettings()}">×</button>
                </div>
                <div class="settings-row">
                  <label>Columns:</label>
                  <input type="number" 
                         class="span-input"
                         min="${x => x.minColSpan}" 
                         max="${x => x.maxColSpan}" 
                         :value="${x => x.colSpan}"
                         @change="${(x, c) => x.handleColSpanChange(c.event)}" />
                </div>
                <div class="settings-row">
                  <label>Rows:</label>
                  <input type="number" 
                         class="span-input"
                         min="${x => x.minRowSpan}" 
                         max="${x => x.maxRowSpan}" 
                         :value="${x => x.rowSpan}"
                         @change="${(x, c) => x.handleRowSpanChange(c.event)}" />
                </div>
              </div>
            `)}
          </div>
        `)}
        
        <!-- Close button -->
        ${when(x => !x.hideClose, html<WidgetWrapperV2>/*html*/`
          <button class="close-button" @click="${x => x.closeWidget()}" title="Close widget">
            <span class="close-icon">×</span>
          </button>
        `)}
      </div>
    </div>
    
    <!-- Loading state -->
    ${when(x => x.state === 'loading', html<WidgetWrapperV2>/*html*/`
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading widget...</div>
      </div>
    `)}
    
    <!-- Timeout state -->
    ${when(x => x.state === 'timeout', html<WidgetWrapperV2>/*html*/`
      <div class="error-container">
        <div class="error-icon">⏱</div>
        <div class="error-message">${x => x.errorMessage}</div>
        <div class="error-actions">
          <button class="retry-button" @click="${x => x.retry()}">Retry</button>
          <button class="dismiss-button" @click="${x => x.dismiss()}">Dismiss</button>
        </div>
      </div>
    `)}
    
    <!-- Error state -->
    ${when(x => x.state === 'error', html<WidgetWrapperV2>/*html*/`
      <div class="error-container">
        <div class="error-icon">!</div>
        <div class="error-message">${x => x.errorMessage}</div>
        <div class="error-actions">
          <button class="retry-button" @click="${x => x.retry()}">Retry</button>
          <button class="dismiss-button" @click="${x => x.dismiss()}">Dismiss</button>
        </div>
      </div>
    `)}
    
    <!-- Content - always slot the content, hide when not loaded -->
    <div class="widget-content ${x => x.state !== 'loaded' ? 'hidden' : ''}">
      <slot></slot>
    </div>
  </div>
`;
