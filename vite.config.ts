import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import vitePluginImp from "vite-plugin-imp";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { minifyHtml } from "vite-plugin-html";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";

const path = require("path");

// https://vitejs.dev/config/
export default defineConfig({
  // base: "https://cdn-static-resources.oss-cn-hangzhou.aliyuncs.com/clever-graaljs-fast-api-ui/1.0.0-beta3/",
  base: "/",
  define: {
    // isProdEnv: NODE_ENV === "production",
    apiGlobalPrefix: JSON.stringify(""),
    "process.env": "{}",
  },
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
    vitePluginImp({
      libList: [
        // { libName: "antd", style: name => `antd/es/${name}/style/index.css` },
      ],
    }),
    reactRefresh(),
    minifyHtml(),
  ],
  publicDir: "public",
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./"),
      "@": path.resolve(__dirname, "./src/"),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          // "white": "#3C3F41",
          // "primary-color": "#3C3F41",
        },
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
      "/fast_api": {
        target: "http://127.0.0.1:18081",
        changeOrigin: true,
        // rewrite: path => path,
      },
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
    rollupOptions: {
      external: [],
      output: {},
      plugins: [
        resolve(),
        commonjs(),
      ],
    },
    commonjsOptions: {},
  },
});
