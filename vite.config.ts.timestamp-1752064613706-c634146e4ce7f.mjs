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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxwZXJhbGF0YW4tbXd0LWRpdmlzaS1pbmZyYXN0cnVrdHVyXFxcXHBlcmFsYXRhbi1td3QtZGl2aXNpLWluZnJhc3RydWt0dXItYWY1ZDkzYWNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXHBlcmFsYXRhbi1td3QtZGl2aXNpLWluZnJhc3RydWt0dXJcXFxccGVyYWxhdGFuLW13dC1kaXZpc2ktaW5mcmFzdHJ1a3R1ci1hZjVkOTNhY1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovcGVyYWxhdGFuLW13dC1kaXZpc2ktaW5mcmFzdHJ1a3R1ci9wZXJhbGF0YW4tbXd0LWRpdmlzaS1pbmZyYXN0cnVrdHVyLWFmNWQ5M2FjL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG4vLyBUZW1wb3JhcmlseSBkaXNhYmxlIGxvdmFibGUtdGFnZ2VyIGFzIGl0J3MgY2F1c2luZyBpc3N1ZXNcbi8vIGltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gJ2xvdmFibGUtdGFnZ2VyJztcbmltcG9ydCBzdmdyIGZyb20gJ3ZpdGUtcGx1Z2luLXN2Z3InO1xuaW1wb3J0IHsgbm9kZVBvbHlmaWxscyB9IGZyb20gJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzJztcbmltcG9ydCBjb21tb25qcyBmcm9tICdAcm9sbHVwL3BsdWdpbi1jb21tb25qcyc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICAvLyBFbmFibGUgZGV0YWlsZWQgbG9nZ2luZ1xuICBsb2dMZXZlbDogJ2luZm8nLFxuICAvLyBJbXByb3ZlIGVycm9yIG1lc3NhZ2VzXG4gIGNsZWFyU2NyZWVuOiBmYWxzZSxcbiAgXG4gIC8vIFNldCB0aGUgYmFzZSBVUkwgZm9yIHRoZSBhcHBcbiAgYmFzZTogJy8nLFxuICBcbiAgLy8gU2VydmVyIGNvbmZpZ3VyYXRpb24gaXMgZGVmaW5lZCBiZWxvd1xuICAvLyBFbmFibGUgc291cmNlIG1hcHMgZm9yIGJldHRlciBkZWJ1Z2dpbmdcbiAgYnVpbGQ6IHtcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgbWluaWZ5OiBtb2RlID09PSAncHJvZHVjdGlvbicgPyAnZXNidWlsZCcgOiBmYWxzZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAvLyBFbnN1cmUgcHJvcGVyIGhhbmRsaW5nIG9mIENvbW1vbkpTIG1vZHVsZXNcbiAgICAgIGV4dGVybmFsOiBbXSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHVuZGVmaW5lZCxcbiAgICAgICAgaW5saW5lRHluYW1pY0ltcG9ydHM6IHRydWUsXG4gICAgICAgIC8vIEVuc3VyZSBwcm9wZXIgaGFuZGxpbmcgb2YgZ2xvYmFsIHZhcmlhYmxlc1xuICAgICAgICBnbG9iYWxzOiB7XG4gICAgICAgICAgcmVhY3Q6ICdSZWFjdCcsXG4gICAgICAgICAgJ3JlYWN0LWRvbSc6ICdSZWFjdERPTScsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgb253YXJuKHdhcm5pbmcsIHdhcm4pIHtcbiAgICAgICAgLy8gSWdub3JlIGNlcnRhaW4gd2FybmluZ3NcbiAgICAgICAgaWYgKHdhcm5pbmcuY29kZSA9PT0gJ0VWQUwnKSByZXR1cm47XG4gICAgICAgIGlmICh3YXJuaW5nLmNvZGUgPT09ICdNT0RVTEVfTEVWRUxfRElSRUNUSVZFJykgcmV0dXJuO1xuICAgICAgICB3YXJuKHdhcm5pbmcpO1xuICAgICAgfSxcbiAgICB9XG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICAvLyBBZGQgTm9kZS5qcyBwb2x5ZmlsbHNcbiAgICBub2RlUG9seWZpbGxzKHtcbiAgICAgIC8vIFRvIGFkZCBvbmx5IHNwZWNpZmljIHBvbHlmaWxscywgYWRkIHRoZW0gaGVyZS4gSWYgbm8gb3B0aW9uIGlzIHBhc3NlZCwgYWRkcyBhbGwgcG9seWZpbGxzXG4gICAgICBpbmNsdWRlOiBbJ3BhdGgnLCAnc3RyZWFtJywgJ3V0aWwnLCAnYnVmZmVyJywgJ2NyeXB0bycsICdwcm9jZXNzJ10sXG4gICAgICAvLyBXaGV0aGVyIHRvIHBvbHlmaWxsIGBub2RlOmAgcHJvdG9jb2wgaW1wb3J0cy5cbiAgICAgIHByb3RvY29sSW1wb3J0czogdHJ1ZSxcbiAgICB9KSxcbiAgICBcbiAgICAvLyBFbnN1cmUgcHJvcGVyIFR5cGVTY3JpcHQgaGFuZGxpbmdcbiAgICB7XG4gICAgICBuYW1lOiAndHlwZXNjcmlwdC1pbXBvcnRzJyxcbiAgICAgIHJlc29sdmVJZChzb3VyY2UpIHtcbiAgICAgICAgaWYgKHNvdXJjZS5lbmRzV2l0aCgnLnRzeCcpIHx8IHNvdXJjZS5lbmRzV2l0aCgnLnRzJykpIHtcbiAgICAgICAgICByZXR1cm4geyBpZDogc291cmNlLCBleHRlcm5hbDogZmFsc2UgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0sXG4gICAgfSxcbiAgICBcbiAgICAvLyBDb252ZXJ0IENvbW1vbkpTIG1vZHVsZXMgdG8gRVMgbW9kdWxlc1xuICAgIGNvbW1vbmpzKHtcbiAgICAgIGluY2x1ZGU6IC9ub2RlX21vZHVsZXMvLFxuICAgIH0pLFxuICAgIFxuICAgIC8vIFJlYWN0IHBsdWdpbiB3aXRoIEpTWCBydW50aW1lXG4gICAgcmVhY3Qoe1xuICAgICAganN4SW1wb3J0U291cmNlOiAnQGVtb3Rpb24vcmVhY3QnLFxuICAgICAgYmFiZWw6IHtcbiAgICAgICAgcHJlc2V0czogW1xuICAgICAgICAgICdAYmFiZWwvcHJlc2V0LWVudicsXG4gICAgICAgICAgWydAYmFiZWwvcHJlc2V0LXJlYWN0JywgeyBcbiAgICAgICAgICAgIHJ1bnRpbWU6ICdhdXRvbWF0aWMnLFxuICAgICAgICAgICAgaW1wb3J0U291cmNlOiAnQGVtb3Rpb24vcmVhY3QnLFxuICAgICAgICAgIH1dLFxuICAgICAgICAgICdAYmFiZWwvcHJlc2V0LXR5cGVzY3JpcHQnLFxuICAgICAgICBdLFxuICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgJ0BlbW90aW9uL2JhYmVsLXBsdWdpbicsXG4gICAgICAgICAgWydAYmFiZWwvcGx1Z2luLXRyYW5zZm9ybS1ydW50aW1lJywge1xuICAgICAgICAgICAgcmVnZW5lcmF0b3I6IHRydWUsXG4gICAgICAgICAgfV0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgIH0pLFxuICAgIC8vIFRlbXBvcmFyaWx5IGRpc2FibGVkIGxvdmFibGUtdGFnZ2VyXG4gICAgLy8gbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJiBjb21wb25lbnRUYWdnZXIoKSxcbiAgICBzdmdyKHtcbiAgICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICAgIC8vIEVuYWJsZSBlc2J1aWxkIHBvbHlmaWxsIGZvciBOb2RlLmpzIGdsb2JhbHMgYW5kIGJ1aWx0LWluc1xuICAgICAgICBkZWZpbmU6IHtcbiAgICAgICAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSlcbiAgXS5maWx0ZXIoQm9vbGVhbiksXG4gIFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgICAvLyBBZGQgbW9yZSBhbGlhc2VzIGlmIG5lZWRlZFxuICAgIH0sXG4gICAgZXh0ZW5zaW9uczogWycudHN4JywgJy50cycsICcuanN4JywgJy5qcycsICcubWpzJywgJy5qc29uJ10sXG4gICAgLy8gRW5zdXJlIHByb3BlciBtb2R1bGUgcmVzb2x1dGlvblxuICAgIG1haW5GaWVsZHM6IFsnYnJvd3NlcicsICdtb2R1bGUnLCAnanNuZXh0Om1haW4nLCAnanNuZXh0JywgJ21haW4nXSxcbiAgfSxcbiAgXG4gIC8vIERpc2FibGUgY2FjaGluZyBkdXJpbmcgZGV2ZWxvcG1lbnRcbiAgY2FjaGVEaXI6ICdub2RlX21vZHVsZXMvLnZpdGUnLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgb3BlbjogdHJ1ZSxcbiAgICBjb3JzOiB0cnVlLFxuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJycpLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgICcvc3VwYWJhc2UnOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHBzOi8vbWRsYW16ZXd1Y3p0bnhxbmF5cXMuc3VwYWJhc2UuY28nLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9zdXBhYmFzZS8sICcnKSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgIH1cbiAgICB9LFxuICAgIGZzOiB7XG4gICAgICBzdHJpY3Q6IHRydWUsXG4gICAgfSxcbiAgfSxcbiAgXG4gIG9wdGltaXplRGVwczoge1xuICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICAvLyBOb2RlLmpzIGdsb2JhbCB0byBicm93c2VyIGdsb2JhbFRoaXNcbiAgICAgIGRlZmluZToge1xuICAgICAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcbiAgICAgIH0sXG4gICAgICAvLyBFbmFibGUgZXNidWlsZCBwb2x5ZmlsbCBmb3IgTm9kZS5qcyBnbG9iYWxzIGFuZCBidWlsdC1pbnNcbiAgICAgIHRhcmdldDogJ2VzMjAyMCcsXG4gICAgfSxcbiAgfSxcbiAgXG4gIC8vIFNlcnZlciBjb25maWd1cmF0aW9uIG1vdmVkIHRvIHRoZSB0b3BcbiAgXG4gIHByZXZpZXc6IHtcbiAgICBwb3J0OiA4MDgwLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gIH0sXG4gIFxuICBlc2J1aWxkOiB7XG4gICAgbG9nT3ZlcnJpZGU6IHsgJ3RoaXMtaXMtdW5kZWZpbmVkLWluLWVzbSc6ICdzaWxlbnQnIH0sXG4gIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTJhLFNBQVMsb0JBQW9CO0FBQ3hjLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFHakIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMscUJBQXFCO0FBQzlCLE9BQU8sY0FBYztBQVByQixJQUFNLG1DQUFtQztBQVV6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBO0FBQUEsRUFFekMsVUFBVTtBQUFBO0FBQUEsRUFFVixhQUFhO0FBQUE7QUFBQSxFQUdiLE1BQU07QUFBQTtBQUFBO0FBQUEsRUFJTixPQUFPO0FBQUEsSUFDTCxXQUFXO0FBQUEsSUFDWCxRQUFRLFNBQVMsZUFBZSxZQUFZO0FBQUEsSUFDNUMsZUFBZTtBQUFBO0FBQUEsTUFFYixVQUFVLENBQUM7QUFBQSxNQUNYLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxRQUNkLHNCQUFzQjtBQUFBO0FBQUEsUUFFdEIsU0FBUztBQUFBLFVBQ1AsT0FBTztBQUFBLFVBQ1AsYUFBYTtBQUFBLFFBQ2Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxPQUFPLFNBQVMsTUFBTTtBQUVwQixZQUFJLFFBQVEsU0FBUyxPQUFRO0FBQzdCLFlBQUksUUFBUSxTQUFTLHlCQUEwQjtBQUMvQyxhQUFLLE9BQU87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
