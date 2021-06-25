import { RouteConfig } from "react-router-config";
import Workbench from "@/pages/Workbench";
import WorkbenchBak from "@/pages/Workbench.bak";
import App from "@/pages/App";
import App2 from "@/pages/App2";
// import App3 from "@/pages/App3";
import App4 from "@/pages/App4";
import App5 from "@/pages/App5";
import App6 from "@/pages/App6";

const routesConfig: RouteConfig[] = [
  { path: "/", exact: true, component: Workbench },
  { path: "/bak", exact: true, component: WorkbenchBak },
  { path: "/app", exact: true, component: App },
  { path: "/app2", exact: true, component: App2 },
  // { path: "/app3", exact: true, component: App3 },
  { path: "/app4", exact: true, component: App4 },
  { path: "/app5", exact: true, component: App5 },
  { path: "/app6", exact: true, component: App6 },

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
