import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.webp', 'favicon.ico', 'logo-small.webp'],
      manifest: false, // Use existing manifest.json
      workbox: {
        // Cache static assets aggressively - incluindo imagens críticas
        globPatterns: [
          '**/*.{js,css,html,ico,png,jpg,jpeg,webp,svg,woff,woff2}',
          'assets/politico-*.png',
          'assets/estudos-background.jpg',
          'assets/hero-*.webp',
          'assets/themis-*.webp',
        ],
        // Runtime caching strategies - OTIMIZADO AGRESSIVAMENTE
        runtimeCaching: [
          {
            // Cache images from Supabase storage - AUMENTADO
            urlPattern: /^https:\/\/izspjvegxdfgkgibpyst\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images',
              expiration: {
                maxEntries: 500, // AUMENTADO de 200
                maxAgeSeconds: 60 * 60 * 24 * 60 // 60 dias (era 30)
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache API responses - STALE WHILE REVALIDATE para velocidade
            urlPattern: /^https:\/\/izspjvegxdfgkgibpyst\.supabase\.co\/rest\/.*/i,
            handler: 'StaleWhileRevalidate', // MUDADO de NetworkFirst
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 200, // AUMENTADO de 100
                maxAgeSeconds: 60 * 30 // 30 minutos (era 5)
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 50, // AUMENTADO de 30
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache external images - MAIS DOMÍNIOS
            urlPattern: /^https:\/\/(www\.conjur\.com\.br|static\.poder360\.com\.br|jpimg\.com\.br|i\.imgur\.com|upload\.wikimedia\.org|commons\.wikimedia\.org)\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'external-images',
              expiration: {
                maxEntries: 200, // AUMENTADO de 100
                maxAgeSeconds: 60 * 60 * 24 * 14 // 14 dias (era 7)
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // NOVO: Cache Wikipedia API
            urlPattern: /^https:\/\/pt\.wikipedia\.org\/api\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'wikipedia-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dias
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // NOVO: Cache Câmara dos Deputados API
            urlPattern: /^https:\/\/dadosabertos\.camara\.leg\.br\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'camara-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 2 // 2 horas (dados mudam frequentemente)
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // NOVO: Cache Senado API
            urlPattern: /^https:\/\/legis\.senado\.leg\.br\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'senado-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 2 // 2 horas
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        // Clean old caches
        cleanupOutdatedCaches: true,
        // Skip waiting to update immediately
        skipWaiting: true,
        clientsClaim: true,
        // Increase limit to cache larger bundles (15MB)
        maximumFileSizeToCacheInBytes: 17 * 1024 * 1024
      }
    }),
    // Compressão Brotli (melhor que gzip, ~20% menor)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024, // Comprimir arquivos > 1KB
    }),
    // Compressão Gzip como fallback
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Prevent duplicate React instances
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        // Manual chunks otimizados para melhor caching e code splitting
        manualChunks: {
          // Core React
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // UI Components (Radix)
          'vendor-ui': [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-dropdown-menu', 
            '@radix-ui/react-tabs', 
            '@radix-ui/react-accordion',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
          ],
          
          // Data fetching
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          
          // Visualização
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
          'vendor-diagrams': ['mermaid'],
          'vendor-lottie': ['@lottiefiles/dotlottie-react'],
          
          // Google Maps (carregado via API, não precisa de chunk separado)
          
          // PDF e documentos
          'vendor-pdf': ['pdfjs-dist', 'react-pdf', 'jspdf', 'html2canvas'],
          
          // Formulários
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Markdown
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
          
          // Áudio
          'vendor-audio': ['use-sound'],
          
          // Utilitários de data
          'vendor-date': ['date-fns'],
        },
      },
      treeshake: true,
    },
    chunkSizeWarningLimit: 2000,
  }
}));
