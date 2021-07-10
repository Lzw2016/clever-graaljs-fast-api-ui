import localforage from "localforage";

const fastApiStore = localforage.createInstance({
  name: "fast-api",
  description: "保存应用状态",
});

/** 组件状态key */
const componentStateKey = {
  Workbench: "Workbench",
  HttpApiResourcePanelState: "HttpApiResourcePanelState",
  ExtendResourcePanelState: "ExtendResourcePanelState",
  RequestDebugPanelState: "RequestDebugPanelState",
  GlobalConfigPanelState: "GlobalConfigPanelState",
}

export { fastApiStore, componentStateKey };
