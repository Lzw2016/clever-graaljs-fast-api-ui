import localforage from "localforage";
import { HttpApiResourcePaneState } from "@/components/ide";

const fastApiStore = localforage.createInstance({
  name: "fast-api",
  description: "保存应用状态",
});

/** 组件状态key */
const componentStateKey = {
  HttpApiResourcePaneState: "HttpApiResourcePaneState",
  ExtendResourcePaneState: "ExtendResourcePaneState",
}

export { fastApiStore, componentStateKey };

