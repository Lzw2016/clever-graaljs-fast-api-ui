import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { renderRoutes } from "react-router-config";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import routes from "@/routes";
import { loader } from "@monaco-editor/react";
import { initMonaco, registerTheme } from "@/utils/editor-utils";
import "normalize.css/normalize.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "react-reflex/styles.css";
import "simplebar/dist/simplebar.min.css";
import "@/assets/globalStyle.less";
import { loadAllData } from "@/utils/storage";

// 取消默认的浏览器自带右键
window.oncontextmenu = e => e.preventDefault();
// 禁用浏览器快捷键
document.addEventListener("keydown", e => {
  let preventDefault = false;
  // 判断 Ctrl + S
  if (e.ctrlKey && e.key.toUpperCase() === "S") preventDefault = true;
  // 警用浏览器默认行为
  if (preventDefault) e.preventDefault();
});

// 初始化 dayjs
dayjs.locale("zh-cn");
loader.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.27.0/min/vs" },
  "vs/nls": { availableLanguages: { "*": "zh-cn" } },
});

// 初始化 monaco
loader.init().then(monaco => {
  registerTheme(monaco);
  initMonaco(monaco).finally();
});

// 加载组件状态
loadAllData().finally(() => {
  ReactDOM.render(
    (
      <BrowserRouter>
        {renderRoutes(routes)}
      </BrowserRouter>
    ),
    document.getElementById("root")
  )
});
