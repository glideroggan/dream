import { FASTElement, customElement, html, css, Observable, observable, repeat, when } from '@microsoft/fast-element';
import { userService } from '../services/user-service';
import { searchService, SearchResultItem } from '../services/search-service';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  active?: boolean;
  keywords?: string[];
  description?: string;
}

const template = html<SidebarComponent>/*html*/`
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
        <div class="avatar">${x => x.userInitials}</div>
        <div class="user-details">
          <div class="user-name">${x => x.userName}</div>
          <div class="user-role">${x => x.userRole}</div>
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
    { 
      id: 'dashboard', 
      label: 'Home', 
      icon: '📊', 
      route: '#home', 
      active: true,
      keywords: ['dashboard', 'start', 'overview', 'main'],
      description: 'Main dashboard with your personal overview'
    },
    { 
      id: 'savings', 
      label: 'Savings', 
      icon: '💰', 
      route: '#savings',
      keywords: ['savings', 'save money', 'funds', 'save'],
      description: 'Manage your savings accounts and goals'
    },
    { 
      id: 'investments', 
      label: 'Investments', 
      icon: '📈', 
      route: '#investments',
      keywords: ['investments', 'stocks', 'funds', 'portfolio', 'invest'],
      description: 'Track and manage your investment portfolio' 
    },
  ];

  @observable userName: string = 'Guest';
  @observable userRole: string = 'Visitor';
  @observable userInitials: string = 'G';

  connectedCallback(): void {
    super.connectedCallback();
    this.loadUserData();
    
    // Register theme pages with search service
    this.registerThemePagesForSearch();
    
    // Add a listener for user changes
    window.addEventListener('user-updated', this.loadUserData.bind(this));
  }
  
  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('user-updated', this.loadUserData.bind(this));
    
    // Clean up search registrations
    this.menuItems.forEach(item => {
      searchService.unregisterItem(item.id);
    });
  }
  
  registerThemePagesForSearch(): void {
    this.menuItems.forEach(item => {
      const searchItem: SearchResultItem = {
        id: item.id,
        title: item.label,
        type: 'theme',
        keywords: item.keywords || [],
        description: item.description || `Navigate to ${item.label}`,
        icon: item.icon,
        route: item.route,
        action: () => this.handleNavigation(item)
      };
      
      searchService.registerItem(searchItem);
    });
  }
  
  loadUserData(): void {
    const user = userService.getCurrentUser();
    if (user) {
      this.userName = `${user.firstName} ${user.lastName}`;
      this.userRole = user.isLoggedIn ? 'Member' : 'Guest'; 
      this.userInitials = user.firstName.charAt(0) + user.lastName.charAt(0);
    }
  }

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
