import { RouteConfig } from "react-router-config";
import Workbench from "@/pages/Workbench";

const routesConfig: RouteConfig[] = [
  { path: "/", exact: true, component: Workbench },

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
