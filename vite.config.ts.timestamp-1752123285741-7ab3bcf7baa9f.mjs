// vite.config.ts
import { defineConfig } from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/vite/dist/node/index.js";
import react from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/@vitejs/plugin-react/dist/index.mjs";
import svgr from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/vite-plugin-svgr/dist/index.js";
import { nodePolyfills } from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/vite-plugin-node-polyfills/dist/index.js";
import commonjs from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/@rollup/plugin-commonjs/dist/es/index.js";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/vite.config.ts";
var vite_config_default = defineConfig(({ mode }) => ({
  // Enable detailed logging
  logLevel: "info",
  // Improve error messages
  clearScreen: false,
  // Set the base URL for the app
  base: "/",
  // Server configuration is defined below
  // Enable source maps for better debugging
  build: {
    sourcemap: true,
    minify: mode === "production" ? "esbuild" : false,
    rollupOptions: {
      // Ensure proper handling of CommonJS modules
      external: [],
      output: {
        manualChunks: void 0,
        inlineDynamicImports: true,
        // Ensure proper handling of global variables
        globals: {
          react: "React",
          "react-dom": "ReactDOM"
        }
      },
      onwarn(warning, warn) {
        if (warning.code === "EVAL") return;
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
        warn(warning);
      }
    }
  },
  plugins: [
    // Add Node.js polyfills
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      include: ["path", "stream", "util", "buffer", "crypto", "process"],
      globals: {
        process: true,
        Buffer: true,
        global: true
      },
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true
    }),
    // Ensure proper TypeScript handling
    {
      name: "typescript-imports",
      resolveId(source) {
        if (source.endsWith(".tsx") || source.endsWith(".ts")) {
          return { id: source, external: false };
        }
        return null;
      }
    },
    // Convert CommonJS modules to ES modules
    commonjs({
      include: /node_modules/
    }),
    // React plugin with JSX runtime
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        presets: [
          "@babel/preset-env",
          ["@babel/preset-react", {
            runtime: "automatic",
            importSource: "@emotion/react"
          }],
          "@babel/preset-typescript"
        ],
        plugins: [
          "@emotion/babel-plugin",
          ["@babel/plugin-transform-runtime", {
            regenerator: true
          }]
        ]
      }
    }),
    // Temporarily disabled lovable-tagger
    // mode === 'development' && componentTagger(),
    svgr({
      esbuildOptions: {
        // Enable esbuild polyfill for Node.js globals and built-ins
        define: {
          global: "globalThis"
        }
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    },
    extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
    // Ensure proper module resolution
    mainFields: ["browser", "module", "jsnext:main", "jsnext", "main"]
  },
  define: {
    "process.env": {},
    global: "globalThis"
  },
  // Cache configuration
  cacheDir: "node_modules/.vite",
  server: {
    port: 5173,
    strictPort: true,
    open: true,
    cors: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        secure: false
      },
      "/supabase": {
        target: "https://mdlamzewucztnxqnayqs.supabase.co",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase/, ""),
        secure: false
      }
    },
    fs: {
      strict: true
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis"
      },
      // Enable esbuild polyfill for Node.js globals and built-ins
      target: "es2020"
    }
  },
  // Server configuration moved to the top
  preview: {
    port: 8080,
    strictPort: true
  },
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxwZXJhbGF0YW4tbXd0LWRpdmlzaS1pbmZyYXN0cnVrdHVyXFxcXHBlcmFsYXRhbi1td3QtZGl2aXNpLWluZnJhc3RydWt0dXItYWY1ZDkzYWNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXHBlcmFsYXRhbi1td3QtZGl2aXNpLWluZnJhc3RydWt0dXJcXFxccGVyYWxhdGFuLW13dC1kaXZpc2ktaW5mcmFzdHJ1a3R1ci1hZjVkOTNhY1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovcGVyYWxhdGFuLW13dC1kaXZpc2ktaW5mcmFzdHJ1a3R1ci9wZXJhbGF0YW4tbXd0LWRpdmlzaS1pbmZyYXN0cnVrdHVyLWFmNWQ5M2FjL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgc3ZnciBmcm9tICd2aXRlLXBsdWdpbi1zdmdyJztcbmltcG9ydCB7IG5vZGVQb2x5ZmlsbHMgfSBmcm9tICd2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxscyc7XG5pbXBvcnQgY29tbW9uanMgZnJvbSAnQHJvbGx1cC9wbHVnaW4tY29tbW9uanMnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICAvLyBFbmFibGUgZGV0YWlsZWQgbG9nZ2luZ1xuICBsb2dMZXZlbDogJ2luZm8nLFxuICAvLyBJbXByb3ZlIGVycm9yIG1lc3NhZ2VzXG4gIGNsZWFyU2NyZWVuOiBmYWxzZSxcbiAgXG4gIC8vIFNldCB0aGUgYmFzZSBVUkwgZm9yIHRoZSBhcHBcbiAgYmFzZTogJy8nLFxuICBcbiAgLy8gU2VydmVyIGNvbmZpZ3VyYXRpb24gaXMgZGVmaW5lZCBiZWxvd1xuICAvLyBFbmFibGUgc291cmNlIG1hcHMgZm9yIGJldHRlciBkZWJ1Z2dpbmdcbiAgYnVpbGQ6IHtcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgbWluaWZ5OiBtb2RlID09PSAncHJvZHVjdGlvbicgPyAnZXNidWlsZCcgOiBmYWxzZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAvLyBFbnN1cmUgcHJvcGVyIGhhbmRsaW5nIG9mIENvbW1vbkpTIG1vZHVsZXNcbiAgICAgIGV4dGVybmFsOiBbXSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHVuZGVmaW5lZCxcbiAgICAgICAgaW5saW5lRHluYW1pY0ltcG9ydHM6IHRydWUsXG4gICAgICAgIC8vIEVuc3VyZSBwcm9wZXIgaGFuZGxpbmcgb2YgZ2xvYmFsIHZhcmlhYmxlc1xuICAgICAgICBnbG9iYWxzOiB7XG4gICAgICAgICAgcmVhY3Q6ICdSZWFjdCcsXG4gICAgICAgICAgJ3JlYWN0LWRvbSc6ICdSZWFjdERPTScsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgb253YXJuKHdhcm5pbmcsIHdhcm4pIHtcbiAgICAgICAgLy8gSWdub3JlIGNlcnRhaW4gd2FybmluZ3NcbiAgICAgICAgaWYgKHdhcm5pbmcuY29kZSA9PT0gJ0VWQUwnKSByZXR1cm47XG4gICAgICAgIGlmICh3YXJuaW5nLmNvZGUgPT09ICdNT0RVTEVfTEVWRUxfRElSRUNUSVZFJykgcmV0dXJuO1xuICAgICAgICB3YXJuKHdhcm5pbmcpO1xuICAgICAgfSxcbiAgICB9XG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICAvLyBBZGQgTm9kZS5qcyBwb2x5ZmlsbHNcbiAgICBub2RlUG9seWZpbGxzKHtcbiAgICAgIC8vIFRvIGFkZCBvbmx5IHNwZWNpZmljIHBvbHlmaWxscywgYWRkIHRoZW0gaGVyZS4gSWYgbm8gb3B0aW9uIGlzIHBhc3NlZCwgYWRkcyBhbGwgcG9seWZpbGxzXG4gICAgICBpbmNsdWRlOiBbJ3BhdGgnLCAnc3RyZWFtJywgJ3V0aWwnLCAnYnVmZmVyJywgJ2NyeXB0bycsICdwcm9jZXNzJ10sXG4gICAgICBnbG9iYWxzOiB7XG4gICAgICAgIHByb2Nlc3M6IHRydWUsXG4gICAgICAgIEJ1ZmZlcjogdHJ1ZSxcbiAgICAgICAgZ2xvYmFsOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIC8vIFdoZXRoZXIgdG8gcG9seWZpbGwgYG5vZGU6YCBwcm90b2NvbCBpbXBvcnRzLlxuICAgICAgcHJvdG9jb2xJbXBvcnRzOiB0cnVlLFxuICAgIH0pLFxuICAgIFxuICAgIC8vIEVuc3VyZSBwcm9wZXIgVHlwZVNjcmlwdCBoYW5kbGluZ1xuICAgIHtcbiAgICAgIG5hbWU6ICd0eXBlc2NyaXB0LWltcG9ydHMnLFxuICAgICAgcmVzb2x2ZUlkKHNvdXJjZTogc3RyaW5nKSB7XG4gICAgICAgIGlmIChzb3VyY2UuZW5kc1dpdGgoJy50c3gnKSB8fCBzb3VyY2UuZW5kc1dpdGgoJy50cycpKSB7XG4gICAgICAgICAgcmV0dXJuIHsgaWQ6IHNvdXJjZSwgZXh0ZXJuYWw6IGZhbHNlIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9LFxuICAgIH0sXG4gICAgXG4gICAgLy8gQ29udmVydCBDb21tb25KUyBtb2R1bGVzIHRvIEVTIG1vZHVsZXNcbiAgICBjb21tb25qcyh7XG4gICAgICBpbmNsdWRlOiAvbm9kZV9tb2R1bGVzLyxcbiAgICB9KSxcbiAgICBcbiAgICAvLyBSZWFjdCBwbHVnaW4gd2l0aCBKU1ggcnVudGltZVxuICAgIHJlYWN0KHtcbiAgICAgIGpzeEltcG9ydFNvdXJjZTogJ0BlbW90aW9uL3JlYWN0JyxcbiAgICAgIGJhYmVsOiB7XG4gICAgICAgIHByZXNldHM6IFtcbiAgICAgICAgICAnQGJhYmVsL3ByZXNldC1lbnYnLFxuICAgICAgICAgIFsnQGJhYmVsL3ByZXNldC1yZWFjdCcsIHsgXG4gICAgICAgICAgICBydW50aW1lOiAnYXV0b21hdGljJyxcbiAgICAgICAgICAgIGltcG9ydFNvdXJjZTogJ0BlbW90aW9uL3JlYWN0JyxcbiAgICAgICAgICB9XSxcbiAgICAgICAgICAnQGJhYmVsL3ByZXNldC10eXBlc2NyaXB0JyxcbiAgICAgICAgXSxcbiAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgICdAZW1vdGlvbi9iYWJlbC1wbHVnaW4nLFxuICAgICAgICAgIFsnQGJhYmVsL3BsdWdpbi10cmFuc2Zvcm0tcnVudGltZScsIHtcbiAgICAgICAgICAgIHJlZ2VuZXJhdG9yOiB0cnVlLFxuICAgICAgICAgIH1dLFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9KSxcbiAgICAvLyBUZW1wb3JhcmlseSBkaXNhYmxlZCBsb3ZhYmxlLXRhZ2dlclxuICAgIC8vIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgJiYgY29tcG9uZW50VGFnZ2VyKCksXG4gICAgc3Zncih7XG4gICAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgICAvLyBFbmFibGUgZXNidWlsZCBwb2x5ZmlsbCBmb3IgTm9kZS5qcyBnbG9iYWxzIGFuZCBidWlsdC1pbnNcbiAgICAgICAgZGVmaW5lOiB7XG4gICAgICAgICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcycsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICBcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICB9LFxuICAgIGV4dGVuc2lvbnM6IFsnLnRzeCcsICcudHMnLCAnLmpzeCcsICcuanMnLCAnLm1qcycsICcuanNvbiddLFxuICAgIC8vIEVuc3VyZSBwcm9wZXIgbW9kdWxlIHJlc29sdXRpb25cbiAgICBtYWluRmllbGRzOiBbJ2Jyb3dzZXInLCAnbW9kdWxlJywgJ2pzbmV4dDptYWluJywgJ2pzbmV4dCcsICdtYWluJ10sXG4gIH0sXG4gIGRlZmluZToge1xuICAgICdwcm9jZXNzLmVudic6IHt9LFxuICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICB9LFxuICBcbiAgLy8gQ2FjaGUgY29uZmlndXJhdGlvblxuICBjYWNoZURpcjogJ25vZGVfbW9kdWxlcy8udml0ZScsXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDUxNzMsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBvcGVuOiB0cnVlLFxuICAgIGNvcnM6IHRydWUsXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJyksXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICB9LFxuICAgICAgJy9zdXBhYmFzZSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9tZGxhbXpld3VjenRueHFuYXlxcy5zdXBhYmFzZS5jbycsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL3N1cGFiYXNlLywgJycpLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgfVxuICAgIH0sXG4gICAgZnM6IHtcbiAgICAgIHN0cmljdDogdHJ1ZSxcbiAgICB9LFxuICB9LFxuICBcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXNidWlsZE9wdGlvbnM6IHtcbiAgICAgIC8vIE5vZGUuanMgZ2xvYmFsIHRvIGJyb3dzZXIgZ2xvYmFsVGhpc1xuICAgICAgZGVmaW5lOiB7XG4gICAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICAgICAgfSxcbiAgICAgIC8vIEVuYWJsZSBlc2J1aWxkIHBvbHlmaWxsIGZvciBOb2RlLmpzIGdsb2JhbHMgYW5kIGJ1aWx0LWluc1xuICAgICAgdGFyZ2V0OiAnZXMyMDIwJyxcbiAgICB9LFxuICB9LFxuICBcbiAgLy8gU2VydmVyIGNvbmZpZ3VyYXRpb24gbW92ZWQgdG8gdGhlIHRvcFxuICBcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDgwODAsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgfSxcbiAgXG4gIGVzYnVpbGQ6IHtcbiAgICBsb2dPdmVycmlkZTogeyAndGhpcy1pcy11bmRlZmluZWQtaW4tZXNtJzogJ3NpbGVudCcgfSxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMmEsU0FBUyxvQkFBb0I7QUFDeGMsT0FBTyxXQUFXO0FBRWxCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHFCQUFxQjtBQUM5QixPQUFPLGNBQWM7QUFDckIsU0FBUyxxQkFBcUI7QUFOaVAsSUFBTSwyQ0FBMkM7QUFTaFUsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQTtBQUFBLEVBRXpDLFVBQVU7QUFBQTtBQUFBLEVBRVYsYUFBYTtBQUFBO0FBQUEsRUFHYixNQUFNO0FBQUE7QUFBQTtBQUFBLEVBSU4sT0FBTztBQUFBLElBQ0wsV0FBVztBQUFBLElBQ1gsUUFBUSxTQUFTLGVBQWUsWUFBWTtBQUFBLElBQzVDLGVBQWU7QUFBQTtBQUFBLE1BRWIsVUFBVSxDQUFDO0FBQUEsTUFDWCxRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsUUFDZCxzQkFBc0I7QUFBQTtBQUFBLFFBRXRCLFNBQVM7QUFBQSxVQUNQLE9BQU87QUFBQSxVQUNQLGFBQWE7QUFBQSxRQUNmO0FBQUEsTUFDRjtBQUFBLE1BQ0EsT0FBTyxTQUFTLE1BQU07QUFFcEIs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
