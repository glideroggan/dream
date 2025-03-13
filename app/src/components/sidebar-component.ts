import { FASTElement, customElement, html, css, Observable, observable, repeat, when } from '@microsoft/fast-element';
import { userService } from '../services/user-service';
import { getSearchService, SearchResultItem, SearchService } from '../services/search-service';
import { routerService } from '../services/router-service';
import { appRoutes, routeIcons, routeMetadata } from '../routes/routes-registry';
import { UserProfile, UserType, UserTypes } from '../repositories/models/user-models';
import { repositoryService } from '../services/repository-service';

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
  <div class="sidebar ${x => x.collapsed ? 'collapsed' : ''}">
    <nav class="menu">
      <ul>
        ${repeat(x => x.menuItems, html<MenuItem, SidebarComponent>/*html*/`
          <li class="menu-item ${item => item.active ? 'active' : ''}">
            <a href="${item => item.route}" @click="${(item, c) => c.parent.handleNavigation(item)}">
              <div class="menu-item-icon">${item => item.icon}</div>
              <span class="menu-item-label">${item => item.label}</span>
              ${when(item => item.id === 'home', html`
                <span class="badge primary">New</span>
              `)}
            </a>
          </li>
        `)}
      </ul>
    </nav>
    
    <div class="sidebar-footer">
      <div class="user-info" @click="${x => x.toggleUserSwitcher()}">
        <div class="avatar">${x => x.userInitials}</div>
        <div class="user-details">
          <div class="user-name">${x => x.userName}</div>
          <div class="user-role">${x => x.userRole}</div>
        </div>
        <div class="dropdown-indicator">
          <span class="${x => x.showUserSwitcher ? 'up' : 'down'}">▾</span>
        </div>
      </div>
      
      ${when(x => x.showUserSwitcher, html<SidebarComponent>/*html*/`
        <div class="user-switcher">
          <div class="user-switcher-header">Switch User</div>
          <ul class="user-list">
            ${repeat(x => x.availableUsers, html<UserProfile, SidebarComponent>/*html*/`
              <li class="user-list-item ${(user, c) => user.id === c.parent.currentUserId ? 'active' : ''}" 
                  @click="${(user, c) => c.parent.switchToUser(user)}">
                <div class="user-list-avatar">${user => user.firstName.charAt(0) + user.lastName.charAt(0)}</div>
                <div class="user-list-details">
                  <div class="user-list-name">${user => user.firstName} ${user => user.lastName}</div>
                  <div class="user-list-role">${(user, c) => c.parent.getUserRoleLabel(user.type)}</div>
                </div>
              </li>
            `)}
          </ul>
        </div>
      `)}
    </div>
    
    <button class="collapse-toggle" @click="${x => x.toggleCollapsed()}" 
            title="${x => x.collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}">
      ${x => x.collapsed ? '→' : '←'}
    </button>
  </div>
