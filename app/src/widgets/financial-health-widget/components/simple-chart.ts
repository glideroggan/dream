import { FASTElement, customElement, html, css, attr, observable } from "@microsoft/fast-element";

export interface ChartDataPoint {
  label: string;
  value: number;
}

const template = html<SimpleChart>/*html*/ `
  <div class="chart-wrapper">
    <div class="y-axis">
      ${x => x.renderYAxisLabels()}
    </div>
    <div class="chart-area">
      <svg class="chart" viewBox="0 0 300 120" preserveAspectRatio="none">
        <!-- Grid lines -->
        ${x => x.renderGridLines()}
        
        <!-- Data line -->
        <polyline 
          class="data-line"
          fill="none" 
          stroke="${x => x.lineColor}" 
          stroke-width="2"
          stroke-linecap="round" 
          stroke-linejoin="round"
          points="${x => x.calculatePoints()}" 
        />
        
        <!-- Data points -->
        ${x => x.renderDataPoints()}
      </svg>
      
      <!-- X-axis labels -->
      <div class="x-axis">
        ${x => x.renderXAxisLabels()}
      </div>
    </div>
  </div>
`;

const styles = css`
  .chart-wrapper {
    display: flex;
    height: 100%;
    width: 100%;
    align-items: stretch;
  }
  
  .y-axis {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px 5px 25px 0;
    width: 50px;
  }
  
  .y-axis-label {
    font-size: 10px;
    color: var(--tertiary-text, #999);
    text-align: right;
  }
  
  .chart-area {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .chart {
    flex: 1;
    background-color: var(--background-color, #fff);
    border-left: 1px solid var(--divider-color, #eaeaea);
    border-top: 1px solid var(--divider-color, #eaeaea);
  }
  
  .x-axis {
    height: 25px;
    display: flex;
    justify-content: space-between;
    padding: 5px 10px;
    border-top: 1px solid var(--divider-color, #eaeaea);
  }
  
  .x-axis-label {
    font-size: 10px;
    color: var(--tertiary-text, #999);
  }
  
  .grid-line {
    stroke: var(--divider-color, #eaeaea);
    stroke-width: 0.5;
    stroke-dasharray: 2 2;
  }
  
  .data-point {
    fill: var(--background-color, #fff);
    stroke-width: 2;
  }
`;

@customElement({
  name: "simple-chart",
  template,
  styles
})
export class SimpleChart extends FASTElement {
  @attr chartType: 'line' | 'bar' = 'line';
  @attr lineColor: string = 'var(--primary-color, #3498db)';
  @attr gridLines: number = 5;
  @attr showPoints: boolean = true;
  
  @observable dataPoints: ChartDataPoint[] = [];
  @observable minValue: number = 0;
  @observable maxValue: number = 100;
  
  renderYAxisLabels() {
    const labels = [];
    const valueRange = this.maxValue - this.minValue;
    
    for (let i = this.gridLines; i >= 0; i--) {
      const value = this.minValue + (valueRange * i / this.gridLines);
      labels.push(`
        <div class="y-axis-label">${this.formatValue(value)}</div>
      `);
    }
    
    return labels.join('');
  }
  
  renderXAxisLabels() {
    if (!this.dataPoints.length) return '';
    
    return this.dataPoints.map(point => `
      <div class="x-axis-label">${point.label}</div>
    `).join('');
  }
  
  renderGridLines() {
    const lines = [];
    const chartHeight = 120;
    const lineHeight = chartHeight / this.gridLines;
    
    for (let i = 0; i <= this.gridLines; i++) {
      const y = i * lineHeight;
      lines.push(`<line x1="0" y1="${y}" x2="300" y2="${y}" class="grid-line" />`);
    }
    
    return lines.join('');
  }
  
  calculatePoints() {
    if (!this.dataPoints.length) return '';
    
    const chartWidth = 300;
    const chartHeight = 120;
    const valueRange = this.maxValue - this.minValue;
    const pointWidth = chartWidth / (this.dataPoints.length - 1);
    
    return this.dataPoints
      .map((point, index) => {
        const x = index * pointWidth;
        // Calculate y position (0 is top in SVG)
        const normalizedValue = (point.value - this.minValue) / valueRange;
        const y = chartHeight - (normalizedValue * chartHeight);
        return `${x},${y}`;
      })
      .join(' ');
  }
  
  renderDataPoints() {
    if (!this.showPoints || !this.dataPoints.length) return '';
    
    const chartWidth = 300;
    const chartHeight = 120;
    const valueRange = this.maxValue - this.minValue;
    const pointWidth = chartWidth / (this.dataPoints.length - 1);
    
    return this.dataPoints
      .map((point, index) => {
        const x = index * pointWidth;
        const normalizedValue = (point.value - this.minValue) / valueRange;
        const y = chartHeight - (normalizedValue * chartHeight);
        
        return `
          <circle 
            cx="${x}" cy="${y}" r="4" 
            class="data-point" 
            stroke="${this.lineColor}"
          >
            <title>${point.label}: ${this.formatValue(point.value)}</title>
          </circle>
        `;
      })
      .join('');
  }
  
  formatValue(value: number): string {
    return value.toLocaleString(undefined, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
  }
}
