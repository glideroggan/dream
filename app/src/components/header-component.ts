import { FASTElement, customElement, html, css } from '@microsoft/fast-element';

const template = html<HeaderComponent>`
  <div class="header-container">
    <div class="header-content">
      <div class="logo">
        <slot name="logo">Dream App</slot>
      </div>
      <div class="header-actions">
        <slot name="actions"></slot>
      </div>
    </div>
    <dream-search></dream-search>
  </div>
`;

const styles = css`
  :host {
    display: block;
    width: 100%;
  }
  
  .header-container {
    background-color: #2c3e50;
    color: white;
    padding: 0.5rem 1rem;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.5rem;
  }
  
  .logo {
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  .header-actions {
    display: flex;
    gap: 1rem;
  }
`;

@customElement({
  name: 'dream-header',
  template,
  styles
})
export class HeaderComponent extends FASTElement {}
