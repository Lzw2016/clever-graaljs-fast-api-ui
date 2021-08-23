// enum LayoutPanelEnum {
//   Left,
//   Right,
//   Bottom,
// }

export enum LeftPanelEnum {
  /** 资源文件 */
  ResourceFile,
  /** Http接口 */
  HttpApi,
  /** 定时任务 */
  TimedTask,
  /** 自定义扩展 */
  Extend,
  /** 初始化脚本 */
  Initialization
}

export enum RightPanelEnum {
  /** JDBC数据库 */
  JDBC,
  /** Redis数据库 */
  Redis,
  /** Elasticsearch数据库 */
  Elasticsearch
}

export enum BottomPanelEnum {
  /** 接口配置 */
  Interface,
  /** 接口调试 */
  RequestDebug,
  /** 服务端日志 */
  ServerLogs,
  /** 全局请求参数 */
  GlobalConfig,
  /** 系统日志 */
  SysEvent,
}

/** 布局状态 */
export interface LayoutSize {
  /** 底部容器显示的叶签 */
  bottomPanel?: BottomPanelEnum;
  /** 上下容器Size */
  vSplitSize: [number, number];
  /** 上下容器收缩Size */
  vSplitCollapsedSize: [number, number];
  /** 左侧容器显示的叶签 */
  leftPanel?: LeftPanelEnum;
  /** 右侧容器显示的叶签 */
  rightPanel?: RightPanelEnum;
  /** 左中右容器Size */
  hSplitSize: [number, number, number];
  /** 左中右容器收缩Size */
  hSplitCollapsedSize: [number, number, number];
}

/** 各种加载状态 */
export interface WorkbenchLoading {
  /** 加载HttpApi */
  getApiFileResourceLoading: boolean;
  /** 保存文件Loading */
  saveFileResourceLoading: boolean;
  /** 加载文件 */
  getFileResourceLoading: boolean;
}

export interface TopStatusFileInfo {
  /** 资源文件id */
  fileResourceId: string;
  /** 数据类型：0-文件夹，1-文件 */
  isFile: 0 | 1;
  /** 文件路径(以"/"结束) */
  path: string;
  /** 文件名称 */
  name: string;

  /** HTTP接口id */
  httpApiId?: string;
  /** http请求路径 */
  requestMapping?: string;
  /** http请求method，ALL GET HEAD POST PUT DELETE CONNECT OPTIONS TRACE PATCH */
  requestMethod?: RequestMethod;

  /** 任务名称 */
  jobName?: string;
  /** 上一次触发时间 */
  lastFireTime?: string;
  /** 下一次触发时间 */
  nextFireTime?: string;
  /** cron表达式 */
  cron?: string;
  /** 是否禁用：0-启用，1-禁用 */
  triggerDisable?: number;
}

export interface EditorTabItem {
  /** 顺序(由小到大) */
  sort: number;
  /** 最后编辑时间 */
  lastEditTime: number;
  /** 文件 */
  fileResource: FileResource,
  /** 文件原始内容 */
  rawContent: string;
  /** 是否需要保存 */
  needSave: boolean;

  /** Http接口 */
  httpApi?: HttpApi,
  /** TODO 请求参数(列表) */
  // httpApiRequestParamList?: Array<any>;
  /** TODO API文档 */
  // httpApiDoc?: any;

  /** 定时任务信息 */
  job?: Job;
  /** 触发器信息 */
  jobTrigger?: JobTrigger;
}

/** 编辑器打开的文件 */
export interface EditorTabsState {
  /** 当前编辑的fileResourceId */
  currentEditId?: string;
  /** 当前打开的文件列表 Map<fileResourceId, EditorTabItem> */
  openFileMap: Map<string, EditorTabItem>;
  /**  */
  /**  */
}

/** 数据转换 */
export function transformEditorTabItem2TopStatusFileInfo(editorTabItem: EditorTabItem): TopStatusFileInfo {
  return {
    fileResourceId: editorTabItem.fileResource.id,
    isFile: editorTabItem.fileResource.isFile,
    path: editorTabItem.fileResource.path,
    name: editorTabItem.fileResource.name,
    httpApiId: editorTabItem.httpApi?.id,
    requestMapping: editorTabItem.httpApi?.requestMapping,
    requestMethod: editorTabItem.httpApi?.requestMethod,
    jobName: editorTabItem.job?.name,
    lastFireTime: editorTabItem.jobTrigger?.lastFireTime,
    nextFireTime: editorTabItem.jobTrigger?.nextFireTime,
    cron: editorTabItem.jobTrigger?.cron,
    triggerDisable: editorTabItem.jobTrigger?.disable,
  };
}

export function toTopStatusFileInfo(resource: Partial<(FileResourceTreeNodeRes & ApiFileResourceRes & JobFileResourceRes)>): TopStatusFileInfo {
  return {
    fileResourceId: (resource.fileResourceId || resource.id)!,
    isFile: resource.isFile!,
    path: resource.path!,
    name: resource.name!,
    httpApiId: resource.httpApiId,
    requestMapping: resource.requestMapping,
    requestMethod: resource.requestMethod,
    jobName: resource.jobName,
    lastFireTime: resource.lastFireTime,
    nextFireTime: resource.nextFireTime,
    cron: resource.cron,
    triggerDisable: resource.triggerDisable,
  };
}
