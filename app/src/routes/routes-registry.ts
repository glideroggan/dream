import { Route, routerService } from '../services/router-service';

/**
 * Application routes
 */
export const appRoutes: Route[] = [
  {
    path: 'home',
    title: 'Dashboard - Wallet Banking',
    elementName: 'dashboard-page',
    modulePath: '@pages/dashboard',
    defaultParams: {
      initialwidgets: 'welcome,account'
    }
  },
  {
    path: 'savings',
    title: 'Savings - Wallet Banking',
    elementName: 'savings-page',
    modulePath: '@pages/savings'
  },
  {
    path: 'investments',
    title: 'Investments - Wallet Banking',
    elementName: 'investments-page',
    modulePath: '@pages/investments'
  },
  {
    path: 'grid-test',
    title: 'Grid V2 Test - Wallet Banking',
    elementName: 'grid-test-page',
    modulePath: '@pages/grid-test'
  }
];

/**
 * Icons for routes - used for UI display
 */
export const routeIcons: Record<string, string> = {
  'home': '📊',
  'savings': '💰',
  'investments': '📈',
  'grid-test': '🔲'
};

/**
 * Additional route metadata for search and UI display
 * // TODO: should we add these to the search?
 */
export const routeMetadata: Record<string, {
  keywords: string[],
  description: string
}> = {
  'home': {
    keywords: ['dashboard', 'start', 'overview', 'main'],
    description: 'Main dashboard with your personal overview'
  },
  'savings': {
    keywords: ['savings', 'save money', 'funds', 'save'],
    description: 'Manage your savings accounts and goals'
  },
  'investments': {
    keywords: ['investments', 'stocks', 'funds', 'portfolio', 'invest'],
    description: 'Track and manage your investment portfolio'
  },
  'grid-test': {
    keywords: ['grid', 'test', 'v2', 'layout', 'debug'],
    description: 'Test page for grid layout v2 system'
  }
};

/**
 * Register all application routes
 */
export function registerAppRoutes(): void {
  // Register all routes with the router service
  routerService.registerRoutes(appRoutes);
}
