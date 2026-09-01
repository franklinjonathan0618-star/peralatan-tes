// vite.config.ts
import { defineConfig } from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/vite/dist/node/index.js";
import react from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/@vitejs/plugin-react-swc/index.mjs";
import svgr from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/vite-plugin-svgr/dist/index.js";
import { nodePolyfills } from "file:///E:/peralatan-mwt-divisi-infrastruktur/peralatan-mwt-divisi-infrastruktur-af5d93ac/node_modules/vite-plugin-node-polyfills/dist/index.js";
import { fileURLToPath } from "url";
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
    // Force ES modules output
    target: "es2020",
    // Ensure all code is transpiled to ES2020
    modulePreload: {
      polyfill: true
    },
    rollupOptions: {
      // Ensure proper handling of CommonJS modules
      external: [],
      output: {
        // Force ES modules output
        format: "es",
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
    // Bundle size visualization is temporarily disabled
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
    // No need for commonjs plugin with SWC
    // React SWC plugin with JSX runtime
    react({
      jsxImportSource: "@emotion/react",
      // Use SWC for faster builds and better module handling
      tsDecorators: true,
      // Configure SWC options
      plugins: [
        // Add any SWC plugins if needed
      ]
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
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url)),
      // Add aliases for commonjs modules
      "@babel/runtime/helpers/interopRequireDefault": "@babel/runtime/helpers/esm/interopRequireDefault",
      "@babel/runtime/helpers/typeof": "@babel/runtime/helpers/esm/typeof"
    },
    extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
    // Ensure proper module resolution
    mainFields: ["browser", "module", "jsnext:main", "jsnext", "main"]
  },
  define: {
    "process.env": {},
    "process.versions.node": JSON.stringify(process.versions.node || "18.0.0"),
    global: "globalThis",
    "globalThis.process.env.NODE_ENV": JSON.stringify(mode)
  },
  ssr: {
    // Force ESM for SSR
    format: "esm",
    // No external deps in SSR
    noExternal: true
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxwZXJhbGF0YW4tbXd0LWRpdmlzaS1pbmZyYXN0cnVrdHVyXFxcXHBlcmFsYXRhbi1td3QtZGl2aXNpLWluZnJhc3RydWt0dXItYWY1ZDkzYWNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXHBlcmFsYXRhbi1td3QtZGl2aXNpLWluZnJhc3RydWt0dXJcXFxccGVyYWxhdGFuLW13dC1kaXZpc2ktaW5mcmFzdHJ1a3R1ci1hZjVkOTNhY1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovcGVyYWxhdGFuLW13dC1kaXZpc2ktaW5mcmFzdHJ1a3R1ci9wZXJhbGF0YW4tbXd0LWRpdmlzaS1pbmZyYXN0cnVrdHVyLWFmNWQ5M2FjL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHN2Z3IgZnJvbSAndml0ZS1wbHVnaW4tc3Zncic7XG5pbXBvcnQgeyBub2RlUG9seWZpbGxzIH0gZnJvbSAndml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICAvLyBFbmFibGUgZGV0YWlsZWQgbG9nZ2luZ1xuICBsb2dMZXZlbDogJ2luZm8nLFxuICAvLyBJbXByb3ZlIGVycm9yIG1lc3NhZ2VzXG4gIGNsZWFyU2NyZWVuOiBmYWxzZSxcbiAgXG4gIC8vIFNldCB0aGUgYmFzZSBVUkwgZm9yIHRoZSBhcHBcbiAgYmFzZTogJy8nLFxuICBcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3MyxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgaG1yOiB7XG4gICAgICBwcm90b2NvbDogJ3dzJyxcbiAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgIH0sXG4gIH0sXG4gIFxuICAvLyBPcHRpbWl6ZSBkZXBlbmRlbmNpZXNcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogW1xuICAgICAgJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzJyxcbiAgICAgICd2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9zaGltcycsXG4gICAgICAndml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvc2hpbXMvcHJvY2VzcycsXG4gICAgICAndml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvc2hpbXMvYnVmZmVyJyxcbiAgICAgICd2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9zaGltcy9nbG9iYWwnXG4gICAgXSxcbiAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgLy8gTm9kZS5qcyBnbG9iYWwgdG8gYnJvd3NlciBnbG9iYWxUaGlzXG4gICAgICBkZWZpbmU6IHtcbiAgICAgICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcycsXG4gICAgICB9LFxuICAgICAgLy8gRW5hYmxlIGVzYnVpbGQgcG9seWZpbGwgZm9yIE5vZGUuanMgZ2xvYmFscyBhbmQgYnVpbHQtaW5zXG4gICAgICB0YXJnZXQ6ICdlczIwMjAnLFxuICAgIH0sXG4gIH0sXG4gIFxuICAvLyBFbmFibGUgc291cmNlIG1hcHMgZm9yIGJldHRlciBkZWJ1Z2dpbmdcbiAgYnVpbGQ6IHtcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgbWluaWZ5OiBtb2RlID09PSAncHJvZHVjdGlvbicgPyAnZXNidWlsZCcgOiBmYWxzZSxcbiAgICAvLyBGb3JjZSBFUyBtb2R1bGVzIG91dHB1dFxuICAgIHRhcmdldDogJ2VzMjAyMCcsXG4gICAgLy8gRW5zdXJlIGFsbCBjb2RlIGlzIHRyYW5zcGlsZWQgdG8gRVMyMDIwXG4gICAgbW9kdWxlUHJlbG9hZDoge1xuICAgICAgcG9seWZpbGw6IHRydWVcbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIC8vIEVuc3VyZSBwcm9wZXIgaGFuZGxpbmcgb2YgQ29tbW9uSlMgbW9kdWxlc1xuICAgICAgZXh0ZXJuYWw6IFtdLFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIC8vIEZvcmNlIEVTIG1vZHVsZXMgb3V0cHV0XG4gICAgICAgIGZvcm1hdDogJ2VzJyxcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB1bmRlZmluZWQsXG4gICAgICAgIGlubGluZUR5bmFtaWNJbXBvcnRzOiB0cnVlLFxuICAgICAgICAvLyBFbnN1cmUgcHJvcGVyIGhhbmRsaW5nIG9mIGdsb2JhbCB2YXJpYWJsZXNcbiAgICAgICAgZ2xvYmFsczoge1xuICAgICAgICAgIHJlYWN0OiAnUmVhY3QnLFxuICAgICAgICAgICdyZWFjdC1kb20nOiAnUmVhY3RET00nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG9ud2Fybih3YXJuaW5nLCB3YXJuKSB7XG4gICAgICAgIC8vIElnbm9yZSBjZXJ0YWluIHdhcm5pbmdzXG4gICAgICAgIGlmICh3YXJuaW5nLmNvZGUgPT09ICdFVkFMJykgcmV0dXJuO1xuICAgICAgICBpZiAod2FybmluZy5jb2RlID09PSAnTU9EVUxFX0xFVkVMX0RJUkVDVElWRScpIHJldHVybjtcbiAgICAgICAgd2Fybih3YXJuaW5nKTtcbiAgICAgIH0sXG4gICAgfVxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgLy8gQWRkIE5vZGUuanMgcG9seWZpbGxzXG4gICAgbm9kZVBvbHlmaWxscyh7XG4gICAgICAvLyBUbyBhZGQgb25seSBzcGVjaWZpYyBwb2x5ZmlsbHMsIGFkZCB0aGVtIGhlcmUuIElmIG5vIG9wdGlvbiBpcyBwYXNzZWQsIGFkZHMgYWxsIHBvbHlmaWxsc1xuICAgICAgaW5jbHVkZTogW1xuICAgICAgICAncGF0aCcsXG4gICAgICAgICdzdHJlYW0nLFxuICAgICAgICAndXRpbCcsXG4gICAgICAgICdidWZmZXInLFxuICAgICAgICAnY3J5cHRvJyxcbiAgICAgICAgJ3Byb2Nlc3MnLFxuICAgICAgICAnb3MnLFxuICAgICAgICAndXJsJyxcbiAgICAgICAgJ2Fzc2VydCcsXG4gICAgICAgICdldmVudHMnLFxuICAgICAgICAncXVlcnlzdHJpbmcnLFxuICAgICAgICAnc3RyZWFtJyxcbiAgICAgICAgJ3RpbWVycycsXG4gICAgICAgICd0dHknXG4gICAgICBdLFxuICAgICAgZ2xvYmFsczoge1xuICAgICAgICBwcm9jZXNzOiB0cnVlLFxuICAgICAgICBCdWZmZXI6IHRydWUsXG4gICAgICAgIGdsb2JhbDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICAvLyBXaGV0aGVyIHRvIHBvbHlmaWxsIGBub2RlOmAgcHJvdG9jb2wgaW1wb3J0cy5cbiAgICAgIHByb3RvY29sSW1wb3J0czogdHJ1ZSxcbiAgICAgIC8vIEZpeCBmb3IgVml0ZSA0K1xuICAgICAgZXhjbHVkZTogW11cbiAgICB9KSxcbiAgICBcbiAgICAvLyBCdW5kbGUgc2l6ZSB2aXN1YWxpemF0aW9uIGlzIHRlbXBvcmFyaWx5IGRpc2FibGVkXG4gICAgXG4gICAgLy8gRW5zdXJlIHByb3BlciBUeXBlU2NyaXB0IGhhbmRsaW5nXG4gICAge1xuICAgICAgbmFtZTogJ3R5cGVzY3JpcHQtaW1wb3J0cycsXG4gICAgICByZXNvbHZlSWQoc291cmNlOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHNvdXJjZS5lbmRzV2l0aCgnLnRzeCcpIHx8IHNvdXJjZS5lbmRzV2l0aCgnLnRzJykpIHtcbiAgICAgICAgICByZXR1cm4geyBpZDogc291cmNlLCBleHRlcm5hbDogZmFsc2UgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0sXG4gICAgfSxcbiAgICBcbiAgICAvLyBObyBuZWVkIGZvciBjb21tb25qcyBwbHVnaW4gd2l0aCBTV0NcbiAgICBcbiAgICAvLyBSZWFjdCBTV0MgcGx1Z2luIHdpdGggSlNYIHJ1bnRpbWVcbiAgICByZWFjdCh7XG4gICAgICBqc3hJbXBvcnRTb3VyY2U6ICdAZW1vdGlvbi9yZWFjdCcsXG4gICAgICAvLyBVc2UgU1dDIGZvciBmYXN0ZXIgYnVpbGRzIGFuZCBiZXR0ZXIgbW9kdWxlIGhhbmRsaW5nXG4gICAgICB0c0RlY29yYXRvcnM6IHRydWUsXG4gICAgICAvLyBDb25maWd1cmUgU1dDIG9wdGlvbnNcbiAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgLy8gQWRkIGFueSBTV0MgcGx1Z2lucyBpZiBuZWVkZWRcbiAgICAgIF0sXG4gICAgfSksXG4gICAgLy8gVGVtcG9yYXJpbHkgZGlzYWJsZWQgbG92YWJsZS10YWdnZXJcbiAgICAvLyBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmIGNvbXBvbmVudFRhZ2dlcigpLFxuICAgIHN2Z3Ioe1xuICAgICAgZXNidWlsZE9wdGlvbnM6IHtcbiAgICAgICAgLy8gRW5hYmxlIGVzYnVpbGQgcG9seWZpbGwgZm9yIE5vZGUuanMgZ2xvYmFscyBhbmQgYnVpbHQtaW5zXG4gICAgICAgIGRlZmluZToge1xuICAgICAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KVxuICBdLmZpbHRlcihCb29sZWFuKSxcbiAgXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAvLyBBZGQgYWxpYXNlcyBmb3IgY29tbW9uanMgbW9kdWxlc1xuICAgICAgJ0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvaW50ZXJvcFJlcXVpcmVEZWZhdWx0JzogJ0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL2ludGVyb3BSZXF1aXJlRGVmYXVsdCcsXG4gICAgICAnQGJhYmVsL3J1bnRpbWUvaGVscGVycy90eXBlb2YnOiAnQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vdHlwZW9mJyxcbiAgICB9LFxuICAgIGV4dGVuc2lvbnM6IFsnLnRzeCcsICcudHMnLCAnLmpzeCcsICcuanMnLCAnLm1qcycsICcuanNvbiddLFxuICAgIC8vIEVuc3VyZSBwcm9wZXIgbW9kdWxlIHJlc29sdXRpb25cbiAgICBtYWluRmllbGRzOiBbJ2Jyb3dzZXInLCAnbW9kdWxlJywgJ2pzbmV4dDptYWluJywgJ2pzbmV4dCcsICdtYWluJ10sXG4gIH0sXG4gIGRlZmluZToge1xuICAgICdwcm9jZXNzLmVudic6IHt9LFxuICAgICdwcm9jZXNzLnZlcnNpb25zLm5vZGUnOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLnZlcnNpb25zLm5vZGUgfHwgJzE4LjAuMCcpLFxuICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICAgICdnbG9iYWxUaGlzLnByb2Nlc3MuZW52Lk5PREVfRU5WJzogSlNPTi5zdHJpbmdpZnkobW9kZSksXG4gIH0sXG4gIHNzcjoge1xuICAgIC8vIEZvcmNlIEVTTSBmb3IgU1NSXG4gICAgZm9ybWF0OiAnZXNtJyxcbiAgICAvLyBObyBleHRlcm5hbCBkZXBzIGluIFNTUlxuICAgIG5vRXh0ZXJuYWw6IHRydWUsXG4gIH0sXG4gIFxuICAvLyBDYWNoZSBjb25maWd1cmF0aW9uXG4gIGNhY2hlRGlyOiAnbm9kZV9tb2R1bGVzLy52aXRlJyxcbiAgXG4gIC8vIFNlcnZlciBjb25maWd1cmF0aW9uIG1vdmVkIHRvIHRoZSB0b3BcbiAgXG4gIHByZXZpZXc6IHtcbiAgICBwb3J0OiA4MDgwLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gIH0sXG4gIFxuICBlc2J1aWxkOiB7XG4gICAgbG9nT3ZlcnJpZGU6IHsgJ3RoaXMtaXMtdW5kZWZpbmVkLWluLWVz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