`;

const styles = css`
  :host {
    display: block;
    width: 250px;
    background-color: var(--sidebar-bg);
    color: var(--text-light);
    height: 100%;
    box-sizing: border-box;
    box-shadow: 2px 0 10px color-mix(in srgb, var(--primary-color) 10%, transparent);
    transition: width 0.3s ease;
  }

  /* Apply this class to host when collapsed regardless of screen size */
  :host(.sidebar-collapsed) {
    width: 60px;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    transition: all 0.3s ease;
    width: 100%; /* Make inner sidebar match host width */
  }
  
  /* No need for width on .sidebar.collapsed since host will handle that */
  
  .sidebar-header {
    padding: 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--text-light) 10%, transparent);
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
    color: var(--text-light);
    text-decoration: none;
    transition: all 0.2s ease-in-out;
    border-radius: 6px;
    margin: 0 8px;
    position: relative;
    white-space: nowrap;
  }
  
  .menu-item a:hover {
    background-color: var(--hover-bg);
    transform: translateX(2px);
  }
  
  .menu-item.active a {
    background-color: var(--accent-color);
    font-weight: 500;
    box-shadow: 0 2px 5px color-mix(in srgb, var(--primary-color) 20%, transparent);
    transform: translateX(3px);
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
    background-color: var(--new-badge-bg, #e74c3c);
    color: var(--new-badge-text, #ffffff);
  }
  
  .sidebar-footer {
    padding: 16px;
    border-top: 1px solid color-mix(in srgb, var(--text-light) 10%, transparent);
    position: relative;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: background-color 0.2s ease;
  }
  
  .user-info:hover {
    background-color: var(--hover-bg);
  }
  
  .avatar {
    min-width: 40px; /* Ensure minimum width */
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--accent-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0; /* Prevent avatar from shrinking */
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
  
  .dropdown-indicator {
    margin-left: auto;
    font-size: 14px;
    transition: transform 0.2s ease;
  }
  
  .dropdown-indicator .up {
    display: inline-block;
    transform: rotate(180deg);
  }
  
  .user-switcher {
    position: absolute;
    bottom: 100%;
    left: 8px;
    right: 8px;
    background-color: var(--sidebar-bg);
    border-radius: 8px;
    box-shadow: 0 -2px 10px color-mix(in srgb, var(--primary-color) 20%, transparent);
    z-index: 100;
    overflow: hidden;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .user-switcher-header {
    padding: 12px 16px;
    font-weight: 500;
    border-bottom: 1px solid color-mix(in srgb, var(--text-light) 10%, transparent);
    background-color: color-mix(in srgb, var(--primary-color) 80%, black);
  }
  
  .user-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .user-list-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    gap: 12px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .user-list-item:hover {
    background-color: var(--hover-bg);
  }
  
  .user-list-item.active {
    background-color: var(--accent-color);
  }
  
  .user-list-avatar {
    min-width: 32px; /* Ensure minimum width */
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--accent-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    flex-shrink: 0; /* Prevent avatar from shrinking */
  }
  
  .user-list-details {
    display: flex;
    flex-direction: column;
  }
  
  .user-list-name {
    font-weight: 500;
    font-size: 14px;
  }
  
  .user-list-role {
    font-size: 12px;
    opacity: 0.8;
  }

  .sidebar.collapsed .menu-item-label,
  .sidebar.collapsed .user-details,
  .sidebar.collapsed .dropdown-indicator {
    display: none;
  }

  .sidebar.collapsed .menu-item-icon {
    margin-right: 0;
  }

  .sidebar.collapsed .menu-item a {
    justify-content: center;
    padding: 12px 0;
  }

  .sidebar.collapsed .badge {
    display: none;
  }

  .sidebar.collapsed .user-info {
    justify-content: center;
    padding: 8px 0; /* Adjust padding when collapsed */
  }

  .collapse-toggle {
    position: absolute;
    right: -12px;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: var(--sidebar-bg);
    color: var(--text-light);
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 100;
    font-size: 12px;
    padding: 0;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .collapse-toggle:hover {
    opacity: 1;
  }

  /* Adjust this media query to match our grid breakpoints */
  @media (max-width: 750px) {
    :host {
      width: 60px;
    }
    
    // :host(.sidebar-expanded) {
    //   width: 250px;
    // }
    
    // .sidebar {
    //   width: 60px;
    // }
    
    // .sidebar.expanded {
    //   width: 250px;
    // }
    
    /* Change these selectors to match the class we're actually toggling */
    // .sidebar.collapsed .menu-item-label,
    // .sidebar.collapsed .user-details,
    // .sidebar.collapsed .dropdown-indicator {
    //   display: none;
    // }
  
    // .sidebar.collapsed .menu-item-icon {
    //   margin-right: 0;
    // }
  
    // .sidebar.collapsed .menu-item a {
    //   justify-content: center;
    //   padding: 12px 0;
    // }
  
    // .sidebar.collapsed .badge {
    //   display: none;
    // }
  
    // .sidebar.collapsed .user-info {
    //   justify-content: center;
    // }
  }
`;

@customElement({
  name: 'dream-sidebar',
  template,
  styles
})
export class SidebarComponent extends FASTElement {
  @observable menuItems: MenuItem[] = [];
  @observable userName: string = 'Guest';
  @observable userRole: string = 'Visitor';
  @observable userInitials: string = 'G';
  @observable showUserSwitcher: boolean = false;
  @observable availableUsers: UserProfile[] = [];
  @observable currentUserId: string = '';
  @observable collapsed: boolean = false;

  private searchService: SearchService;
  private clickOutsideHandler: (event: MouseEvent) => void;

  constructor() {
    super();
    this.searchService = getSearchService();
    this.clickOutsideHandler = this.handleClickOutside.bind(this);
  }

  collapsedChanged(): void {
    // Update host classes to match
    if (this.collapsed) {
      this.classList.add('sidebar-collapsed');
      this.classList.remove('sidebar-expanded');
    } else {
      this.classList.remove('sidebar-collapsed');
      this.classList.remove('sidebar-expanded'); 
    }
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    
    // Initialize menu items from routes
    this.initializeMenuItems();
    
    this.loadUserData();
    this.loadAvailableUsers();
    
    // Register theme pages with search service
    this.registerThemePagesForSearch();

    // get settings for sidebar state
    const settingsRepo = repositoryService.getSettingsRepository();
    const settings = await settingsRepo.getCurrentSettings()
    this.collapsed = settings.sidebarClosed || false;
    console.log('Sidebar is ', this.collapsed ? 'collapsed' : 'expanded');
    
    // Add listeners for user login/logout events
    document.addEventListener('user-login', this.loadUserData.bind(this));
    document.addEventListener('user-logout', this.loadUserData.bind(this));
    
    // Subscribe to route changes to update active state
    Observable.getNotifier(routerService).subscribe({
      handleChange: (source: any, propertyName: string) => {
        if (propertyName === 'currentRoute') {
          console.debug('Route changed, updating sidebar active item');
          this.updateActiveMenuItem();
        }
      }
    });
    
    // Set initial active state based on current route
    // Using a small timeout to ensure the routes are registered first
    setTimeout(() => this.updateActiveMenuItem(), 10);
    
    // Set initial collapsed state based on screen width
    // this.checkScreenWidth();
    
    // Listen for window resize events to auto-collapse
    window.addEventListener('resize', this.checkScreenWidth.bind(this));
  }
  
  /**
   * Initialize menu items from the application routes
   */
  private initializeMenuItems(): void {
    this.menuItems = appRoutes.map(route => {
      const path = route.path;
      const metadata = routeMetadata[path] || { keywords: [], description: `Navigate to ${path}` };
      
      return {
        id: path,
        label: route.title.split(' - ')[0], // Extract the first part of the title
        icon: routeIcons[path] || '📄', // Default icon if not found
        route: path,
        active: false, // Will be set by updateActiveMenuItem
        keywords: metadata.keywords,
        description: metadata.description
      };
    });

    console.debug('Menu items initialized:', this.menuItems);
  }
  
  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('user-login', this.loadUserData.bind(this));
    document.removeEventListener('user-logout', this.loadUserData.bind(this));
    document.removeEventListener('click', this.clickOutsideHandler);
    window.removeEventListener('resize', this.checkScreenWidth.bind(this));
    
    // Clean up search registrations
    this.menuItems.forEach(item => {
      this.searchService.unregisterItem(item.id);
    });
  }
  
  /**
   * Update the active menu item based on the current route
   */
  private updateActiveMenuItem(): void {
    const { route } = routerService.getCurrentRoute();
    
    if (route) {
      // Get clean path
      const currentPath = route.path;
      
      console.debug(`Updating active menu item for current path: ${currentPath}`);
      
      // Update active state for all menu items
      let foundActive = false;
      
      // Create a new array of menu items with updated active state
      this.menuItems = this.menuItems.map(menuItem => {
        // Check if this menu item matches the current route
        const isActive = menuItem.route === currentPath;
        
        // If active, log it
        if (isActive) {
          foundActive = true;
          console.debug(`Found active menu item: ${menuItem.label} (${menuItem.route})`);
        }
        
        // Return a new object with updated active state
        return {
          ...menuItem,
          active: isActive
        };
      });
      
      if (!foundActive) {
        console.warn(`No matching menu item found for route: ${currentPath}`);
      }
      
      // Notify observers of change
      Observable.notify(this, 'menuItems');
    }
  }

  loadUserData(): void {
    const user = userService.getCurrentUser();
    if (user) {
      this.userName = `${user.firstName} ${user.lastName}`;
      this.currentUserId = user.id;
      
      // Map user type to a display-friendly role
      this.userRole = this.getUserRoleLabel(user.type);
      
      this.userInitials = user.firstName.charAt(0) + user.lastName.charAt(0);
    } else {
      // Default values if user is not found
      this.userName = 'Guest User';
      this.userRole = 'Visitor';
      this.userInitials = 'GU';
      this.currentUserId = '';
    }
  }

  getUserRoleLabel(userType: UserType): string {
    switch (userType) {
      case UserTypes.PREMIUM:
        return 'Premium Member';
      case UserTypes.ESTABLISHED:
        return 'Member';
      case UserTypes.NEW:
        return 'New User';
      case UserTypes.DEMO:
      default:
        return 'Demo User';
    }
  }

  loadAvailableUsers(): void {
    this.availableUsers = userService.getAllUsers();
  }

  toggleUserSwitcher(): void {
    this.showUserSwitcher = !this.showUserSwitcher;
    
    if (this.showUserSwitcher) {
      // Add click outside listener when dropdown is shown
      setTimeout(() => {
        document.addEventListener('click', this.clickOutsideHandler);
      }, 0);
    } else {
      // Remove listener when dropdown is hidden
      document.removeEventListener('click', this.clickOutsideHandler);
    }
  }

  handleClickOutside(event: MouseEvent): void {
    if (this.showUserSwitcher && !this.contains(event.target as Node)) {
      this.showUserSwitcher = false;
      document.removeEventListener('click', this.clickOutsideHandler);
    }
  }

  switchToUser(user: UserProfile): void {
    if (user.id !== this.currentUserId) {
      userService.switchToUser(user.id);
      this.loadUserData();
    }
    this.showUserSwitcher = false;
  }

  handleNavigation(item: MenuItem): void {
    console.debug('Navigation triggered for:', item);
    
    // Prevent default browser navigation
    if (event) {
      event.preventDefault();
    }
    
    // We'll explicitly set active state here to make UI more responsive
    this.menuItems = this.menuItems.map(menuItem => ({
      ...menuItem,
      active: menuItem.id === item.id
    }));
    
    // Emit a navigation event for the parent to handle
    this.$emit('navigation', item);
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
      
      this.searchService.registerItem(searchItem);
    });
  }

  /**
   * Check screen width and auto-collapse sidebar if below threshold
   */
  private checkScreenWidth(): void {
    const smallScreen = window.innerWidth < 750; // Adjusted from 730px to 750px
    
    // Update collapsed state based on screen size
    if (smallScreen) {
      this.collapsed = smallScreen;
      
      // Update host classes to match
      if (this.collapsed) {
        this.classList.add('sidebar-collapsed');
        this.classList.remove('sidebar-expanded');
      } else {
        this.classList.remove('sidebar-collapsed');
        this.classList.remove('sidebar-expanded'); // Not needed on large screens
      }
      
      // this.$emit('sidebar-toggle', { collapsed: this.collapsed });
    }
  }
  
  /**
   * Toggle sidebar collapsed state
   */
  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
    
    // Update the host element class to control width
    if (this.collapsed) {
      this.classList.add('sidebar-collapsed');
      this.classList.remove('sidebar-expanded');
    } else {
      this.classList.remove('sidebar-collapsed');
      this.classList.add('sidebar-expanded');
      
      // Only add expanded class if we're on small screen
      // if (window.innerWidth < 750) {
      //   this.classList.add('sidebar-expanded');
      // }
    }
    
    const settingsRepo = repositoryService.getSettingsRepository();
    // Update sidebar collapsed state in user settings
    settingsRepo.updateSettings({ sidebarClosed: this.collapsed });
    // Trigger the event
    // this.$emit('sidebar-toggle', { collapsed: this.collapsed });
  }
}
