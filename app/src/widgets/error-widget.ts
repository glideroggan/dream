import { FASTElement, customElement, html, css, attr, observable } from '@microsoft/fast-element';
import { BaseWidget } from '../components/base-widget';

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
    width: 100%;
  }
  
  .error-widget {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    box-sizing: border-box;
  }
  
  h2 {
    color: #e74c3c;
    margin-top: 0;
    border-bottom: 1px solid #fadbd8;
    padding-bottom: 0.5rem;
    font-size: 1.2rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: auto;
  }
  
  .content p {
    text-align: center;
    margin: 0.5rem;
    max-width: 100%;
    overflow-wrap: break-word;
    word-wrap: break-word;
  }
`;

@customElement({
  name: 'error-widget',
  template,
  styles
})
export class ErrorWidget extends BaseWidget {
  @attr title = 'Error Widget';
  @observable config: Record<string, unknown> = {};

  connectedCallback(): void {
    super.connectedCallback();
    
    // Simulate initialization error
    setTimeout(() => {
      // Dispatch error event
      throw new Error('Widget initialization failed');
      // this.dispatchEvent(new ErrorEvent('error', {
      //   error: new Error('Widget initialization failed'),
      //   message: 'This widget is designed to fail for demonstration purposes',
      //   bubbles: true,
      //   composed: true
      // }));
    }, 1000);
  }

  configChanged(): void {
    // Apply any configuration from the parent
    if (this.config.title) {
      this.title = String(this.config.title);
    }
  }
}
