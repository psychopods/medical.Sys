import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'favicon.svg', 'trhm.jpg', 'mitz-logo.png'],
      manifest: {
        name: 'Tanzania Rural Health Movement - Street Medicine',
        short_name: 'TRHM Street Med',
        description: 'Offline-first hospital management and child biometric registration system.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'mitz-logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'mitz-logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,wasm,txt}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/trhm-api\.mitzkits\.co\.tz\/api\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
})

