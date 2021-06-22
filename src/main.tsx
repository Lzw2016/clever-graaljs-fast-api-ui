import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { renderRoutes } from "react-router-config";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { ConfigProvider } from "antd";
import antdZhCN from "antd/lib/locale/zh_CN";
// import "antd/dist/antd.compact.min.css";
import { ConfigProviderProps } from "antd/es/config-provider";
import routes from "@/routes";
import { loader } from "@monaco-editor/react";
import { initMonaco, registerTheme } from "@/utils/editor-utils";
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

const antdConfig: ConfigProviderProps = {
  componentSize: "small",
  locale: antdZhCN,
};

ReactDOM.render(
  <ConfigProvider {...antdConfig}>
    <BrowserRouter>{renderRoutes(routes)}</BrowserRouter>
  </ConfigProvider>,
  document.getElementById("root")
);
