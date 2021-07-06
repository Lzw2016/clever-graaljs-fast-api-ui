import React from 'react';
import lodash from "lodash";
import { Intent, IToastProps, Toaster } from "@blueprintjs/core";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const toaster = Toaster.create({ maxToasts: 3, canEscapeKeyClear: true, position: "bottom-right" });
const toastProps: IToastProps = { timeout: 5000, intent: Intent.DANGER, icon: "error", message: "请求处理失败" };

// HTTP 状态码错误说明
const errorMsg: { [key: number]: string } = {
  200: "服务器成功返回请求的数据。",
  201: "新建或修改数据成功。",
  202: "一个请求已经进入后台排队（异步任务）。",
  204: "删除数据成功。",
  400: "发出的请求有错误，服务器没有进行新建或修改数据的操作。",
  401: "用户没有权限（令牌、用户名、密码错误）。",
  403: "用户得到授权，但是访问是被禁止的。",
  404: "发出的请求针对的是不存在的记录，服务器没有进行操作。",
  406: "请求的格式不可得。",
  410: "请求的资源被永久删除，且不会再得到的。",
  422: "当创建一个对象时，发生一个验证错误。",
  500: "服务器发生错误，请检查服务器。",
  502: "网关错误。",
  503: "服务不可用，服务器暂时过载或维护。",
  504: "网关超时。",
};

class Request {
  // 全局响应数据转换处理
  protected static transformResponse(response: AxiosResponse): any {
    return response.data ?? null;
  }

  private axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  public get(url: string, config?: AxiosRequestConfig) {
    return this.axiosInstance.get(url, config).then(response => Request.transformResponse(response));
  }

  public delete(url: string, config?: AxiosRequestConfig) {
    return this.axiosInstance.delete(url, config).then(response => Request.transformResponse(response));
  }

  public head(url: string, config?: AxiosRequestConfig) {
    return this.axiosInstance.head(url, config).then(response => Request.transformResponse(response));
  }

  public options(url: string, config?: AxiosRequestConfig) {
    return this.axiosInstance.options(url, config).then(response => Request.transformResponse(response));
  }

  public post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axiosInstance.post(url, data, config).then(response => Request.transformResponse(response));
  }

  public put(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axiosInstance.put(url, data, config).then(response => Request.transformResponse(response));
  }

  public patch(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axiosInstance.patch(url, data, config).then(response => Request.transformResponse(response));
  }

  public request(config: AxiosRequestConfig) {
    return this.axiosInstance.request(config).then(response => Request.transformResponse(response));
  }
}

/** 创建一个axios实例对象 */
function axiosCreate(config?: AxiosRequestConfig): AxiosInstance {
  return axios.create({
    validateStatus: () => true,
    ...config,
  });
}

const axiosInstance = axiosCreate({
  validateStatus: status => (status >= 200 && status < 300),
});

// 全局请求拦截
const prefix = lodash.trim(apiGlobalPrefix).length > 0 ? apiGlobalPrefix : '';
axiosInstance.interceptors.request.use(
  request => {
    request.url = prefix + request.url;
    return request;
  },
  error => {
    toaster.show({ ...toastProps, message: "请求发送失败" })
    return Promise.reject(error);
  },
);

// 全局拦截配置
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    const { response } = error;
    if (!error || !response) {
      toaster.show({ ...toastProps, message: "请求服务端异常" });
      return Promise.reject(error);
    }
    if (response?.status === 401) {
      // TODO 跳转到登录页面
    }
    const { data: { message, validMessageList } } = response;
    if (validMessageList) {
      toaster.show({
        ...toastProps, message: (
          <div>
            请求参数校验失败
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {(validMessageList as any[]).map((item, index) => (<li key={index}>{item.filed}: {item.errorMessage}({item.code})</li>))}
            </ul>
          </div>
        ),
      });
      return Promise.reject(error.response);
    } else {
      const errorText = message ? message : (errorMsg[response.status] ?? "服务器异常");
      toaster.show({ ...toastProps, message: errorText });
    }
    return Promise.reject(error);
  }
);

const request = new Request(axiosInstance);

export { errorMsg, axiosCreate, request };
