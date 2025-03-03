import { html, when } from "@microsoft/fast-element";
import { WidgetWrapper } from "./widget-wrapper";

export const template = html<WidgetWrapper>/*html*/ `
  <div class="widget-wrapper ${x => x.state}" data-widget-id="${x => x.widgetId}">
    <!-- Close button shown only for loaded widgets -->
    ${(x) => x.state === 'loaded' && !x.hideCloseButton ? html<WidgetWrapper>/*html*/`
      <button class="close-button" title="Remove widget" @click="${x => x.closeWidget()}">
        <span aria-hidden="true">&times;</span>
      </button>
    ` : ''}

    <!-- Loading state -->
    ${when(x => x.state === 'loading',html<WidgetWrapper>/*html*/`
      <div class="widget-loading">
        <div class="spinner"></div>
        <p>Loading widget...</p>
        <span class="widget-identifier">${x => x.displayName}</span>
      </div>`)}
    
    <!-- Error state -->
    ${when(x => x.state === 'error',html<WidgetWrapper>/*html*/`
      <div class="widget-error">
        <h3>Widget failed to load</h3>
        <p>${x => x.errorMessage || 'There was an error loading this widget.'}</p>
        <span class="widget-identifier">${x => x.displayName}</span>
        <div class="action-buttons">
          <button class="retry-button" @click="${x => x.retry()}">Try Again</button>
          <button class="dismiss-button" @click="${x => x.dismiss()}">Dismiss</button>
        </div>
      </div>
    `)}
    
    <!-- Import error state -->
    ${when(x => x.state === 'import-error',html<WidgetWrapper>/*html*/`
      <div class="widget-error widget-import-error">
        <h3>Widget Import Error</h3>
        <p>${x => x.errorMessage || 'There was an error loading this widget module.'}</p>
        <code class="module-path">${x => x.moduleImportPath}</code>
        <span class="widget-identifier">${x => x.displayName}</span>
        <div class="action-buttons">
          <button class="retry-button" @click="${x => x.retry()}">Try Again</button>
          <button class="dismiss-button" @click="${x => x.dismiss()}">Dismiss</button>
        </div>
      </div>
    `)}
    
    <!-- Timeout warning state (slow loading) -->
    ${when(x => x.state === 'timeout-warning',html<WidgetWrapper>/*html*/`
      <div class="widget-timeout">
        <div class="spinner"></div>
        <p>Still loading...</p>
        <span class="widget-identifier">${x => x.displayName}</span>
        <button class="cancel-button" @click="${x => x.cancel()}">Cancel</button>
      </div>
    `)}
    
    <!-- Widget content -->
    ${when(x => x.state === 'loaded' , html<WidgetWrapper>/*html*/`
      <slot></slot>
    `)}
  </div>
`;
