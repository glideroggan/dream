import { FASTElement, customElement, html, css, attr, observable } from '@microsoft/fast-element';

const template = html<ErrorWidget>/*html*/`
  <div class="error-widget">
    <h2>${x => x.title}</h2>
    <div class="content">
      <p>This widget intentionally fails to initialize</p>
    </div>
  </div>
`;

const styles = css`
  :host {
    display: block;
    height: 100%;
  }
  
  .error-widget {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 1rem;
  }
  
  h2 {
    color: #e74c3c;
    margin-top: 0;
    border-bottom: 1px solid #fadbd8;
    padding-bottom: 0.5rem;
  }
  
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
`;

@customElement({
  name: 'error-widget',
  template,
  styles
})
export class ErrorWidget extends FASTElement {
  @attr title = 'Error Widget';
  @observable config: Record<string, unknown> = {};

  connectedCallback(): void {
    super.connectedCallback();
    
    // Simulate initialization error
    setTimeout(() => {
      // Dispatch error event
      this.dispatchEvent(new ErrorEvent('error', {
        error: new Error('Widget initialization failed'),
        message: 'This widget is designed to fail for demonstration purposes',
        bubbles: true,
        composed: true
      }));
    }, 500);
  }

  configChanged(): void {
    // Apply any configuration from the parent
    if (this.config.title) {
      this.title = String(this.config.title);
    }
  }
}
