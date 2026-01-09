/**
 * Grid Test Page
 * A test page to verify the grid-layout-v2 and widget-wrapper-v2 components work correctly.
 */

import { FASTElement, customElement, html, css, observable } from '@microsoft/fast-element';

// Import the v2 components
import '../components/grid-layout-v2';
import '../components/widget-wrapper-v2/widget-wrapper-v2';
import { GridItemPosition } from '../services/grid-service';
import { repositoryService } from '../services/repository-service';
import { GridLayoutV2 } from '../components/grid-layout-v2';

const template = html<GridTestPage>/*html*/`
  <div class="page-container">
    <header class="page-header">
      <h1>Grid V2 Test Page</h1>
      <div class="header-actions">
        <button @click="${x => x.addWidget()}">Add Widget</button>
        <button @click="${x => x.saveLayout()}">Save Layout</button>
        <button @click="${x => x.loadLayout()}">Load Layout</button>
        <button @click="${x => x.resetGrid()}">Reset Grid</button>
        <span class="widget-count">Widgets: ${x => x.widgetCount}</span>
      </div>
    </header>
    
    <main class="page-content">
      <grid-layout-v2 
        page-type="grid-test"
        @grid-layout-changed="${(x, c) => x.handleLayoutChange(c.event as CustomEvent)}"
      >
        <!-- Test widgets will be added here dynamically -->
      </grid-layout-v2>
    </main>
    
    <footer class="page-footer">
      <div class="log-output">
        <h3>Event Log</h3>
        <pre>${x => x.eventLog}</pre>
      </div>
    </footer>
  </div>
`;

const styles = css`
  :host {
    display: block;
    height: 100vh;
    width: 100%;
    background-color: #f5f5f5;
  }
  
  .page-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: white;
    border-bottom: 1px solid #ddd;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .page-header h1 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
  }
  
  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .header-actions button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background: #0078d4;
    color: white;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background 0.2s;
  }
  
  .header-actions button:hover {
    background: #005a9e;
  }
  
  .widget-count {
    font-size: 0.875rem;
    color: #666;
  }
  
  .page-content {
    flex: 1;
    overflow: auto;
    padding: 1rem;
  }
  
  grid-layout-v2 {
    min-height: 600px;
    background: white;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .page-footer {
    padding: 1rem 2rem;
    background: #333;
    color: #fff;
    max-height: 200px;
    overflow: auto;
  }
  
  .log-output h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    color: #aaa;
  }
  
  .log-output pre {
    margin: 0;
    font-size: 0.75rem;
    font-family: 'Consolas', monospace;
    white-space: pre-wrap;
    color: #0f0;
    max-height: 140px;
    overflow-y: auto;
  }
`;

@customElement({
  name: 'grid-test-page',
  template,
  styles,
})
export class GridTestPage extends FASTElement {
  @observable widgetCount: number = 0;
  @observable eventLog: string = '';
  
  private widgetIdCounter: number = 0;
  
  connectedCallback(): void {
    super.connectedCallback();
    this.log('GridTestPage connected');
    
    // Add initial widgets after a short delay
    setTimeout(() => {
      this.addInitialWidgets();
    }, 100);
  }
  
  /**
   * Add some initial widgets to test with
   */
  addInitialWidgets(): void {
    this.log('Adding initial widgets...');
    
    // Add 3 test widgets with different sizes
    this.addWidget(8, 4, 1, 1);   // Standard widget at top-left
    this.addWidget(6, 3, 9, 1);   // Smaller widget next to it
    this.addWidget(10, 5, 15, 1); // Larger widget
    this.addWidget(12, 4, 1, 5);  // Wide widget on second row
  }
  
