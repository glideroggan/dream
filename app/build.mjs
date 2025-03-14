import * as build from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { htmlUpdaterPlugin } from "./plugins/copy-with-hash.mjs";

const env = "'server'"

const context = await build.context({
    entryPoints: [
        'src/main.ts',
        // Widget entry points
        'src/widgets/welcome/welcome-widget.ts',
        'src/widgets/account-widget/account-widget.ts',
        'src/widgets/swish-widget.ts',
        'src/widgets/financial-health-widget/financial-health-widget.ts',
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
    splitting: true,
    sourcemap: true,
    outdir: 'dist',
    logLevel: 'info',
    format: 'esm',
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
    external: [
        "@microsoft/fast-element",
        "@chart/js",
        "@widgets/welcome", "@widgets/account",
        "@widgets/financial-health",
        "@widgets/swish",
        // workflows
        "@workflows/*",
        // pages
        "@pages/dashboard", "@pages/investments", "@pages/savings",
        "@widgets/error", "@widgets/fast", "@widgets/slow",
    ],
    define: {
        // TODO: do we need another build.js file for the server? or can we send in some values here?
        'process.env.ENV': env,
    },
    plugins: [
        htmlUpdaterPlugin({ indexName: 'index.docker.html' }),
        copy({
            assets: [
                {
                    from: ['./src/assets/**/*'],
                    to: ['./assets'],
                }
            ],
            watch: true,
        }),
    ],
});

// TODO: check if we can or should try to create an entry point for css main.css
// https://esbuild.github.io/content-types/#css

const result = await context.rebuild()
await context.dispose()
