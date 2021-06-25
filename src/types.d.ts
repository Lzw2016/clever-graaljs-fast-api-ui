type RequestMethod = "ALL" | "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";

/** Fast-Api全局环境 */
interface FastApiGlobalEnv {
  /** Fast-Api版本 */
  version: string;
  /** 当前的命名空间 */
  namespace: string;
  /** 接口请求前缀 */
  apiPrefix: string;
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
  isFile: 0 | 1;
  /**
   * 读写权限：0-可读可写，1-只读
   */
  readOnly: 0 | 1;
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
  disableRequest: 0 | 1;
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
  parentFileResourceId: string;
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
  isFile: 0 | 1;
  /**
   * 读写权限：0-可读可写，1-只读
   */
  readOnly: 0 | 1;
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
  disableRequest?: 0 | 1;
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
  isFile: 0 | 1;
  /**
   * 读写权限：0-可读可写，1-只读
   */
  readOnly: 0 | 1;
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
  disableRequest: 0 | 1;
}
