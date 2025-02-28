import { FASTElement, customElement, html, css } from '@microsoft/fast-element';

const template = html<AppComponent>/*html*/`
  <div class="app-container">
    <dream-header>
      <span slot="logo">Dream Application</span>
      <div slot="actions">
        <button>Settings</button>
        <button>Profile</button>
      </div>
    </dream-header>
    
    <div class="main-container">
      <dream-sidebar>
        <ul class="menu-list">
          <li><a href="#">Dashboard</a></li>
          <li><a href="#">Projects</a></li>
          <li><a href="#">Tasks</a></li>
          <li><a href="#">Analytics</a></li>
          <li><a href="#">Settings</a></li>
        </ul>
      </dream-sidebar>
      
      <dream-content>
        <h1>Welcome to Dream App</h1>
        <p>This is a web component based application using Microsoft's Fast Element library.</p>
        <p>The layout includes a header with search, left sidebar menu, main content area, and footer.</p>
      </dream-content>
    </div>
    
    <dream-footer></dream-footer>
  </div>
`;

const styles = css`
  :host {
    display: block;
    height: 100vh;
  }
  
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .main-container {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  
  dream-sidebar {
    width: 250px;
    flex-shrink: 0;
  }
  
  dream-content {
    flex: 1;
  }
  
  .menu-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .menu-list li {
    margin-bottom: 0.5rem;
  }
  
  .menu-list a {
    display: block;
    padding: 0.5rem;
    color: #333;
    text-decoration: none;
    border-radius: 4px;
  }
  
  .menu-list a:hover {
    background-color: #e9ecef;
  }
`;

@customElement({
  name: 'dream-app',
  template,
  styles
})
export class AppComponent extends FASTElement {
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('search', this.handleSearch as EventListener);
  }

  disconnectedCallback() {
    this.removeEventListener('search', this.handleSearch as EventListener);
    super.disconnectedCallback();
  }

  handleSearch(e: CustomEvent<{ searchText: string }>) {
    console.log("App received search event:", e.detail.searchText);
    // Implement app-level search handling
  }
}
