import { FASTElement, customElement, html, css, Observable, observable, repeat, when } from '@microsoft/fast-element';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  active?: boolean;
}

const template = html<SidebarComponent>`
  <div class="sidebar">
    <nav class="menu">
      <ul>
        ${repeat(x => x.menuItems, html<MenuItem, SidebarComponent>`
          <li class="menu-item ${item => item.active ? 'active' : ''}">
            <a href="${item => item.route}" @click="${(item, c) => c.parent.handleNavigation(item)}">
              <div class="menu-item-icon">${item => item.icon}</div>
              <span class="menu-item-label">${item => item.label}</span>
              ${when(item => item.id === 'dashboard', html`
                <span class="badge primary">New</span>
              `)}
            </a>
          </li>
        `)}
      </ul>
    </nav>
    
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="avatar">JD</div>
        <div class="user-details">
          <div class="user-name">John Doe</div>
          <div class="user-role">Administrator</div>
        </div>
      </div>
    </div>
  </div>
`;

const styles = css`
  :host {
    display: block;
    width: 250px;
    background-color: var(--sidebar-bg, #2c3e50);
    color: var(--sidebar-text, #ecf0f1);
    height: 100%;
    box-sizing: border-box;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .sidebar-header {
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .logo-icon {
    font-size: 24px;
  }
  
  .logo-text {
    font-size: 20px;
    font-weight: 700;
  }
  
  .menu {
    flex: 1;
    overflow-y: auto;
    padding-top: 8px;
  }
  
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .menu-item {
    margin: 4px 0;
    border-radius: 6px;
    overflow: hidden;
  }
  
  .menu-item a {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    color: var(--sidebar-text, #ecf0f1);
    text-decoration: none;
    transition: all 0.2s ease-in-out;
    border-radius: 6px;
    margin: 0 8px;
    position: relative;
  }
  
  .menu-item a:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: translateX(2px);
  }
  
  .menu-item.active a {
    background-color: var(--primary-color, #3498db);
    font-weight: 500;
  }
  
  .menu-item-icon {
    margin-right: 12px;
    font-size: 18px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .badge {
    position: absolute;
    right: 12px;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
  }
  
  .badge.primary {
    background-color: #e74c3c;
    color: white;
  }
  
  .sidebar-footer {
    padding: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--primary-color, #3498db);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
  
  .user-details {
    display: flex;
    flex-direction: column;
  }
  
  .user-name {
    font-weight: 500;
  }
  
  .user-role {
    font-size: 12px;
    opacity: 0.8;
  }
`;

@customElement({
  name: 'dream-sidebar',
  template,
  styles
})
export class SidebarComponent extends FASTElement {
  @observable menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', route: '#dashboard', active: true },
    { id: 'accounts', label: 'Accounts', icon: '💰', route: '#accounts' },
    { id: 'transactions', label: 'Transactions', icon: '📝', route: '#transactions' },
    { id: 'investments', label: 'Investments', icon: '📈', route: '#investments' },
    { id: 'reports', label: 'Reports', icon: '📊', route: '#reports' },
    { id: 'settings', label: 'Settings', icon: '⚙️', route: '#settings' }
  ];

  handleNavigation(item: MenuItem): void {
    // Update active state
    this.menuItems.forEach(menuItem => {
      menuItem.active = menuItem.id === item.id;
    });
    
    // Notify observers of change
    Observable.notify(this, 'menuItems');
    
    // You could also emit a custom event here for navigation
    this.$emit('navigation', { detail: item });
  }
}
