import { RouteConfig } from "react-router-config";
import Workbench from "@/pages/Workbench";
import { Test } from "@/pages/Test";

const routesConfig: RouteConfig[] = [
  { path: "/", exact: true, component: Workbench },
  { path: "/index.html", exact: true, component: Workbench },
  { path: "/fast-api.html", exact: true, component: Workbench },
  { path: "/test", exact: true, component: Test },
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
