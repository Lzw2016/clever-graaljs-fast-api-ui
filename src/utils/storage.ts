import localforage from "localforage";
import lodash from "lodash";

const fastApiStore = localforage.createInstance({
  name: "fast-api",
  description: "保存应用状态",
});

const allData: { [key: string]: any } = {};

/** 组件状态key */
const componentStateKey: { [key: string]: string } = {
  Workbench: "Workbench",
  HttpApiResourcePanelState: "HttpApiResourcePanelState",
  ExtendResourcePanelState: "ExtendResourcePanelState",
  RequestDebugPanelState: "RequestDebugPanelState",
  GlobalConfigPanelState: "GlobalConfigPanelState",
}

const loadAllData = (): Promise<any> => {
  const all: Array<Promise<any>> = [];
  lodash(componentStateKey).forEach(value => {
    all.push(fastApiStore.getItem(value).then(data => {
      allData[value] = data;
    }));
  });
  return Promise.any(all);
}

const storeSaveData = <T = any>(key: string, value: T): Promise<T> => {
  return fastApiStore.setItem(key, value);
}

const storeGetData = <T = any>(key: string): T => {
  return allData[key] ?? {};
}

export { componentStateKey, loadAllData, storeSaveData, storeGetData };
