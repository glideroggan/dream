import * as fs from 'fs';
import * as build from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { htmlUpdaterPlugin } from "./plugins/copy-with-hash.mjs";

const env = "'local'"
// Get publicPath from environment variable or use default (empty for local dev)
const publicPath = process.env.PUBLIC_PATH || '/'

const context = await build.context({
    // Specify main entry point plus widget entry points
    entryPoints: [
        'src/main.ts',
        // Widget entry points
        'src/widgets/welcome/welcome-widget.ts',
        'src/widgets/account-widget/account-widget.ts',
        'src/widgets/swish-widget.ts',
        'src/widgets/financial-health-widget/financial-health-widget.ts',
        'src/widgets/loans/loans-widget.ts',
        // components
        'src/components/modal-component.ts',
        // mocks
        'src/repositories/mock/account-mock.ts',
        'src/repositories/mock/card-mock.ts',
        'src/repositories/mock/loan-mock.ts',
        'src/repositories/mock/product-mock.ts',
        'src/repositories/mock/settings-mock.ts',
        'src/repositories/mock/transaction-mock.ts',
        'src/repositories/mock/upcoming-transaction-mocks.ts',
        'src/repositories/mock/user-mock.ts',
        'src/repositories/mock/user-products-mock.ts',
        // workflows
        'src/workflows/transfer/transfer-workflow.ts',
        'src/workflows/card-detail/card-detail-workflow.ts',
        'src/workflows/card/card-workflow.ts',
        'src/workflows/create-account/create-account-workflow.ts',
        'src/workflows/kyc/kyc-workflow.ts',
        'src/workflows/swish-workflow.ts',
        'src/workflows/payments/add-contact-workflow.ts',
        'src/workflows/account-info/account-info-workflow.ts',
        'src/workflows/signing/signing-workflow.ts',
        'src/workflows/loan/loan-workflow.ts',
        'src/workflows/edit-upcoming-workflow.ts',
        // pages
        'src/pages/dashboard-page.ts',
        'src/pages/investments-page.ts',
        'src/pages/savings-page.ts',
        // example widgets
        'src/widgets/error-widget.ts',
        'src/widgets/slow-widget.ts',
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
    publicPath: publicPath,
    external: [
        "@microsoft/fast-element",
        "@chart/js",
        "@widgets/welcome", "@widgets/account", 
        "@widgets/financial-health",
        "@widgets/swish",
        // components
        "@components/modal",
        // mocks
        "@mocks/*",
        // workflows
        "@workflows/*",
        // pages
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
                {
                    from: ['./src/styles/**/*'],
                    to: ['./styles'],
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