  /**
   * Add a new widget to the grid
   */
  addWidget(colSpan: number = 8, rowSpan: number = 4, gridCol?: number, gridRow?: number): void {
    const gridLayout = this.shadowRoot?.querySelector('grid-layout-v2');
    if (!gridLayout) {
      this.log('ERROR: grid-layout-v2 not found');
      return;
    }
    
    this.widgetIdCounter++;
    const widgetId = `test-widget-${this.widgetIdCounter}`;
    
    // Create the widget wrapper
    const wrapper = document.createElement('widget-wrapper-v2');
    wrapper.setAttribute('widget-id', widgetId);
    wrapper.setAttribute('widget-title', `Test Widget ${this.widgetIdCounter}`);
    wrapper.setAttribute('col-span', colSpan.toString());
    wrapper.setAttribute('row-span', rowSpan.toString());
    if (gridCol) wrapper.setAttribute('grid-col', gridCol.toString());
    if (gridRow) wrapper.setAttribute('grid-row', gridRow.toString());
    
    // Add some test content
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 4px;
      padding: 1rem;
      text-align: center;
    `;
    content.innerHTML = `
      <h3 style="margin: 0 0 0.5rem 0;">Widget ${this.widgetIdCounter}</h3>
      <p style="margin: 0; font-size: 0.875rem; opacity: 0.8;">
        ${colSpan} × ${rowSpan} cells
      </p>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem; opacity: 0.6;">
        Drag header to move, corners to resize
      </p>
    `;
    wrapper.appendChild(content);
    
    // Mark as loaded immediately since we're adding static content
    (wrapper as any).state = 'loaded';
    
    // Add to grid
    gridLayout.appendChild(wrapper);
    
    this.widgetCount++;
    this.log(`Added widget: ${widgetId} (${colSpan}×${rowSpan})`);
  }
  
  /**
   * Reset the grid - remove all widgets
   */
  resetGrid(): void {
    const gridLayout = this.shadowRoot?.querySelector('grid-layout-v2');
    if (!gridLayout) return;
    
    // Remove all widgets
    while (gridLayout.firstChild) {
      gridLayout.removeChild(gridLayout.firstChild);
    }
    
    this.widgetIdCounter = 0;
    this.widgetCount = 0;
    this.log('Grid reset');
    
    // Re-add initial widgets
    setTimeout(() => {
      this.addInitialWidgets();
    }, 100);
  }
  
  /**
   * Handle layout change events from the grid
   */
  handleLayoutChange(event: CustomEvent): void {
    const { positions } = event.detail as { positions: GridItemPosition[] };
    
    const summary = positions.map(p => 
      `${p.id}: (${p.col},${p.row}) ${p.colSpan}×${p.rowSpan}`
    ).join(', ');
    
    this.log(`Layout changed: ${summary}`);
  }
  
  /**
   * Save current layout to settings repository
   */
  async saveLayout(): Promise<void> {
    const gridLayout = this.shadowRoot?.querySelector('grid-layout-v2') as GridLayoutV2;
    if (!gridLayout) {
      this.log('ERROR: grid-layout-v2 not found');
      return;
    }
    
    const positions = gridLayout.getPositions();
    const settingsRepo = repositoryService.getSettingsRepository();
    
    await settingsRepo.updateAllWidgetPositions('grid-test', positions);
    this.log(`Saved ${positions.length} widget positions`);
  }
  
  /**
   * Load layout from settings repository
   */
  async loadLayout(): Promise<void> {
    const gridLayout = this.shadowRoot?.querySelector('grid-layout-v2') as GridLayoutV2;
    if (!gridLayout) {
      this.log('ERROR: grid-layout-v2 not found');
      return;
    }
    
    const settingsRepo = repositoryService.getSettingsRepository();
    const pageSettings = await settingsRepo.getPageWidgetSettings('grid-test');
    
    // Convert PageWidgetSettings to GridItemPosition
    const positions: GridItemPosition[] = pageSettings
      .filter(s => s.gridCol && s.gridRow)
      .map(s => ({
        id: s.id,
        col: s.gridCol!,
        row: s.gridRow!,
        colSpan: s.colSpan,
        rowSpan: s.rowSpan
      }));
    
    if (positions.length > 0) {
      gridLayout.loadPositions(positions);
      this.log(`Loaded ${positions.length} widget positions from storage`);
    } else {
      this.log('No saved positions found');
    }
  }
  
  /**
   * Log a message to the event log
   */
  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.eventLog = `[${timestamp}] ${message}\n${this.eventLog}`;
    console.debug(`GridTestPage: ${message}`);
  }
}
