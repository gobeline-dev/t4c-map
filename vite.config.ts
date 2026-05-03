import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig({
    base: '/t4c-nms-overview/',
    plugins: [
        react(),
        compression({ algorithms: ['gzip'] }),
        compression({ algorithms: ['brotliCompress'] }),
    ],
    build: {
        target: 'es2022',
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-three': ['three', '@react-three/fiber'],
                    'vendor-motion': ['framer-motion'],
                    'vendor-zoom': ['react-zoom-pan-pinch'],
                },
            },
        },
    },
})
