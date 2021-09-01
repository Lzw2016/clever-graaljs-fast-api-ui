type RequestMethod = "ALL" | "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";
/** 所属模块：0-自定义扩展，1-资源文件，2-初始化脚本，3-HTTP API，4-定时任务 */
type FileResourceModule = 0 | 1 | 2 | 3 | 4;
/** 数据类型：0-文件夹，1-文件 */
type IsFile = 0 | 1;
/** 读写权限：0-可读可写，1-只读 */
type ReadOnly = 0 | 1;
/** 0-启用，1-禁用 */
type Disable = 0 | 1;

/** Fast-Api全局环境 */
interface FastApiGlobalEnv {
  /** Fast-Api版本 */
  version: string;
  /** 当前的命名空间 */
  namespace: string;
  /** 接口请求前缀 */
  apiPrefix: string;
}

interface ScriptEngineInstanceStatus {
  /** 配置-最大数量 */
  maxTotal: number;
  /** 配置-最大空闲 */
  maxIdle: number;
  /** 配置-最小空闲 */
  minIdle: number;
  /** 配置-最大等待时间 */
  maxWaitMillis: string;
  /**
   * 配置-对象在符合逐出条件之前可以在池中处于空闲状态的最短时间
   */
  minEvictableIdleTimeMillis: string;
  /**
   * 配置-退出程序运行之间的休眠毫秒数
   */
  timeBetweenEvictionRunsMillis: string;
  /**
   * 状态-当前最活动数量
   */
  numActive: number;
  /**
   * 状态-当前空闲数量
   */
  numIdle: number;
  /**
   * 状态-当前阻塞的等待池中对象的线程数的估计值
   */
  numWaiters: number;
  /**
   * 状态-在最近返回的对象中从池中签出对象的平均时间
   */
  activeTimes: string;
  /**
   * 状态-在最近借用的对象中，对象在池中空闲的平均时间
   */
  idleTimes: string;
  /**
   * 状态-最近服务的线程必须等待从池中借用对象的平均时间（毫秒）
   */
  waitTimes: string;
  /**
   * 状态-自创建池以来的最大等待时间（毫秒）
   */
  maxBorrowWaitTimeMillis: string;
  /**
   * 状态-创建数量
   */
  createdCount: string;
  /**
   * 状态-借数量
   */
  borrowedCount: string;
  /**
   * 状态-还数量
   */
  returnedCount: string;
  /**
   * 状态-销户数量
   */
  destroyedCount: string;
  /**
   * 状态-验证销毁对象计数
   */
  destroyedByBorrowValidationCount: string;
  /**
   * 状态-逐出器销毁的对象计数
   */
  destroyedByEvictorCount: string;
}

/** 树节点 */
interface SimpleTreeNode<T = any> {
  /**
   * 节点标识
   */
  id: string;
  /**
   * 父级编号
   */
  parentId?: string;
  /**
   * 是否被添加到父节点下
   */
  build: boolean;
  /**
   * 子节点
   */
  children?: Array<SimpleTreeNode<T>>;
  /**
   * 绑定到节点的对象
   */
  attributes: T;
}

/** 文件资源 */
interface FileResource {
  /**
   * 主键id
   */
  id: string;
  /**
   * 命名空间
   */
  namespace: string;
  /**
   * 所属模块：0-自定义扩展，1-资源文件，2-初始化脚本，3-HTTP API，4-定时任务
   */
  module: FileResourceModule;
  /**
   * 文件路径(以"/"结束)
   */
  path: string;
  /**
   * 文件名称
   */
  name: string;
  /**
   * 文件内容
   */
  content: string;
  /**
   * 数据类型：0-文件夹，1-文件
   */
  isFile: IsFile;
  /**
   * 读写权限：0-可读可写，1-只读
   */
  readOnly: ReadOnly;
  /**
   * 说明
   */
  description: string;
  /**
   * 创建时间
   */
  createAt: string;
  /**
   * 更新时间
   */
  updateAt: string;
}

