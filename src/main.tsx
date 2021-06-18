import React from 'react'
import ReactDOM from 'react-dom'
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { ConfigProvider } from "antd";
import antdZhCN from "antd/lib/locale/zh_CN";
import 'antd/dist/antd.compact.min.css';
import { ConfigProviderProps } from "antd/es/config-provider";
import './assets/index.css';
import App from './App3';

dayjs.locale("zh-cn");
const antdConfig: ConfigProviderProps = {
  componentSize: "small",
  locale: antdZhCN,
};

ReactDOM.render(
  <ConfigProvider {...antdConfig}>
    <App/>
  </ConfigProvider>,
  document.getElementById('root')
)
