// vite.config.ts
import { defineConfig } from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/vite/dist/node/index.js";
import react from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/@vitejs/plugin-react/dist/index.mjs";
import svgr from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/vite-plugin-svgr/dist/index.js";
import { nodePolyfills } from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/vite-plugin-node-polyfills/dist/index.js";
import commonjs from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/@rollup/plugin-commonjs/dist/es/index.js";
import { fileURLToPath } from "url";
import { visualizer } from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_import_meta_url = "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/vite.config.ts";
var vite_config_default = defineConfig(({ mode }) => ({
  // Enable detailed logging
  logLevel: "info",
  // Improve error messages
  clearScreen: false,
  // Set the base URL for the app
  base: "/",
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    hmr: {
      protocol: "ws",
      host: "localhost"
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    exclude: [
      "vite-plugin-node-polyfills",
      "vite-plugin-node-polyfills/shims",
      "vite-plugin-node-polyfills/shims/process",
      "vite-plugin-node-polyfills/shims/buffer",
      "vite-plugin-node-polyfills/shims/global"
    ],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis"
      },
      // Enable esbuild polyfill for Node.js globals and built-ins
      target: "es2020"
    }
  },
  // Enable source maps for better debugging
  build: {
    sourcemap: true,
    minify: mode === "production" ? "esbuild" : false,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
      exclude: []
    },
    rollupOptions: {
      // Ensure proper handling of CommonJS modules
      external: ["@babel/runtime/helpers/interopRequireDefault", "@babel/runtime/helpers/typeof"],
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
      include: [
        "path",
        "stream",
        "util",
        "buffer",
        "crypto",
        "process",
        "os",
        "url",
        "assert",
        "events",
        "querystring",
        "stream",
        "timers",
        "tty"
      ],
      globals: {
        process: true,
        Buffer: true,
        global: true
      },
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Fix for Vite 4+
      exclude: []
    }),
    // Visualize bundle size
    visualizer({
      filename: "./dist/stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxwZXJhbGF0YW4tbXd0LWRpdmlzaS1pbmZyYXN0cnVrdHVyXFxcXHBlcmFsYXRhbi1td3QtZGl2aXNpLWluZnJhc3RydWt0dXItYWY1ZDkzYWNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXHBlcmFsYXRhbi1td3QtZGl2aXNpLWluZnJhc3RydWt0dXJcXFxccGVyYWxhdGFuLW13dC1kaXZpc2ktaW5mcmFzdHJ1a3R1ci1hZjVkOTNhY1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovcGVyYWxhdGFuLW13dC1kaXZpc2ktaW5mcmFzdHJ1a3R1ci9wZXJhbGF0YW4tbXd0LWRpdmlzaS1pbmZyYXN0cnVrdHVyLWFmNWQ5M2FjL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgc3ZnciBmcm9tICd2aXRlLXBsdWdpbi1zdmdyJztcbmltcG9ydCB7IG5vZGVQb2x5ZmlsbHMgfSBmcm9tICd2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxscyc7XG5pbXBvcnQgY29tbW9uanMgZnJvbSAnQHJvbGx1cC9wbHVnaW4tY29tbW9uanMnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSAncm9sbHVwLXBsdWdpbi12aXN1YWxpemVyJztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIC8vIEVuYWJsZSBkZXRhaWxlZCBsb2dnaW5nXG4gIGxvZ0xldmVsOiAnaW5mbycsXG4gIC8vIEltcHJvdmUgZXJyb3IgbWVzc2FnZXNcbiAgY2xlYXJTY3JlZW46IGZhbHNlLFxuICBcbiAgLy8gU2V0IHRoZSBiYXNlIFVSTCBmb3IgdGhlIGFwcFxuICBiYXNlOiAnLycsXG4gIFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgaG9zdDogdHJ1ZSxcbiAgICBobXI6IHtcbiAgICAgIHByb3RvY29sOiAnd3MnLFxuICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgfSxcbiAgfSxcbiAgXG4gIC8vIE9wdGltaXplIGRlcGVuZGVuY2llc1xuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbXG4gICAgICAndml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMnLFxuICAgICAgJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3NoaW1zJyxcbiAgICAgICd2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9zaGltcy9wcm9jZXNzJyxcbiAgICAgICd2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9zaGltcy9idWZmZXInLFxuICAgICAgJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3NoaW1zL2dsb2JhbCdcbiAgICBdLFxuICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICAvLyBOb2RlLmpzIGdsb2JhbCB0byBicm93c2VyIGdsb2JhbFRoaXNcbiAgICAgIGRlZmluZToge1xuICAgICAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcbiAgICAgIH0sXG4gICAgICAvLyBFbmFibGUgZXNidWlsZCBwb2x5ZmlsbCBmb3IgTm9kZS5qcyBnbG9iYWxzIGFuZCBidWlsdC1pbnNcbiAgICAgIHRhcmdldDogJ2VzMjAyMCcsXG4gICAgfSxcbiAgfSxcbiAgXG4gIC8vIEVuYWJsZSBzb3VyY2UgbWFwcyBmb3IgYmV0dGVyIGRlYnVnZ2luZ1xuICBidWlsZDoge1xuICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICBtaW5pZnk6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyA/ICdlc2J1aWxkJyA6IGZhbHNlLFxuICAgIGNvbW1vbmpzT3B0aW9uczoge1xuICAgICAgdHJhbnNmb3JtTWl4ZWRFc01vZHVsZXM6IHRydWUsXG4gICAgICBpbmNsdWRlOiBbL25vZGVfbW9kdWxlcy9dLFxuICAgICAgZXhjbHVkZTogW10sXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAvLyBFbnN1cmUgcHJvcGVyIGhhbmRsaW5nIG9mIENvbW1vbkpTIG1vZHVsZXNcbiAgICAgIGV4dGVybmFsOiBbJ0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvaW50ZXJvcFJlcXVpcmVEZWZhdWx0JywgJ0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvdHlwZW9mJ10sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB1bmRlZmluZWQsXG4gICAgICAgIGlubGluZUR5bmFtaWNJbXBvcnRzOiB0cnVlLFxuICAgICAgICAvLyBFbnN1cmUgcHJvcGVyIGhhbmRsaW5nIG9mIGdsb2JhbCB2YXJpYWJsZXNcbiAgICAgICAgZ2xvYmFsczoge1xuICAgICAgICAgIHJlYWN0OiAnUmVhY3QnLFxuICAgICAgICAgICdyZWFjdC1kb20nOiAnUmVhY3RET00nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG9ud2Fybih3YXJuaW5nLCB3YXJuKSB7XG4gICAgICAgIC8vIElnbm9yZSBjZXJ0YWluIHdhcm5pbmdzXG4gICAgICAgIGlmICh3YXJuaW5nLmNvZGUgPT09ICdFVkFMJykgcmV0dXJuO1xuICAgICAgICBpZiAod2FybmluZy5jb2RlID09PSAnTU9EVUxFX0xFVkVMX0RJUkVDVElWRScpIHJldHVybjtcbiAgICAgICAgd2Fybih3YXJuaW5nKTtcbiAgICAgIH0sXG4gICAgfVxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgLy8gQWRkIE5vZGUuanMgcG9seWZpbGxzXG4gICAgbm9kZVBvbHlmaWxscyh7XG4gICAgICAvLyBUbyBhZGQgb25seSBzcGVjaWZpYyBwb2x5ZmlsbHMsIGFkZCB0aGVtIGhlcmUuIElmIG5vIG9wdGlvbiBpcyBwYXNzZWQsIGFkZHMgYWxsIHBvbHlmaWxsc1xuICAgICAgaW5jbHVkZTogW1xuICAgICAgICAncGF0aCcsXG4gICAgICAgICdzdHJlYW0nLFxuICAgICAgICAndXRpbCcsXG4gICAgICAgICdidWZmZXInLFxuICAgICAgICAnY3J5cHRvJyxcbiAgICAgICAgJ3Byb2Nlc3MnLFxuICAgICAgICAnb3MnLFxuICAgICAgICAndXJsJyxcbiAgICAgICAgJ2Fzc2VydCcsXG4gICAgICAgICdldmVudHMnLFxuICAgICAgICAncXVlcnlzdHJpbmcnLFxuICAgICAgICAnc3RyZWFtJyxcbiAgICAgICAgJ3RpbWVycycsXG4gICAgICAgICd0dHknXG4gICAgICBdLFxuICAgICAgZ2xvYmFsczoge1xuICAgICAgICBwcm9jZXNzOiB0cnVlLFxuICAgICAgICBCdWZmZXI6IHRydWUsXG4gICAgICAgIGdsb2JhbDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICAvLyBXaGV0aGVyIHRvIHBvbHlmaWxsIGBub2RlOmAgcHJvdG9jb2wgaW1wb3J0cy5cbiAgICAgIHByb3RvY29sSW1wb3J0czogdHJ1ZSxcbiAgICAgIC8vIEZpeCBmb3IgVml0ZSA0K1xuICAgICAgZXhjbHVkZTogW11cbiAgICB9KSxcbiAgICBcbiAgICAvLyBWaXN1YWxpemUgYnVuZGxlIHNpemVcbiAgICB2aXN1YWxpemVyKHtcbiAgICAgIGZpbGVuYW1lOiAnLi9kaXN0L3N0YXRzLmh0bWwnLFxuICAgICAgb3BlbjogdHJ1ZSxcbiAgICAgIGd6aXBTaXplOiB0cnVlLFxuICAgICAgYnJvdGxpU2l6ZTogdHJ1ZSxcbiAgICB9KSxcbiAgICBcbiAgICAvLyBFbnN1cmUgcHJvcGVyIFR5cGVTY3JpcHQgaGFuZGxpbmdcbiAgICB7XG4gICAgICBuYW1lOiAndHlwZXNjcmlwdC1pbXBvcnRzJyxcbiAgICAgIHJlc29sdmVJZChzb3VyY2U6IHN0cmluZykge1xuICAgICAgICBpZiAoc291cmNlLmVuZHNXaXRoKCcudHN4JykgfHwgc291cmNlLmVuZHNXaXRoKCcudHMnKSkge1xuICAgICAgICAgIHJldHVybiB7IGlkOiBzb3VyY2UsIGV4dGVybmFsOiBmYWxzZSB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSxcbiAgICB9LFxuICAgIFxuICAgIC8vIENvbnZlcnQgQ29tbW9uSlMgbW9kdWxlcyB0byBFUyBtb2R1bGVzXG4gICAgY29tbW9uanMoe1xuICAgICAgaW5jbHVkZTogL25vZGVfbW9kdWxlcy8sXG4gICAgfSksXG4gICAgXG4gICAgLy8gUmVhY3QgcGx1Z2luIHdpdGggSlNYIHJ1bnRpbWVcbiAgICByZWFjdCh7XG4gICAgICBqc3hJbXBvcnRTb3VyY2U6ICdAZW1vdGlvbi9yZWFjdCcsXG4gICAgICBiYWJlbDoge1xuICAgICAgICBwcmVzZXRzOiBbXG4gICAgICAgICAgJ0BiYWJlbC9wcmVzZXQtZW52JyxcbiAgICAgICAgICBbJ0BiYWJlbC9wcmVzZXQtcmVhY3QnLCB7IFxuICAgICAgICAgICAgcnVudGltZTogJ2F1dG9tYXRpYycsXG4gICAgICAgICAgICBpbXBvcnRTb3VyY2U6ICdAZW1vdGlvbi9yZWFjdCcsXG4gICAgICAgICAgfV0sXG4gICAgICAgICAgJ0BiYWJlbC9wcmVzZXQtdHlwZXNjcmlwdCcsXG4gICAgICAgIF0sXG4gICAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgICAnQGVtb3Rpb24vYmFiZWwtcGx1Z2luJyxcbiAgICAgICAgICBbJ0BiYWJlbC9wbHVnaW4tdHJhbnNmb3JtLXJ1bnRpbWUnLCB7XG4gICAgICAgICAgICByZWdlbmVyYXRvcjogdHJ1ZSxcbiAgICAgICAgICB9XSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgLy8gVGVtcG9yYXJpbHkgZGlzYWJsZWQgbG92YWJsZS10YWdnZXJcbiAgICAvLyBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmIGNvbXBvbmVudFRhZ2dlcigpLFxuICAgIHN2Z3Ioe1xuICAgICAgZXNidWlsZE9wdGlvbnM6IHtcbiAgICAgICAgLy8gRW5hYmxlIGVzYnVpbGQgcG9seWZpbGwgZm9yIE5vZGUuanMgZ2xvYmFscyBhbmQgYnVpbHQtaW5zXG4gICAgICAgIGRlZmluZToge1xuICAgICAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KVxuICBdLmZpbHRlcihCb29sZWFuKSxcbiAgXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgfSxcbiAgICBleHRlbnNpb25zOiBbJy50c3gnLCAnLnRzJywgJy5qc3gnLCAnLmpzJywgJy5tanMnLCAnLmpzb24nXSxcbiAgICAvLyBFbnN1cmUgcHJvcGVyIG1vZHVsZSByZXNvbHV0aW9uXG4gICAgbWFpbkZpZWxkczogWydicm93c2VyJywgJ21vZHVsZScsICdqc25leHQ6bWFpbicsICdqc25leHQnLCAnbWFpbiddLFxuICB9LFxuICBkZWZpbmU6IHtcbiAgICAncHJvY2Vzcy5lbnYnOiB7fSxcbiAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcbiAgfSxcbiAgXG4gIC8vIENhY2hlIGNvbmZpZ3VyYXRpb25cbiAgY2FjaGVEaXI6ICdub2RlX21vZHVsZXMvLnZpdGUnLFxuICBcbiAgLy8gU2VydmVyIGNvbmZpZ3VyYXRpb24gbW92ZWQgdG8gdGhlIHRvcFxuICBcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDgwODAsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgfSxcbiAgXG4gIGVzYnVpbGQ6IHtcbiAgICBsb2dPdmVycmlkZTogeyAndGhpcy1pcy11bmRlZmluZWQtaW4tZXNtJzog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
