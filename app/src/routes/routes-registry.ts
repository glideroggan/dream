import { Route, routerService } from '../services/router-service';

/**
 * Register all application routes
 */
export function registerAppRoutes(): void {
  const routes: Route[] = [
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

  // Register all routes with the router service
  routerService.registerRoutes(routes);
}
