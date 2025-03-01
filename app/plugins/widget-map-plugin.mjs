import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

export function widgetMapPlugin() {
  return {
    name: 'widget-map-plugin',
    setup(build) {
      build.onStart(async () => {
        console.debug("Building widget map...");
        
        // Find all widget directories
        const widgetDirs = glob.sync('src/widgets/*/');
        
        // Create widget entries
        const widgets = [];
        
        for (const dir of widgetDirs) {
          const widgetId = path.basename(dir.slice(0, -1)); // Remove trailing slash
          
          // Check if widget has a main TS file
          const mainFile = path.join(dir, `${widgetId}-widget.ts`);
          if (!fs.existsSync(mainFile)) {
            console.warn(`Widget ${widgetId} has no main file at ${mainFile}`);
            continue;
          }
          
          // Get widget name by capitalizing each word
          const widgetName = widgetId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
          widgets.push({
            id: widgetId,
            name: widgetName,
            description: `${widgetName} widget`,
            elementName: `${widgetId}-widget`,
            module: `/widgets/${widgetId}/${widgetId}-widget.js`,
            defaultConfig: {}
          });
        }
        
        // Create widget-map.js content
        const widgetMapContent = `
// Auto-generated widget map - DO NOT EDIT
(function() {
  if (typeof window.widgetService === 'undefined') {
    window.widgetRegistry = [];
    window.registerWidget = function(widget) {
      window.widgetRegistry.push(widget);
    };
  }

  const registerWidget = window.widgetService?.registerWidget || window.registerWidget;
  
  ${widgets.map(widget => `
  // ${widget.name} Widget
  registerWidget(${JSON.stringify(widget, null, 2)});
  `).join('\n')}
})();
`;

        // Write the file to the output directory
        if (!fs.existsSync('dist')) {
          fs.mkdirSync('dist', { recursive: true });
        }
        fs.writeFileSync('dist/widget-map.js', widgetMapContent);
        console.debug(`Generated widget map with ${widgets.length} widgets`);
      });
    }
  };
}
