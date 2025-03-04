import * as fs from 'fs';
import * as build from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { htmlUpdaterPlugin } from "./plugins/copy-with-hash.mjs";

const env = "'local'"

const context = await build.context({
    // Specify main entry point plus widget entry points
    entryPoints: [
        'src/main.ts',
        // Widget entry points
        'src/widgets/welcome/welcome-widget.ts',
        'src/widgets/dashboard/dashboard-widget.ts',
        'src/widgets/chart/chart-widget.ts',
        'src/widgets/account-widget/account-widget.ts',
        'src/widgets/swish-widget.ts',
        // workflows
        'src/workflows/transfer/transfer-workflow.ts',
        'src/workflows/create-account/create-account-workflow.ts',
        'src/workflows/kyc/kyc-workflow.ts',
        'src/workflows/swish-workflow.ts',
        'src/workflows/payments/add-contact-workflow.ts',
        // pages
        'src/pages/dashboard-page.ts',
        'src/pages/investments-page.ts',
        'src/pages/savings-page.ts',
        // example widgets
        'src/widgets/error-widget/error-widget.ts',
        'src/widgets/slow-widget/slow-widget.ts',
    ],
    entryNames: '[dir]/[name]-[hash]',
    assetNames: 'assets/[name]-[hash]',
    bundle: true,
    splitting: true, // Enable code splitting for dynamic imports
    format: 'esm',
    metafile: true,
    sourcemap: true,
    outdir: 'dist',
    logLevel: 'info',
    metafile: true,
    minify: true,
    external: [
        "@microsoft/fast-element",
        "@widgets/welcome", "@widgets/account", 
        "@workflows/transfer",
        "@workflows/create-account",
        "@workflows/swish-workflow",
        "@workflows/add-contact-workflow",
        "@workflows/kyc",
        "@widgets/swish",
        "@pages/dashboard", "@pages/investments", "@pages/savings",
        "@widgets/error", "@widgets/fast", "@widgets/slow",
    ],
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
        console.debug(`${args.method} [${args.path}] ${args.status} (${args.timeInMS}ms)`)
    }
})

// wait indefinitely until user press Ctrl+C
const wait = async () => {
    return new Promise(resolve => {
        // This handler will be triggered when the process is interrupted (e.g., Ctrl+C)
        process.on('SIGINT', () => {
            console.debug('Interrupted by user');
            resolve();
        });
    });
}
await wait()
await context.dispose()
