import { RouteConfig } from "react-router-config";
import App from "@/App";
import App2 from "@/App2";
import App3 from "@/App3";
import App4 from "@/App4";

const routesConfig: RouteConfig[] = [
  { path: "/", exact: true, component: App4 },
  { path: "/app", exact: true, component: App },
  { path: "/app2", exact: true, component: App2 },
  { path: "/app3", exact: true, component: App3 },

  // // APP 路由
  // {
  //   path: '/hybird',
  //   exact: true,
  //   component: Layout,
  //   routes: [
  //     {
  //       path: '/',
  //       exact: false,
  //       component: loadable(() => import('@/pages/hybird'))
  //     }
  //   ]
  // },
  // // H5 相关路由
  // {
  //   path: '/h5',
  //   exact: false,
  //   component: H5Layout,
  //   routes: [
  //     {
  //       path: '/',
  //       exact: false,
  //       component: loadable(() => import('@/pages/h5'))
  //     }
  //   ]
  // }
];

export default routesConfig;
