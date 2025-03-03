import { FASTElement, customElement, html, css, attr, observable } from '@microsoft/fast-element';

const template = html<WelcomeWidget>/*html*/`
  <div class="welcome-widget">
    <h2>${x => x.title}</h2>
    <p>${x => x.message}</p>
  </div>
`;

const styles = css`
  :host {
    display: block;
  }
  
  .welcome-widget {
    text-align: center;
  }
  
  h2 {
    color: #2c3e50;
    margin-top: 0;
  }
`;

@customElement({
  name: 'welcome-widget',
  template,
  styles
})
export class WelcomeWidget extends FASTElement {
  @attr title = 'Welcome to Wallet!';
  @observable message = 'This is a dynamically loaded widget.';
  @observable config: Record<string, unknown> = {};

  connectedCallback(): void {
    super.connectedCallback();
    
    // Signal that the widget is initialized once connected
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('initialized', {
        bubbles: true,
        composed: true
      }));
    }, 0);
  }

  configChanged() {
    // Apply any configuration from the parent
    if (this.config.title) {
      this.title = String(this.config.title);
    }
    
    if (this.config.message) {
      this.message = String(this.config.message);
    }
  }
}
