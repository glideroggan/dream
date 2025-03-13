import { FASTElement, customElement, html, css, attr, observable } from '@microsoft/fast-element';

const template = html<SlowWidget>/*html*/`
  <div class="slow-widget">
    <h2>${x => x.title}</h2>
    <div class="content">
      <p>This widget loads after a 6-second delay</p>
      <div class="info">
        <p>Load time: <strong>6 seconds</strong></p>
        <p>Current progress: ${x => x.loadingProgress}%</p>
        <div class="progress-bar">
          <div class="progress" style="width: ${x => x.loadingProgress}%"></div>
        </div>
      </div>
    </div>
  </div>
`;

const styles = css`
  :host {
    display: block;
    height: 100%;
  }
  
  .slow-widget {
    display: flex;
    flex-direction: column;
    padding: 1rem;
  }
  
  h2 {
    color: var(--accent-color);
    margin-top: 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
  }
  
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  
  .info {
    background-color: var(--background-color);
    border-radius: 4px;
    padding: 1rem;
    margin-top: 1rem;
    text-align: center;
    width: 100%;
  }
  
  .progress-bar {
    width: 100%;
    height: 10px;
    background-color: #e0e0e0;
    border-radius: 5px;
    overflow: hidden;
    margin-top: 10px;
  }
  
  .progress {
    height: 100%;
    background-color: #3498db;
    transition: width 0.3s ease;
  }
`;

@customElement({
  name: 'slow-widget',
  template,
  styles
})
export class SlowWidget extends FASTElement {
  @attr title = 'Slow Widget';
  @observable config: Record<string, unknown> = {};
  @observable loadingProgress: number = 0;
  
  private loadInterval: number | null = null;

  connectedCallback(): void {
    super.connectedCallback();

    // Start the loading progress simulation
    this.loadInterval = window.setInterval(() => {
      if (this.loadingProgress < 100) {
        // Increment by approximately 1.67% every 100ms to reach 100% in 6 seconds
        this.loadingProgress += 1.67;
        
        if (this.loadingProgress >= 100) {
          this.loadingProgress = 100;
          this.completeLoading();
        }
      }
    }, 100);
  }
  
  disconnectedCallback(): void {
    super.disconnectedCallback();
    
    // Clean up interval
    if (this.loadInterval !== null) {
      window.clearInterval(this.loadInterval);
      this.loadInterval = null;
    }
  }
  
  private completeLoading(): void {
    // Clear the interval
    if (this.loadInterval !== null) {
      window.clearInterval(this.loadInterval);
      this.loadInterval = null;
    }
    
    // Dispatch initialized event
    this.dispatchEvent(new CustomEvent('initialized', {
      bubbles: true,
      composed: true
    }));
  }

  configChanged(): void {
    // Apply any configuration from the parent
    if (this.config.title) {
      this.title = String(this.config.title);
    }
  }
}
