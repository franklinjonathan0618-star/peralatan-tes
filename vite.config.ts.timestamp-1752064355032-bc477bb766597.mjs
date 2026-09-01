// vite.config.ts
import { defineConfig } from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/vite/dist/node/index.js";
import react from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import svgr from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/vite-plugin-svgr/dist/index.js";
import { nodePolyfills } from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/vite-plugin-node-polyfills/dist/index.js";
import commonjs from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/@rollup/plugin-commonjs/dist/es/index.js";
var __vite_injected_original_dirname = "E:\\peralatan-mwt-divisi-infrastruktur\\peralatan-mwt-divisi-infrastruktur-af5d93ac";
var vite_config_default = defineConfig(({ mode }) => ({
  // Enable detailed logging
  logLevel: "info",
  // Improve error messages
  clearScreen: false,
  // Set the base URL for the app
  base: "/",
  // Configure the development server
  server: {
    port: 5173,
    strictPort: true,
    open: true,
    cors: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/api/, ""),
        secure: false
      },
      "/supabase": {
        target: "https://mdlamzewucztnxqnayqs.supabase.co",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/supabase/, ""),
        secure: false
      }
    }
  },
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
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true
    }),
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
      "@": path.resolve(__vite_injected_original_dirname, "./src")
      // Add more aliases if needed
    },
    extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
    // Ensure proper module resolution
    mainFields: ["browser", "module", "jsnext:main", "jsnext", "main"]
  },
  // Disable caching during development
  cacheDir: "node_modules/.vite",
  server: {
    // ... existing server config
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
  // Server configuration moved above
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxwZXJhbGF0YW4tbXd0LWRpdmlzaS1pbmZyYXN0cnVrdHVyXFxcXHBlcmFsYXRhbi1td3QtZGl2aXNpLWluZnJhc3RydWt0dXItYWY1ZDkzYWNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXHBlcmFsYXRhbi1td3QtZGl2aXNpLWluZnJhc3RydWt0dXJcXFxccGVyYWxhdGFuLW13dC1kaXZpc2ktaW5mcmFzdHJ1a3R1ci1hZjVkOTNhY1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovcGVyYWxhdGFuLW13dC1kaXZpc2ktaW5mcmFzdHJ1a3R1ci9wZXJhbGF0YW4tbXd0LWRpdmlzaS1pbmZyYXN0cnVrdHVyLWFmNWQ5M2FjL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG4vLyBUZW1wb3JhcmlseSBkaXNhYmxlIGxvdmFibGUtdGFnZ2VyIGFzIGl0J3MgY2F1c2luZyBpc3N1ZXNcbi8vIGltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gJ2xvdmFibGUtdGFnZ2VyJztcbmltcG9ydCBzdmdyIGZyb20gJ3ZpdGUtcGx1Z2luLXN2Z3InO1xuaW1wb3J0IHsgbm9kZVBvbHlmaWxscyB9IGZyb20gJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzJztcbmltcG9ydCBjb21tb25qcyBmcm9tICdAcm9sbHVwL3BsdWdpbi1jb21tb25qcyc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICAvLyBFbmFibGUgZGV0YWlsZWQgbG9nZ2luZ1xuICBsb2dMZXZlbDogJ2luZm8nLFxuICAvLyBJbXByb3ZlIGVycm9yIG1lc3NhZ2VzXG4gIGNsZWFyU2NyZWVuOiBmYWxzZSxcbiAgXG4gIC8vIFNldCB0aGUgYmFzZSBVUkwgZm9yIHRoZSBhcHBcbiAgYmFzZTogJy8nLFxuICBcbiAgLy8gQ29uZmlndXJlIHRoZSBkZXZlbG9wbWVudCBzZXJ2ZXJcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3MyxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIG9wZW46IHRydWUsXG4gICAgY29yczogdHJ1ZSxcbiAgICBwcm94eToge1xuICAgICAgJy9hcGknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sICcnKSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICAnL3N1cGFiYXNlJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL21kbGFtemV3dWN6dG54cW5heXFzLnN1cGFiYXNlLmNvJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvc3VwYWJhc2UvLCAnJyksXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICB9XG4gICAgfSxcbiAgfSxcbiAgLy8gRW5hYmxlIHNvdXJjZSBtYXBzIGZvciBiZXR0ZXIgZGVidWdnaW5nXG4gIGJ1aWxkOiB7XG4gICAgc291cmNlbWFwOiB0cnVlLFxuICAgIG1pbmlmeTogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nID8gJ2VzYnVpbGQnIDogZmFsc2UsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgLy8gRW5zdXJlIHByb3BlciBoYW5kbGluZyBvZiBDb21tb25KUyBtb2R1bGVzXG4gICAgICBleHRlcm5hbDogW10sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB1bmRlZmluZWQsXG4gICAgICAgIGlubGluZUR5bmFtaWNJbXBvcnRzOiB0cnVlLFxuICAgICAgICAvLyBFbnN1cmUgcHJvcGVyIGhhbmRsaW5nIG9mIGdsb2JhbCB2YXJpYWJsZXNcbiAgICAgICAgZ2xvYmFsczoge1xuICAgICAgICAgIHJlYWN0OiAnUmVhY3QnLFxuICAgICAgICAgICdyZWFjdC1kb20nOiAnUmVhY3RET00nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG9ud2Fybih3YXJuaW5nLCB3YXJuKSB7XG4gICAgICAgIC8vIElnbm9yZSBjZXJ0YWluIHdhcm5pbmdzXG4gICAgICAgIGlmICh3YXJuaW5nLmNvZGUgPT09ICdFVkFMJykgcmV0dXJuO1xuICAgICAgICBpZiAod2FybmluZy5jb2RlID09PSAnTU9EVUxFX0xFVkVMX0RJUkVDVElWRScpIHJldHVybjtcbiAgICAgICAgd2Fybih3YXJuaW5nKTtcbiAgICAgIH0sXG4gICAgfVxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgLy8gQWRkIE5vZGUuanMgcG9seWZpbGxzXG4gICAgbm9kZVBvbHlmaWxscyh7XG4gICAgICAvLyBUbyBhZGQgb25seSBzcGVjaWZpYyBwb2x5ZmlsbHMsIGFkZCB0aGVtIGhlcmUuIElmIG5vIG9wdGlvbiBpcyBwYXNzZWQsIGFkZHMgYWxsIHBvbHlmaWxsc1xuICAgICAgaW5jbHVkZTogWydwYXRoJywgJ3N0cmVhbScsICd1dGlsJywgJ2J1ZmZlcicsICdjcnlwdG8nLCAncHJvY2VzcyddLFxuICAgICAgLy8gV2hldGhlciB0byBwb2x5ZmlsbCBgbm9kZTpgIHByb3RvY29sIGltcG9ydHMuXG4gICAgICBwcm90b2NvbEltcG9ydHM6IHRydWUsXG4gICAgfSksXG4gICAgXG4gICAgLy8gQ29udmVydCBDb21tb25KUyBtb2R1bGVzIHRvIEVTIG1vZHVsZXNcbiAgICBjb21tb25qcyh7XG4gICAgICBpbmNsdWRlOiAvbm9kZV9tb2R1bGVzLyxcbiAgICB9KSxcbiAgICBcbiAgICAvLyBSZWFjdCBwbHVnaW4gd2l0aCBKU1ggcnVudGltZVxuICAgIHJlYWN0KHtcbiAgICAgIGpzeEltcG9ydFNvdXJjZTogJ0BlbW90aW9uL3JlYWN0JyxcbiAgICAgIGJhYmVsOiB7XG4gICAgICAgIHByZXNldHM6IFtcbiAgICAgICAgICAnQGJhYmVsL3ByZXNldC1lbnYnLFxuICAgICAgICAgIFsnQGJhYmVsL3ByZXNldC1yZWFjdCcsIHsgXG4gICAgICAgICAgICBydW50aW1lOiAnYXV0b21hdGljJyxcbiAgICAgICAgICAgIGltcG9ydFNvdXJjZTogJ0BlbW90aW9uL3JlYWN0JyxcbiAgICAgICAgICB9XSxcbiAgICAgICAgICAnQGJhYmVsL3ByZXNldC10eXBlc2NyaXB0JyxcbiAgICAgICAgXSxcbiAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgICdAZW1vdGlvbi9iYWJlbC1wbHVnaW4nLFxuICAgICAgICAgIFsnQGJhYmVsL3BsdWdpbi10cmFuc2Zvcm0tcnVudGltZScsIHtcbiAgICAgICAgICAgIHJlZ2VuZXJhdG9yOiB0cnVlLFxuICAgICAgICAgIH1dLFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9KSxcbiAgICAvLyBUZW1wb3JhcmlseSBkaXNhYmxlZCBsb3ZhYmxlLXRhZ2dlclxuICAgIC8vIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgJiYgY29tcG9uZW50VGFnZ2VyKCksXG4gICAgc3Zncih7XG4gICAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgICAvLyBFbmFibGUgZXNidWlsZCBwb2x5ZmlsbCBmb3IgTm9kZS5qcyBnbG9iYWxzIGFuZCBidWlsdC1pbnNcbiAgICAgICAgZGVmaW5lOiB7XG4gICAgICAgICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcycsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICBcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgICAgLy8gQWRkIG1vcmUgYWxpYXNlcyBpZiBuZWVkZWRcbiAgICB9LFxuICAgIGV4dGVuc2lvbnM6IFsnLnRzeCcsICcudHMnLCAnLmpzeCcsICcuanMnLCAnLm1qcycsICcuanNvbiddLFxuICAgIC8vIEVuc3VyZSBwcm9wZXIgbW9kdWxlIHJlc29sdXRpb25cbiAgICBtYWluRmllbGRzOiBbJ2Jyb3dzZXInLCAnbW9kdWxlJywgJ2pzbmV4dDptYWluJywgJ2pzbmV4dCcsICdtYWluJ10sXG4gIH0sXG4gIFxuICAvLyBEaXNhYmxlIGNhY2hpbmcgZHVyaW5nIGRldmVsb3BtZW50XG4gIGNhY2hlRGlyOiAnbm9kZV9tb2R1bGVzLy52aXRlJyxcbiAgc2VydmVyOiB7XG4gICAgLy8gLi4uIGV4aXN0aW5nIHNlcnZlciBjb25maWdcbiAgICBmczoge1xuICAgICAgc3RyaWN0OiB0cnVlLFxuICAgIH0sXG4gIH0sXG4gIFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgLy8gTm9kZS5qcyBnbG9iYWwgdG8gYnJvd3NlciBnbG9iYWxUaGlzXG4gICAgICBkZWZpbmU6IHtcbiAgICAgICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcycsXG4gICAgICB9LFxuICAgICAgLy8gRW5hYmxlIGVzYnVpbGQgcG9seWZpbGwgZm9yIE5vZGUuanMgZ2xvYmFscyBhbmQgYnVpbHQtaW5zXG4gICAgICB0YXJnZXQ6ICdlczIwMjAnLFxuICAgIH0sXG4gIH0sXG4gIFxuICAvLyBTZXJ2ZXIgY29uZmlndXJhdGlvbiBtb3ZlZCBhYm92ZVxuICBcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDgwODAsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgfSxcbiAgXG4gIGVzYnVpbGQ6IHtcbiAgICBsb2dPdmVycmlkZTogeyAndGhpcy1pcy11bmRlZmluZWQtaW4tZXNtJzogJ3NpbGVudCcgfSxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMmEsU0FBUyxvQkFBb0I7QUFDeGMsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUdqQixPQUFPLFVBQVU7QUFDakIsU0FBUyxxQkFBcUI7QUFDOUIsT0FBTyxjQUFjO0FBUHJCLElBQU0sbUNBQW1DO0FBVXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUE7QUFBQSxFQUV6QyxVQUFVO0FBQUE7QUFBQSxFQUVWLGFBQWE7QUFBQTtBQUFBLEVBR2IsTUFBTTtBQUFBO0FBQUEsRUFHTixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTLENBQUNBLFVBQVNBLE1BQUssUUFBUSxVQUFVLEVBQUU7QUFBQSxRQUM1QyxRQUFRO0FBQUEsTUFDVjtBQUFBLE1BQ0EsYUFBYTtBQUFBLFFBQ1gsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDQSxVQUFTQSxNQUFLLFFBQVEsZUFBZSxFQUFFO0FBQUEsUUFDakQsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFFQSxPQUFPO0FBQUEsSUFDTCxXQUFXO0FBQUEsSUFDWCxRQUFRLFNBQVMsZUFBZSxZQUFZO0FBQUEsSUFDNUMsZUFBZTtBQUFBO0FBQUEsTUFFYixVQUFVLENBQUM7QUFBQSxNQUNYLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxRQUNkLHNCQUFzQjtBQUFBO0FBQUEsUUFFdEIsU0FBUztBQUFBLFVBQ1AsT0FBTztBQUFBLFVBQ1AsYUFBYTtBQUFBLFFBQ2Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxPQUFPLFNBQVMsTUFBTTtBQUVwQixZQUFJLFFBQVEsU0FBUyxPQUFRO0FBQzdCLFlBQUksUUFBUSxTQUFTLHlCQUEwQjtBQUMvQyxhQUFLLE9BQU87QUFBQSxNQUNkO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQTtBQUFBLElBRVAsY0FBYztBQUFBO0FBQUEsTUFFWixTQUFTLENBQUMsUUFBUSxVQUFVLFFBQVEsVUFBVSxVQUFVLFNBQVM7QUFBQTtBQUFBLE1BRWpFLGlCQUFpQjtBQUFBLElBQ25CLENBQUM7QUFBQTtBQUFBLElBR0QsU0FBUztBQUFBLE1BQ1AsU0FBUztBQUFBLElBQ1gsQ0FBQztBQUFBO0FBQUEsSUFHRCxNQUFNO0FBQUEsTUFDSixpQkFBaUI7QUFBQSxNQUNqQixPQUFPO0FBQUEsUUFDTCxTQUFTO0FBQUEsVUFDUDtBQUFBLFVBQ0EsQ0FBQyx1QkFBdUI7QUFBQSxZQUN0QixTQUFTO0FBQUEsWUFDVCxjQUFjO0FBQUEsVUFDaEIsQ0FBQztBQUFBLFVBQ0Q7QUFBQSxRQUNGO0FBQUEsUUFDQSxTQUFTO0FBQUEsVUFDUDtBQUFBLFVBQ0EsQ0FBQyxtQ0FBbUM7QUFBQSxZQUNsQyxhQUFhO0FBQUEsVUFDZixDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQTtBQUFBO0FBQUEsSUFHRCxLQUFLO0FBQUEsTUFDSCxnQkFBZ0I7QUFBQTtBQUFBLFFBRWQsUUFBUTtBQUFBLFVBQ04sUUFBUTtBQUFBLFFBQ1Y7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSCxFQUFFLE9BQU8sT0FBTztBQUFBLEVBRWhCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQTtBQUFBLElBRXRDO0FBQUEsSUFDQSxZQUFZLENBQUMsUUFBUSxPQUFPLFFBQVEsT0FBTyxRQUFRLE9BQU87QUFBQTtBQUFBLElBRTFELFlBQVksQ0FBQyxXQUFXLFVBQVUsZUFBZSxVQUFVLE1BQU07QUFBQSxFQUNuRTtBQUFBO0FBQUEsRUFHQSxVQUFVO0FBQUEsRUFDVixRQUFRO0FBQUE7QUFBQSxJQUVOLElBQUk7QUFBQSxNQUNGLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUFBLEVBRUEsY0FBYztBQUFBLElBQ1osZ0JBQWdCO0FBQUE7QUFBQSxNQUVkLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxNQUNWO0FBQUE7QUFBQSxNQUVBLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFJQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsRUFDZDtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ1AsYUFBYSxFQUFFLDRCQUE0QixTQUFTO0FBQUEsRUFDdEQ7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogWyJwYXRoIl0KfQo=
