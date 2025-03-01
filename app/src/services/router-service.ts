import { getSingletonManager } from './singleton-manager';
import { moduleLoaderService } from './module-loader-service';
import { observable } from '@microsoft/fast-element';

export interface Route {
  path: string;
  title: string;
  elementName: string;
  modulePath: string;
  defaultParams?: Record<string, unknown>;
}

export interface NavigationOptions {
  params?: Record<string, unknown>;
  replaceHistory?: boolean;
}

export class RouterService {
  private routes: Map<string, Route> = new Map();
  @observable currentRoute: Route | null = null;
  @observable currentParams: Record<string, unknown> = {};
  
  // Private constructor for singleton pattern
  private constructor() {
    console.debug("RouterService instance created");
    this.setupHashChangeListener();
  }
  
  // Singleton accessor
  public static getInstance(): RouterService {
    const singletonManager = getSingletonManager();
    return singletonManager.getOrCreate<RouterService>(
      'RouterService', 
      () => new RouterService()
    );
  }
  
  /**
   * Register a route with the router service
   */
  registerRoute(route: Route): void {
    this.routes.set(route.path, route);
    console.debug(`Registered route: ${route.path} -> ${route.elementName}`);
  }
  
  /**
   * Register multiple routes at once
   */
  registerRoutes(routes: Route[]): void {
    routes.forEach(route => this.registerRoute(route));
  }
  
  /**
   * Navigate to a specific route
   */
  async navigateTo(path: string, options: NavigationOptions = {}): Promise<boolean> {
    const route = this.routes.get(path);
    
    if (!route) {
      console.error(`Route not found: ${path}`);
      return false;
    }
    
    try {
      // Load the module for this route
      await moduleLoaderService.loadModule(route.modulePath, `route-${route.path}`);
      
      // Update the URL hash
      const newHash = `#${path}`;
      
      if (options.replaceHistory) {
        window.location.replace(newHash);
      } else {
        window.location.hash = newHash;
      }
      
      // Update current route
      this.setCurrentRoute(route, options.params || {});
      
      return true;
    } catch (error) {
      console.error(`Failed to navigate to ${path}:`, error);
      return false;
    }
  }
  
  /**
   * Get the current route information
   */
  getCurrentRoute(): { route: Route | null, params: Record<string, unknown> } {
    return {
      route: this.currentRoute,
      params: this.currentParams
    };
  }
  
  /**
   * Initialize the router with default routes and navigate to initial route
   */
  async initialize(): Promise<void> {
    // Check if we have a hash route already
    if (window.location.hash) {
      const path = window.location.hash.substring(1); // Remove the # character
      await this.handleRouteChange(path);
    } else {
      // Default to home route if no hash is present
      await this.navigateTo('home', { replaceHistory: true });
    }
  }
  
  /**
   * Set the current route and params
   */
  private setCurrentRoute(route: Route, params: Record<string, unknown> = {}): void {
    // Merge default params with provided params
    const mergedParams = { 
      ...(route.defaultParams || {}), 
      ...params 
    };
    
    this.currentRoute = route;
    this.currentParams = mergedParams;
    
    // Update document title
    document.title = route.title;
    
    console.debug(`Current route set to: ${route.path}`, mergedParams);
  }
  
  /**
   * Set up the hash change listener
   */
  private setupHashChangeListener(): void {
    window.addEventListener('hashchange', () => {
      const path = window.location.hash.substring(1);
      this.handleRouteChange(path);
    });
  }
  
  /**
   * Handle route change from hash change event
   */
  private async handleRouteChange(path: string): Promise<void> {
    // Extract any query parameters
    let cleanPath = path;
    let params: Record<string, unknown> = {};
    
    const queryIndex = path.indexOf('?');
    if (queryIndex >= 0) {
      cleanPath = path.substring(0, queryIndex);
      const queryString = path.substring(queryIndex + 1);
      
      // Parse query parameters
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((value, key) => {
        // Try to parse JSON values
        try {
          params[key] = JSON.parse(value);
        } catch {
          params[key] = value;
        }
      });
    }
    
    const route = this.routes.get(cleanPath);
    
    if (route) {
      try {
        // Load the module for this route
        await moduleLoaderService.loadModule(route.modulePath, `route-${route.path}`);
        
        // Update current route
        this.setCurrentRoute(route, params);
      } catch (error) {
        console.error(`Failed to load route ${cleanPath}:`, error);
        // Fallback to home route
        if (cleanPath !== 'home') {
          await this.navigateTo('home', { replaceHistory: true });
        }
      }
    } else {
      console.error(`Route not found: ${cleanPath}`);
      // Redirect to home if route not found
      if (cleanPath !== 'home') {
        await this.navigateTo('home', { replaceHistory: true });
      }
    }
  }
}

export const routerService = RouterService.getInstance();
