// import * as fs from 'fs';
// import * as path from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// // Function to recursively find all TypeScript files in a directory
// function findTsFiles(dir, fileList = []) {
//   const files = fs.readdirSync(dir);
  
//   files.forEach(file => {
//     const filePath = path.join(dir, file);
//     const stat = fs.statSync(filePath);
    
//     if (stat.isDirectory()) {
//       findTsFiles(filePath, fileList);
//     } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
//       fileList.push(filePath);
//     }
//   });
  
//   return fileList;
// }

// // Create esbuild plugin for handling widget modules
// export const widgetsPlugin = {
//   name: 'widgets-plugin',
//   setup(build) {
//     // Get all widget TypeScript files from the widgets directory
//     const widgetsDir = path.resolve(__dirname, '../src/widgets');
//     const widgetFiles = findTsFiles(widgetsDir);
    
//     // Create entrypoints for each widget file
//     const widgetEntryPoints = {};
//     widgetFiles.forEach(file => {
//       const relativePath = path.relative(path.resolve(__dirname, '..'), file);
//       const outputPath = relativePath.replace(/\.ts$/, '');
      
//       widgetEntryPoints[outputPath] = file;
//     });
    
//     // Add widget files as entrypoints
//     build.initialOptions.entryPoints = {
//       ...build.initialOptions.entryPoints,
//       ...widgetEntryPoints
//     };
    
//     // Mark the widget modules as external, so they're built separately
//     build.onResolve({ filter: /^\@widgets\// }, args => {
//       return {
//         path: args.path,
//         external: true
//       };
//     });
//   }
// };
