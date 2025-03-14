// import * as fs from 'fs';
// import * as path from 'path';

// export const widgetPathUpdaterPlugin = {
//   name: 'widget-path-updater',
//   setup(build) {
//     build.onEnd(result => {
//       // Get all output files from the build
//       const outputFiles = Object.keys(result.metafile.outputs);
      
//       // Find widget files and map to their final paths
//       const widgetPaths = {};
//       outputFiles.forEach(file => {
//         // Check if this is a widget file
//         const match = file.match(/\/widgets\/([^\/]+)\/([^\/]+)-[a-z0-9]+\.js$/);
//         if (match) {
//           const widgetType = match[1];
//           const widgetName = match[2];
//           const fullPath = `/${file.replace(/^dist\//, '')}`;
//           widgetPaths[`${widgetType}/${widgetName}`] = fullPath;
//         }
//       });
      
//       // Find the widget service file
//       const serviceFilePath = path.resolve('./dist/src/services/widget-service.js');
//       if (fs.existsSync(serviceFilePath)) {
//         let content = fs.readFileSync(serviceFilePath, 'utf8');
        
//         // Replace placeholder paths with actual paths
//         Object.entries(widgetPaths).forEach(([key, actualPath]) => {
//           const placeholder = new RegExp(`/src/widgets/${key}-\\[hash\\]\\.js`, 'g');
//           content = content.replace(placeholder, actualPath);
//         });
        
//         fs.writeFileSync(serviceFilePath, content);
//       }
//     });
//   }
// };
