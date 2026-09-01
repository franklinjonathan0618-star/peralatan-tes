import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';
import { componentTagger } from 'lovable-tagger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      tsDecorators: true,
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  server: {
    host: '::',
    port: 5173,
    strictPort: true,
  },
  // Use standalone tsconfig to avoid project references issues
  tsconfig: './tsconfig.standalone.json',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'lucide-react',
    ],
  },
  esbuild: {
    target: 'es2020',
    jsx: 'automatic',
    loader: 'tsx',
    include: /\.(tsx?|jsx?)$/,
    logOverride: { 
      'this-is-undefined-in-esm': 'silent',
      'tsconfig-emit': 'silent'
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist-lovable',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    commonjsOptions: {
      transformMixedEsModules: true
    },
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress TypeScript warnings
        if (warning.code === 'TS6305') return;
        if (warning.code === 'TS6310') return;
        if (warning.code === 'TYPESCRIPT_ERROR') return;
        if (warning.message?.includes('.d.ts')) return;
        if (warning.message?.includes('may not disable emit')) return;
        warn(warning);
      }
    }
  },
}));