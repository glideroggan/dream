import * as fs from 'fs';
import * as path from 'path';

export function widgetMapPlugin() {
  return {
    name: 'widget-map-plugin',
    setup(build) {
      build.onEnd(result => {
        const outdir = build.initialOptions.outdir;
        const widgetMap = {};

        // Find all widget output files and map them
        Object.keys(result.metafile.outputs).forEach(filePath => {
          const filename = path.basename(filePath);
          
          // Skip definition files and main entry points
          if (filePath.endsWith('.d.ts') || filePath.endsWith('.map') || 
              filename.startsWith('main-') || !filePath.includes('widgets')) {
            return;
          }
          
          // Extract the widget type from the path (e.g., 'welcome', 'dashboard', etc.)
          const pathParts = filePath.split(path.sep);
          const widgetIndex = pathParts.findIndex(part => part === 'widgets');
          
          if (widgetIndex >= 0 && widgetIndex + 1 < pathParts.length) {
            const widgetType = pathParts[widgetIndex + 1];
            // Store the widget type and its hashed filename
            widgetMap[widgetType] = '/' + filename;
          }
        });

        // Create a widget-map.js file
        const widgetMapContent = `
          // This file is auto-generated - do not edit
          window.WIDGET_MAP = ${JSON.stringify(widgetMap, null, 2)};
        `;

        fs.writeFileSync(path.join(outdir, 'widget-map.js'), widgetMapContent);
      });
    }
  };
}
