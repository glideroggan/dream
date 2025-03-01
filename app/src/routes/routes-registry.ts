import { Route, routerService } from '../services/router-service';

/**
 * Application routes
 */
export const appRoutes: Route[] = [
  {
    path: 'home',
    title: 'Dashboard - Dream Banking',
    elementName: 'dashboard-page',
    modulePath: '@pages/dashboard',
    defaultParams: {
      initialwidgets: 'welcome,account'
    }
  },
  {
    path: 'savings',
    title: 'Savings - Dream Banking',
    elementName: 'savings-page',
    modulePath: '@pages/savings'
  },
  {
    path: 'investments',
    title: 'Investments - Dream Banking',
    elementName: 'investments-page',
    modulePath: '@pages/investments'
  }
];

/**
 * Icons for routes - used for UI display
 */
export const routeIcons: Record<string, string> = {
  'home': '📊',
  'savings': '💰',
  'investments': '📈'
};

/**
 * Additional route metadata for search and UI display
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
  }
};

/**
 * Register all application routes
 */
export function registerAppRoutes(): void {
  // Register all routes with the router service
  routerService.registerRoutes(appRoutes);
}