/** HTTP接口 */
interface HttpApi {
  /**
   * 主键id
   */
  id: string;
  /**
   * 命名空间
   */
  namespace: string;
  /**
   * 资源文件id
   */
  fileResourceId: string;
  /**
   * http请求路径
   */
  requestMapping: string;
  /**
   * http请求method，ALL GET HEAD POST PUT DELETE CONNECT OPTIONS TRACE PATCH
   */
  requestMethod: RequestMethod;
  /**
   * 禁用http请求：0-启用，1-禁用
   */
  disableRequest: Disable;
  /**
   * 创建时间
   */
  createAt: string;
  /**
   * 更新时间
   */
  updateAt: string;
}

/** 资源文件修改历史 */
interface FileResourceHistory {
  /**
   * 主键id
   */
  id: string;
  /**
   * 命名空间
   */
  namespace: string;
  /**
   * 所属模块：0-自定义扩展，1-资源文件，2-初始化脚本，3-HTTP API，4-定时任务
   */
  module: FileResourceModule;
  /**
   * 文件路径(以"/"结束)
   */
  path: string;
  /**
   * 文件名称
   */
  name: string;
  /**
   * 文件内容
   */
  content: string;
  /**
   * 创建时间
   */
  createAt: string;
}

/** HTTP接口树节点(文件纬度) */
interface ApiFileResourceRes {
  /**
   * HTTP接口id
   */
  httpApiId?: string;
  /**
   * 资源文件id
   */
  fileResourceId: string;
  /**
   * 父级编号(资源文件id)
   */
  parentFileResourceId?: string;
  /**
   * 命名空间
   */
  namespace: string;
  /**
   * 文件路径(以"/"结束)
   */
  path: string;
  /**
   * 文件名称
   */
  name: string;
  /**
   * 数据类型：0-文件夹，1-文件
   */
  isFile: IsFile;
  /**
   * 读写权限：0-可读可写，1-只读
   */
  readOnly: ReadOnly;
  /**
   * http请求路径
   */
  requestMapping?: string;
  /**
   * http请求method，ALL GET HEAD POST PUT DELETE CONNECT OPTIONS TRACE PATCH
   */
  requestMethod?: RequestMethod;
  /**
   * 禁用http请求：0-启用，1-禁用
   */
  disableRequest?: Disable;
}

/** HTTP接口树节点(请求路径纬度) */
interface ApiRequestMappingRes {
  /**
   * HTTP接口id
   */
  httpApiId: string;
  /**
   * 资源文件id
   */
  fileResourceId: string;
  /**
   * 父级编号(HTTP接口id)
   */
  parentHttpApiId: string;
  /**
   * 命名空间
   */
  namespace: string;
  /**
   * 文件路径(以"/"结束)
   */
  path: string;
  /**
   * 文件名称
   */
  name: string;
  /**
   * 数据类型：0-文件夹，1-文件
   */
  isFile: IsFile;
  /**
   * 读写权限：0-可读可写，1-只读
   */
  readOnly: ReadOnly;
  /**
   * http请求路径
   */
  requestMapping: string;
  /**
   * http请求method，ALL GET HEAD POST PUT DELETE CONNECT OPTIONS TRACE PATCH
   */
  requestMethod: RequestMethod;
  /**
   * 禁用http请求：0-启用，1-禁用
   */
  disableRequest: Disable;
}

interface HttpApiFileResourceRes {
  fileResource: FileResource;
  httpApi: HttpApi;
}

