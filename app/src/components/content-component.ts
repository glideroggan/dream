import { FASTElement, customElement, html, css, observable } from '@microsoft/fast-element';
import { widgetService, WidgetDefinition } from '../services/widget-service';

const template = html<ContentComponent>/*html*/`
  <div class="content-container">
    <div class="content-header">
      <h1>${x => x.pageTitle}</h1>
      <div class="actions">
        <button @click="${x => x.addWidget()}" class="add-widget-button">Add Widget</button>
      </div>
    </div>
    
    <div class="widgets-container">
      ${x => x.renderWidgets()}
    </div>
    
    <div class="widget-selector ${x => x.showWidgetSelector ? 'visible' : ''}">
      <div class="widget-selector-header">
        <h3>Select a Widget</h3>
        <button @click="${x => x.closeWidgetSelector()}" class="close-button">✕</button>
      </div>
      <div class="widget-selector-list">
        ${x => x.renderWidgetOptions()}
      </div>
    </div>
  </div>
`;

const styles = css`
  :host {
    display: block;
    height: 100%;
    overflow-y: auto;
  }
  
  .content-container {
    padding: 1.5rem;
    height: 100%;
    position: relative;
  }
  
  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .widgets-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .widget {
    background: #ffffff;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    min-height: 200px;
  }
  
  .add-widget-button {
    background: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    cursor: pointer;
  }
  
  .add-widget-button:hover {
    background: #2980b9;
  }
  
  .widget-selector {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    max-width: 90%;
    background: white;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    display: none;
    z-index: 100;
  }
  
  .widget-selector.visible {
    display: block;
  }
  
  .widget-selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e1e1e1;
  }
  
  .widget-selector-header h3 {
    margin: 0;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
  }
  
  .widget-selector-list {
    padding: 1rem;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .widget-option {
    padding: 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 0.5rem;
  }
  
  .widget-option:hover {
    background-color: #f0f0f0;
  }
  
  .widget-option h4 {
    margin: 0 0 0.25rem 0;
  }
  
  .widget-option p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }
`;

@customElement({
  name: 'dream-content',
  template,
  styles
})
export class ContentComponent extends FASTElement {
  @observable pageTitle = 'Dashboard';
  @observable activeWidgets: WidgetDefinition[] = [];
  @observable showWidgetSelector = false;
  
  connectedCallback(): void {
    super.connectedCallback();
    
    // Load default widget on initialization
    this.loadWidget('welcome');
  }
  
  async loadWidget(widgetId: string): Promise<void> {
    const widgetDef = await widgetService.loadWidget(widgetId);
    
    if (widgetDef) {
      // Add widget to active widgets if it's not already there
      if (!this.activeWidgets.find(w => w.id === widgetDef.id)) {
        this.activeWidgets = [...this.activeWidgets, widgetDef];
      }
    }
  }
  
  renderWidgets() {
    if (!this.activeWidgets.length) {
      return html`<div class="empty-message">No widgets added yet. Click "Add Widget" to get started.</div>`;
    }
    
    return html`
      ${this.activeWidgets.map(widget => {
        const elementName = widget.elementName;
        return html`
          <div class="widget">
            <${elementName} 
              .config="${widget.defaultConfig || {}}"
            ></${elementName}>
          </div>
        `;
      })}
    `;
  }
  
  renderWidgetOptions() {
    const availableWidgets = widgetService.getAvailableWidgets();
    
    return html`
      ${availableWidgets.map(widget => html`
        <div class="widget-option" @click="${() => this.selectWidget(widget.id)}">
          <h4>${widget.name}</h4>
          <p>${widget.description || ''}</p>
        </div>
      `)}
    `;
  }
  
  selectWidget(widgetId: string): void {
    this.loadWidget(widgetId);
    this.closeWidgetSelector();
  }
  
  addWidget(): void {
    this.showWidgetSelector = true;
  }
  
  closeWidgetSelector(): void {
    this.showWidgetSelector = false;
  }
}
