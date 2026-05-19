import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile(), VitePWA({
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    includeAssets: ['favicon.svg'],
    manifest: {
      name: 'ChartAI — AI Chart Analysis',
      short_name: 'ChartAI',
      description: 'AI-powered chart analysis for traders. Upload charts and get institutional-grade trade setups.',
      theme_color: '#0d0e1a',
      background_color: '#0d0e1a',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      id: '/',
      categories: ['finance', 'productivity'],
      icons: [
        {
          src: 'pwa-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: 'pwa-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
      shortcuts: [
        {
          name: 'Analyze Charts',
          short_name: 'Analyze',
          description: 'Start a new chart analysis',
          url: '/?action=analyze',
          icons: [{ src: 'favicon.svg', sizes: '96x96' }],
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{html,js,css,svg,png,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/openrouter\.ai\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'openrouter-api',
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 5 },
            networkTimeoutSeconds: 60,
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-api',
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 10 },
            networkTimeoutSeconds: 30,
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
  }), cloudflare()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    https: false
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
})