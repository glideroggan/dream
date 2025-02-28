import { FASTElement, customElement, html, css } from '@microsoft/fast-element';

const template = html<SidebarComponent>`
  <div class="sidebar">
    <div class="sidebar-header">
      <slot name="header">Menu</slot>
    </div>
    
    <nav class="menu">
      <ul>
        <li class="menu-item active">
          <a href="#dashboard">
            <span class="icon">📊</span>
            <span class="label">Dashboard</span>
          </a>
        </li>
        <li class="menu-item">
          <a href="#accounts">
            <span class="icon">💰</span>
            <span class="label">Accounts</span>
          </a>
        </li>
        <li class="menu-item">
          <a href="#transactions">
            <span class="icon">📝</span>
            <span class="label">Transactions</span>
          </a>
        </li>
        <li class="menu-item">
          <a href="#investments">
            <span class="icon">📈</span>
            <span class="label">Investments</span>
          </a>
        </li>
        <li class="menu-item">
          <a href="#reports">
            <span class="icon">📊</span>
            <span class="label">Reports</span>
          </a>
        </li>
        <li class="menu-item">
          <a href="#settings">
            <span class="icon">⚙️</span>
            <span class="label">Settings</span>
          </a>
        </li>
      </ul>
    </nav>
  </div>
`;

const styles = css`
  :host {
    display: block;
    width: 240px;
    background-color: var(--sidebar-bg, #f5f5f5);
    border-right: 1px solid var(--border-color, #e0e0e0);
    height: 100%;
    box-sizing: border-box;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .sidebar-header {
    padding: 16px;
    font-size: 18px;
    font-weight: 500;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
  }
  
  .menu {
    flex: 1;
    overflow-y: auto;
  }
  
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .menu-item {
    margin: 0;
  }
  
  .menu-item a {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    color: var(--text-color, #333);
    text-decoration: none;
    transition: background-color 0.2s;
  }
  
  .menu-item a:hover, .menu-item.active a {
    background-color: var(--hover-bg, #e8e8e8);
  }
  
  .menu-item.active a {
    font-weight: 500;
    border-left: 3px solid var(--primary-color, #3498db);
  }
  
  .icon {
    margin-right: 12px;
    font-size: 18px;
    width: 24px;
    text-align: center;
  }
`;

@customElement({
  name: 'dream-sidebar',
  template,
  styles
})
export class SidebarComponent extends FASTElement {}
