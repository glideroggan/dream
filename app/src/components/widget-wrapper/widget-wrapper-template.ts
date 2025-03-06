import { html, repeat, when } from "@microsoft/fast-element";
import { WidgetWrapper } from "./widget-wrapper";
import { GridItemSize } from "../grid-layout";

export const template = html<WidgetWrapper>/*html*/`
  <div class="widget-container" state="${x => x.state}">
    <div class="widget-header">
      ${when(x => x.showSizeControls, html<WidgetWrapper>/*html*/`
        <div class="widget-size-controls">
        ${repeat(x => x.availableSizes, html<GridItemSize, WidgetWrapper>/*html*/`
            <button 
              class="${(x, c) => c.parent.getSizeButtonClass(x)}" 
              @click="${(x, c) => c.parent.handleSizeButtonClick(c.event, x)}" 
              title="Change widget to ${x => x} size"
            >${(x, c) => c.parent.getSizeButtonText(x)}</button>
          `)}
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
    
    <div class="widget-content ${x => x.seamlessIntegration ? 'seamless' : ''}">
      ${when(x => x.state === 'loaded', html<WidgetWrapper>/*html*/`
        <slot></slot>
      `)}
    </div>
  </div>
`;
