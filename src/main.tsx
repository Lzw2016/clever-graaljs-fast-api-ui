import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { renderRoutes } from "react-router-config";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { ConfigProvider } from "antd";
import antdZhCN from "antd/lib/locale/zh_CN";
import "antd/dist/antd.compact.min.css";
import { ConfigProviderProps } from "antd/es/config-provider";
import routes from "@/routes";
import "./assets/index.css";

dayjs.locale("zh-cn");
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
