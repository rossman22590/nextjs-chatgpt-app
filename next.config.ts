import type { NextConfig } from 'next';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Build information: from CI, or git commit hash
let buildHash = process.env.NEXT_PUBLIC_BUILD_HASH || process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA; // Docker or custom, GitHub Actions, Vercel
try {
  // fallback to local git commit hash
  if (!buildHash)
    buildHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // final fallback
  buildHash = '2-dev';
}
// The following are used by/available to Release.buildInfo(...)
// Ensure buildHash is a string before calling slice
buildHash = String(buildHash || 'unknown');
process.env.NEXT_PUBLIC_BUILD_HASH = buildHash.slice(0, 10);
try {
  process.env.NEXT_PUBLIC_BUILD_PKGVER = JSON.parse('' + readFileSync(new URL('./package.json', import.meta.url))).version || 'unknown';
} catch {
  process.env.NEXT_PUBLIC_BUILD_PKGVER = 'unknown';
}
process.env.NEXT_PUBLIC_BUILD_TIMESTAMP = new Date().toISOString() || 'unknown';
process.env.NEXT_PUBLIC_DEPLOYMENT_TYPE = process.env.NEXT_PUBLIC_DEPLOYMENT_TYPE || (process.env.VERCEL_ENV ? `vercel-${process.env.VERCEL_ENV}` : 'local'); // Docker or custom, Vercel
console.log(` 🧠 \x1b[1mbig-AGI\x1b[0m v${process.env.NEXT_PUBLIC_BUILD_PKGVER} (@${process.env.NEXT_PUBLIC_BUILD_HASH})`);

// Non-default build types
const buildType =
  process.env.BIG_AGI_BUILD === 'standalone' ? 'standalone' as const
    : process.env.BIG_AGI_BUILD === 'static' ? 'export' as const
      : undefined;

buildType && console.log(` 🧠 big-AGI: building for ${buildType}...\n`);

/** @type {import('next').NextConfig} */
let nextConfig: NextConfig = {
  reactStrictMode: true,

  // [exports] https://nextjs.org/docs/advanced-features/static-html-export
  ...buildType && {
    output: buildType,
    distDir: 'dist',

    // disable image optimization for exports
    images: { unoptimized: true },

    // Optional: Change links `/me` -> `/me/` and emit `/me.html` -> `/me/index.html`
    // trailingSlash: true,
  },

  // [puppeteer] https://github.com/puppeteer/puppeteer/issues/11052
  // NOTE: we may not be needing this anymore, as we use '@cloudflare/puppeteer'
  serverExternalPackages: ['puppeteer-core', 'crypto-browserify'],

  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // @mui/joy: anything material gets redirected to Joy
    config.resolve.alias['@mui/material'] = '@mui/joy';

    // @dqbd/tiktoken: enable asynchronous WebAssembly
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    // Add module rule for WebAssembly
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async'
    });

    // fix warnings for async functions in the browser (https://github.com/vercel/next.js/issues/64792)
    if (!isServer) {
      config.output.environment = { ...config.output.environment, asyncFunction: true };
      
      // Don't resolve 'fs' module on the client to prevent errors on build
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
      };
    }

    // prevent too many small chunks (40kb min) on 'client' packs (not 'server' or 'edge-server')
    // noinspection JSUnresolvedReference
    if (typeof config.optimization.splitChunks === 'object' && config.optimization.splitChunks.minSize) {
      // noinspection JSUnresolvedReference
      config.optimization.splitChunks.minSize = 40 * 1024;
    }

    return config;
  },

  // Optional Analytics > PostHog
  skipTrailingSlashRedirect: true, // required to support PostHog trailing slash API requests
  async rewrites() {
    return [
      {
        source: '/a/ph/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/a/ph/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/a/ph/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
    ];
  },

  // Note: disabled to check whether the project becomes slower with this
  // modularizeImports: {
  //   '@mui/icons-material': {
  //     transform: '@mui/icons-material/{{member}}',
  //   },
  // },

  // Uncomment the following leave console messages in production
  // compiler: {
  //   removeConsole: false,
  // },
};

// Validate environment variables, if set at build time. Will be actually read and used at runtime.
import { verifyBuildTimeVars } from '~/server/env';
verifyBuildTimeVars();

// conditionally enable the nextjs bundle analyzer
import withBundleAnalyzer from '@next/bundle-analyzer';
if (process.env.ANALYZE_BUNDLE) {
  nextConfig = withBundleAnalyzer({ openAnalyzer: true })(nextConfig) as NextConfig;
}

export default nextConfig;