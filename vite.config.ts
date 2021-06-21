import path from "path";
import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import vitePluginImp from "vite-plugin-imp";
import reactRefresh from "@vitejs/plugin-react-refresh";
// import { minifyHtml } from "vite-plugin-html";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  define: {},
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
    vitePluginImp({
      libList: [
        {
          libName: "antd",
          style: name => `antd/es/${name}/style/index.css`,
        },
      ],
    }),
    reactRefresh(),
    // minifyHtml(),
  ],
  publicDir: "public",
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {}
      }
    },
    modules: {
      localsConvention: "camelCaseOnly"
    }
  },
  clearScreen: true,
  server: {
    host: "0.0.0.0",
    port: 8000,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:18081",
        changeOrigin: true,
        // rewrite: path => path,
      },
    },
    force: true,
  },
  build: {
    target: "modules",
    polyfillDynamicImport: false,
    outDir: "dist",
    assetsDir: "assets",
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    rollupOptions: {},
    commonjsOptions: {}
  },
});
