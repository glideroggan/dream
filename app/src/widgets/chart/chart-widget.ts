import { FASTElement, customElement, html, css, observable } from '@microsoft/fast-element';

const template = html<ChartWidget>/*html*/`
  <div class="chart-widget">
    <h3>${x => x.title}</h3>
    
    <div class="chart-container">
      <div class="chart-placeholder">
        <!-- In a real app, you would use an actual chart library -->
        <div class="mock-chart ${x => x.chartType}">
          <div class="mock-bar" style="height: 30%"></div>
          <div class="mock-bar" style="height: 70%"></div>
          <div class="mock-bar" style="height: 50%"></div>
          <div class="mock-bar" style="height: 90%"></div>
          <div class="mock-bar" style="height: 40%"></div>
        </div>
      </div>
      
      ${x => x.showLegend ? html`
        <div class="chart-legend">
          <div class="legend-item"><span class="legend-color"></span> Category A</div>
          <div class="legend-item"><span class="legend-color"></span> Category B</div>
          <div class="legend-item"><span class="legend-color"></span> Category C</div>
        </div>
      ` : ''}
    </div>
  </div>
`;

const styles = css`
  :host {
    display: block;
  }
  
  .chart-widget {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  
  h3 {
    margin-top: 0;
    color: #2c3e50;
    border-bottom: 1px solid #eaeaea;
    padding-bottom: 0.5rem;
  }
  
  .chart-container {
    margin-top: 1rem;
  }
  
  .chart-placeholder {
    height: 150px;
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
  }
  
  .mock-chart {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
  }
  
  .mock-bar {
    background-color: #3498db;
    width: 15%;
    margin: 0 1%;
    border-radius: 4px 4px 0 0;
  }
  
  .mock-chart.line .mock-bar {
    position: relative;
  }
  
  .mock-chart.line .mock-bar::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    width: 100%;
    height: 2px;
    background-color: #e74c3c;
    transform: translate(50%, 0);
  }
  
  .mock-chart.pie {
    position: relative;
  }
  
  .mock-chart.pie::before {
    content: '';
    position: absolute;
    width: 100px;
    height: 100px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: conic-gradient(#3498db 0% 30%, #e74c3c 30% 70%, #2ecc71 70% 100%);
    border-radius: 50%;
  }
  
  .chart-legend {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    margin: 0 0.5rem;
    font-size: 0.8rem;
  }
  
  .legend-color {
    display: inline-block;
    width: 12px;
    height: 12px;
    margin-right: 4px;
    background-color: #3498db;
  }
  
  .legend-item:nth-child(2) .legend-color {
    background-color: #e74c3c;
  }
  
  .legend-item:nth-child(3) .legend-color {
    background-color: #2ecc71;
  }
`;

@customElement({
  name: 'chart-widget',
  template,
  styles
})
export class ChartWidget extends FASTElement {
  @observable title = 'Analytics Chart';
  @observable chartType = 'bar'; // 'bar', 'line', 'pie'
  @observable showLegend = true;
  @observable config: Record<string, unknown> = {};

  configChanged() {
    // Apply any configuration from the parent
    if (this.config.title !== undefined) {
      this.title = String(this.config.title);
    }
    
    if (this.config.type !== undefined) {
      this.chartType = String(this.config.type);
    }
    
    if (this.config.showLegend !== undefined) {
      this.showLegend = Boolean(this.config.showLegend);
    }
  }
}
