import * as fs from 'fs';
import * as build from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { htmlUpdaterPlugin } from "./plugins/copy-with-hash.mjs";
import { widgetMapPlugin } from "./plugins/widget-map-plugin.mjs";

const env = "'local'"

const context = await build.context({
    // Specify main entry point plus widget entry points
    entryPoints: [
        'src/main.ts',
        // Widget entry points
        'src/widgets/welcome/welcome-widget.ts',
        'src/widgets/dashboard/dashboard-widget.ts',
        'src/widgets/chart/chart-widget.ts'
    ],
    entryNames: '[dir]/[name]-[hash]',
    assetNames: 'assets/[name]-[hash]',
    bundle: true,
    splitting: true, // Enable code splitting for dynamic imports
    format: 'esm',
    sourcemap: true,
    outdir: 'dist',
    logLevel: 'info',
    metafile: true,
    minify: true,
    loader: {
        '.html': 'text',
        '.svg': 'file',
        '.eot': 'file',
        '.ttf': 'file',
        '.woff': 'file',
        '.woff2': 'file',
    },
    define: {
        'process.env.ENV': env,
    },
    plugins: [
        htmlUpdaterPlugin({indexName: 'index.html'}),
        widgetMapPlugin(),
        copy({
            assets: [
                {
                    from: ['./src/assets/**/*'],
                    to: ['./assets'],
                },
            ],
            watch: true,
        }),
    ],
});

const result = await context.rebuild()
fs.writeFileSync('dist/meta.json', JSON.stringify(result.metafile, null, 2))
await context.watch()
const serveResults = await context.serve({
    port: 8001,
    servedir: 'dist',
    onRequest: args => {
        console.log(`${args.method} [${args.path}] ${args.status} (${args.timeInMS}ms)`)
    }
})

// wait indefinitely until user press Ctrl+C
const wait = async () => {
    return new Promise(resolve => {
        // This handler will be triggered when the process is interrupted (e.g., Ctrl+C)
        process.on('SIGINT', () => {
            console.log('Interrupted by user');
            resolve();
        });
    });
}
await wait()
await context.dispose()
