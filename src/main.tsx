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
import "react-reflex/styles.css";
import "simplebar/dist/simplebar.min.css";
import "@/assets/global.less";

dayjs.locale("zh-cn");
loader.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.25.2/min/vs" },
  "vs/nls": { availableLanguages: { "*": "zh-cn" } },
});
loader.init().then(monaco => {
  registerTheme(monaco);
  initMonaco(monaco);
});


ReactDOM.render(
  (
    <BrowserRouter>
      {renderRoutes(routes)}
    </BrowserRouter>
  ),
  document.getElementById("root")
);