interface FileResourceTreeNodeRes {
  /**
   * 主键id
   */
  id: string;
  /**
   * 父级编号(资源文件id)
   */
  parentFileResourceId?: string;
  /**
   * 命名空间
   */
  namespace: string;
  /**
   * 所属模块：0-自定义扩展，1-资源文件，2-初始化脚本，3-HTTP API，4-定时任务
   */
  module: FileResourceModule;
  /**
   * 文件路径(以"/"结束)
   */
  path: string;
  /**
   * 文件名称
   */
  name: string;
  /**
   * 数据类型：0-文件夹，1-文件
   */
  isFile: IsFile;
  /**
   * 读写权限：0-可读可写，1-只读
   */
  readOnly: ReadOnly;
}

interface AddHttpApiRes {
  fileList: Array<FileResource>;
  httpApi: HttpApi;
}

interface DelHttpApiRes {
  fileList: Array<FileResource>;
  httpApiList: Array<HttpApi>;
}

interface HttpApiDebugTitleRes {
  /** 主键id */
  id: string;
  /** HTTP接口id */
  httpApiId: string;
  /** 标题 */
  title: string;
}

interface HttpApiDebug {
  /** 主键id */
  id: string;
  /** 命名空间 */
  namespace: string;
  /** HTTP接口id */
  httpApiId: string;
  /** 标题 */
  title: string;
  /** 请求数据json格式*/
  requestData: string;
  /** 创建时间 */
  createAt: string;
  /** 更新时间 */
  updateAt: string;
}

interface HttpApiDebugRes {
  /** 主键id */
  id: string;
  /** 命名空间 */
  namespace: string;
  /** HTTP接口id */
  httpApiId: string;
  /** 标题 */
  title: string;
  /** 请求数据 */
  requestData: DebugRequestData;
  /** 创建时间 */
  createAt: string;
  /** 更新时间 */
  updateAt?: string;
}

interface RequestItemData {
  key: string;
  value: string;
  description?: string;
  selected?: boolean;
}

type RequestBodyTypeEnum = "None" | "JsonBody" | "FormBody";

interface DebugRequestData {
  method: RequestMethod;
  path: string;
  params: Array<RequestItemData>;
  headers: Array<RequestItemData>;
  // cookies: { [key: string]: string };
  bodyType: RequestBodyTypeEnum;
  jsonBody?: string;
  formBody: Array<{ key: string; type: "text" | "file", value: string; }>;
}

interface DebugResponseData {
  body: string;
  headers: Array<RequestItemData>;
  // resCookies?: { [key: string]: string }; // Name Value Domain Path Expires HttpOnly Secure
  filename?: string;
  status?: number;
  statusText?: string;
  time?: number;
  size?: number;
}

interface WebSocketErrorRes {
  errorStackTrace: string;
}

interface RingBuffer {
  firstIndex: number;
  lastIndex: number;
  content: Array<string>
}

interface GlobalRequestData {
  id: string;
  title: string;
  params: Array<RequestItemData>;
  headers: Array<RequestItemData>;
  cookies: Array<RequestItemData>;
}

interface JdbcInfo {
  driverClassName: string;
  jdbcUrl: string;
  isAutoCommit: boolean;
  isReadOnly: boolean;
  dbType: string;
  isClosed: boolean;
}

interface JdbcDataSourceStatus {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  threadsAwaitingConnection: number;
}

interface DataSourceConfig {
  id: string;
  namespace: string;
  type: string;
  name: string;
  config: string;
  disable: number;
  createAt: string;
  updateAt: string;
}

interface JdbcInfoRes {
  name: string;
  def: boolean;
  immutable: boolean;
  jdbcInfo: JdbcInfo;
  status: JdbcDataSourceStatus;
  dataSourceConfig: DataSourceConfig;
}

interface RedisInfo {
  // ...
}

interface RedisDataSourceStatus {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  threadsAwaitingConnection: number;
  maxBorrowWaitTimeMillis: string;
  meanBorrowWaitTimeMillis: string;
  meanActiveTimeMillis: string;
  meanIdleTimeMillis: string;
}

interface RedisInfoRes {
  name: string;
  def: boolean;
  immutable: boolean;
  redisInfo: RedisInfo;
  status: RedisDataSourceStatus;
  dataSourceConfig: DataSourceConfig;
}

