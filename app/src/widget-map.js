// // Widget Map - Defines all available widgets in the application
// (function() {
//   console.debug("Widget map initializing");
  
//   if (typeof window.widgetService === 'undefined') {
//     console.debug("Widget service not yet available, creating registry");
//     // Create placeholder if service not available yet
//     window.widgetRegistry = [];
//     window.registerWidget = function(widget) {
//       console.debug(`Pre-registering widget: ${widget.id}`);
//       window.widgetRegistry.push(widget);
//     };
//   }

//   // Register widgets with their metadata
//   const registerWidget = window.widgetService?.registerWidget || window.registerWidget;
//   console.debug("Registering available widgets");
  
//   // Account Widget
//   registerWidget({
//     id: 'account',
//     name: 'Account Balances',
//     description: 'Displays user account balances and details',
//     elementName: 'account-widget',
//     module: '/src/widgets/account-widget/account-widget.js',
//     defaultConfig: {}
//   });

//   // Welcome Widget - make sure the path matches actual file structure
//   registerWidget({
//     id: 'welcome',
//     name: 'Welcome Widget',
//     description: 'Welcome message and getting started information',
//     elementName: 'welcome-widget',
//     module: '/src/widgets/welcome-widget/welcome-widget.js',
//     defaultConfig: { username: 'Guest' }
//   });
  
//   console.debug("Widget registration complete");
// })();
