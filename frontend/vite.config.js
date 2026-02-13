import { defineConfig } from 'vite'

/**
 * Configuração do Vite
 */
export default defineConfig({
   root: 'src/',
   publicDir: '../public',
   base: './',
   server: {
      open: true,
      host: 'localhost',
      port: 8080
   },
   build: { 
      target: 'esnext',
      outDir: '../dist',
      emptyOutDir: true,
      rollupOptions: {
         input: [ 
            'src/home.html',
            'src/welcome.html', 
            'src/index.html',
            // 'src/catalog.html',
            // 'src/dashboard.html',
            // 'src/downloads.html',
            // 'src/index.html',
            // 'src/partners.html',
            // 'src/price.html',
            // 'src/view.html', 
            // 'src/sales.html',
         ]
      }
   }
})