interface JobFileResourceRes {
  jobId?: string;
  jobTriggerId?: string;
  /** 资源文件id */
  fileResourceId: string;
  /** 父级编号(资源文件id) */
  parentFileResourceId?: string;
  /** 命名空间 */
  namespace: string;
  /** 文件路径(以"/"结束) */
  path: string;
  /** 文件名称 */
  name: string;
  /** 数据类型：0-文件夹，1-文件 */
  isFile: IsFile;
  /** 读写权限：0-可读可写，1-只读 */
  readOnly: ReadOnly;
  // -------------------------------------------------------------------------------- Job
  /** 任务名称 */
  jobName: string;
  /** 最大重入执行数量(对于单个节点当前任务未执行完成就触发了下一次执行导致任务重入执行)，小于等于0：表示禁止重入执行 */
  maxReentry: number;
  /** 是否允许多节点并发执行，使用悲观锁实现(不建议使用)，0：禁止，1：允许 */
  allowConcurrent: number;
  /** 执行失败时的最大重试次数 */
  maxRetryCount: number;
  /** 路由策略，0：不启用，1：指定节点优先，2：固定节点白名单，3：固定节点黑名单 */
  routeStrategy: number;
  /** 路由策略，1-指定节点优先，调度器名称集合 */
  firstScheduler: string;
  /** 路由策略，2-固定节点白名单，调度器名称集合 */
  whitelistScheduler: string;
  /** 路由策略，3-固定节点黑名单，调度器名称集合 */
  blacklistScheduler: string;
  /** 负载均衡策略，1：抢占，2：随机，3：轮询，4：一致性HASH */
  loadBalance: number;
  /** 是否禁用：0-启用，1-禁用 */
  disable: number;
  // -------------------------------------------------------------------------------- JobTrigger
  /** 触发开始时间 */
  startTime: string;
  /** 触发结束时间 */
  endTime: string;
  /** 上一次触发时间 */
  lastFireTime: string;
  /** 下一次触发时间 */
  nextFireTime: string;
  /** 错过触发策略，1：忽略，2：立即补偿触发一次 */
  misfireStrategy: number;
  /** 是否允许多节点并行触发，使用悲观锁实现，0：禁止，1：允许 */
  triggerAllowConcurrent: number;
  /** 任务类型，1：cron触发，2：固定速率触发 */
  type: number;
  /** cron表达式 */
  cron?: string;
  /** 固定速率触发，间隔时间(单位：秒) */
  fixedInterval?: string;
  /** 是否禁用：0-启用，1-禁用 */
  triggerDisable: number;
}

interface Job {
  id: string;
  namespace: string;
  name: string;
  type: number;
  maxReentry: number;
  allowConcurrent: number;
  lockVersion: number;
  maxRetryCount: number;
  routeStrategy: number;
  firstScheduler: string;
  whitelistScheduler: string;
  blacklistScheduler: string;
  loadBalance: number;
  isUpdateData: number;
  jobData: string;
  disable: number;
  description: string;
  createAt: string;
  updateAt: string;
}

interface JobTrigger {
  id: string;
  namespace: string;
  jobId: string;
  name: string;
  startTime: string;
  endTime: string;
  lastFireTime: string;
  nextFireTime: string;
  misfireStrategy: number;
  allowConcurrent: number;
  lockVersion: number;
  type: number;
  cron: string;
  fixedInterval: string;
  disable: number;
  description: string;
  createAt: string;
  updateAt: string;
}

interface AddJsJobRes {
  fileList: Array<FileResource>;
  job: Job;
  jobTrigger: JobTrigger;
}

interface JsJobInfoRes {
  fileResource: FileResource;
  job: Job;
  jobTrigger: JobTrigger;
}

interface DelJsJobRes {
  fileList: Array<FileResource>;
}
