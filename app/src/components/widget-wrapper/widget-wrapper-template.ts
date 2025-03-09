import { html, when } from "@microsoft/fast-element";
import { WidgetWrapper } from "./widget-wrapper";

export const template = html<WidgetWrapper>/*html*/`
  <div class="widget-container" state="${x => x.state}">
    <div class="widget-header">
      ${when(x => x.showSizeControls, html<WidgetWrapper>/*html*/`
        <div class="widget-size-controls">
          <!-- Span controls for width and height adjustment -->
          <div class="span-controls">
            <div class="span-control-group">
              <span class="span-label">W:</span>
              <button 
                class="span-button"
                type="button"
                @pointerdown="${(x, c) => { 
                  console.debug(`Width decrease button clicked for ${x.widgetId}`); 
                  c.event.preventDefault(); 
                  c.event.stopPropagation();
                  setTimeout(() => x.decreaseColSpan(), 0); // Use setTimeout to ensure the event is processed
                }}" 
                title="Decrease width">-</button>
              <span class="span-value">${x => x.colSpan}</span>
              <button 
                class="span-button"
                type="button"
                @pointerdown="${(x, c) => { 
                  console.debug(`Width increase button clicked for ${x.widgetId}`); 
                  c.event.preventDefault(); 
                  c.event.stopPropagation();
                  setTimeout(() => x.increaseColSpan(), 0); // Use setTimeout to ensure the event is processed
                }}" 
                title="Increase width">+</button>
            </div>
            <div class="span-control-group">
              <span class="span-label">H:</span>
              <button 
                class="span-button"
                type="button"
                @pointerdown="${(x, c) => { 
                  console.debug(`Height decrease button clicked for ${x.widgetId}`); 
                  c.event.preventDefault(); 
                  c.event.stopPropagation();
                  setTimeout(() => x.decreaseRowSpan(), 0); // Use setTimeout to ensure the event is processed
                }}" 
                title="Decrease height">-</button>
              <span class="span-value">${x => x.rowSpan}</span>
              <button 
                class="span-button"
                type="button"
                @pointerdown="${(x, c) => { 
                  console.debug(`Height increase button clicked for ${x.widgetId}`); 
                  c.event.preventDefault(); 
                  c.event.stopPropagation();
                  setTimeout(() => x.increaseRowSpan(), 0); // Use setTimeout to ensure the event is processed
                }}" 
                title="Increase height">+</button>
            </div>
            <!-- New auto-size toggle button -->
            <button 
              class="auto-size-toggle ${x => x.autoSizeEnabled ? 'active' : ''}"
              type="button"
              @click="${(x, c) => {
                c.event.preventDefault();
                c.event.stopPropagation();
                x.toggleAutoSize();
              }}"
              title="${x => x.autoSizeEnabled ? 'Disable auto-sizing' : 'Enable auto-sizing'}">
              <span class="auto-icon">A</span>
            </button>
          </div>
        </div>
      `)}
      
      <div class="widget-title">${x => x.displayName}</div>
      
      ${when(x => !x.hideCloseButton, html<WidgetWrapper>/*html*/`
        <button class="close-button" @click="${x => x.closeWidget()}" title="Close widget">
          <span class="close-icon">×</span>
        </button>
      `)}
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
