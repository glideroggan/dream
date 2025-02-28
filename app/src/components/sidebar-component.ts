import { FASTElement, customElement, html, css } from '@microsoft/fast-element';

const template = html<SidebarComponent>`
  <div class="sidebar-container">
    <nav class="sidebar-nav">
      <slot></slot>
    </nav>
  </div>
`;

const styles = css`
  :host {
    display: block;
    height: 100%;
  }
  
  .sidebar-container {
    background-color: #f8f9fa;
    height: 100%;
    width: 100%;
    border-right: 1px solid #e9ecef;
    overflow-y: auto;
  }
  
  .sidebar-nav {
    padding: 1rem;
  }
`;

@customElement({
  name: 'dream-sidebar',
  template,
  styles
})
export class SidebarComponent extends FASTElement {}
