// enum LayoutPanelEnum {
//   Left,
//   Right,
//   Bottom,
// }

export enum LeftPanelEnum {
  /** Http接口 */
  Interface,
  /** 定时任务 */
  TimedTask,
  /** 自定义扩展 */
  Expand,
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
  /** 请求配置 */
  Request,
  /** 运行结果 */
  RunResult,
  /** 全局请求参数 */
  GlobalConfig,
  /** 系统事件 */
  SysEvent,
}

export interface EditorTabItem {
  /** 顺序(由小到大) */
  sort: number;
  /** 文件 */
  fileResource: FileResource,
  /** 是否需要保存 */
  needSave: boolean;
  /** Http接口 */
  httpApi?: HttpApi,
  /** TODO 请求参数(列表) */
  httpApiRequestParamList?: Array<any>;
  /** TODO API文档 */
  httpApiDoc?: any;
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
