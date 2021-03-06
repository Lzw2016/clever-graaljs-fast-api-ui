import qs from "qs";
import axios, { Method } from "axios";
import lodash from "lodash";
import Cookies from "js-cookie";
import { hasValue } from "@/utils/utils";
import { TypeEnum, variableTypeOf } from "@/utils/typeof";
import { Intent, IToastProps, Toaster } from "@blueprintjs/core";

interface GlobalDebugRequestData extends GlobalRequestData {
  clear: () => void;
  setValue: (data: GlobalRequestData) => void;
}

const globalDebugRequestData: GlobalDebugRequestData = {
  id: "",
  title: "",
  params: [],
  headers: [],
  cookies: [],
  clear: function () {
    this.params.length = 0;
    this.headers.length = 0;
    this.cookies.length = 0;
  },
  setValue: function (data: GlobalRequestData) {
    this.clear();
    const { params, headers, cookies } = data;
    if (params) params.forEach(item => this.params.push(item));
    if (headers) headers.forEach(item => this.headers.push(item));
    if (cookies) cookies.forEach(item => this.cookies.push(item));
  },
};

const toaster = Toaster.create({ maxToasts: 3, canEscapeKeyClear: true, position: "bottom-right" });
const toastProps: IToastProps = { timeout: 5000, intent: Intent.DANGER, icon: "error", message: "请求处理失败" };

const debugRequest = axios.create({
  withCredentials: true,
  paramsSerializer: params => qs.stringify(params, { arrayFormat: "repeat" }),
  validateStatus: () => true,
});

function transform(rawData?: Array<RequestItemData>): ({ [key: string]: string | Array<any>; }) {
  const data: ({ [key: string]: string | Array<any>; }) = {};
  rawData?.forEach(item => {
    if (!item.selected) return;
    const value = data[item.key];
    if (hasValue(value)) {
      if (variableTypeOf(value) === TypeEnum.array) {
        (value as Array<any>).push(item.value);
      } else {
        data[item.key] = [value, item.value];
      }
    } else {
      data[item.key] = item.value;
    }
  });
  return data;
}

const doDebugRequest = async (requestData: DebugRequestData, responseData: DebugResponseData, apiDebugId: string) => {
  // 全局请求参数，自定义请求参数
  const paramsArr: Array<RequestItemData> = [...requestData?.params, ...globalDebugRequestData.params];
  const headersArr: Array<RequestItemData> = [...requestData?.headers, ...globalDebugRequestData.headers];
  globalDebugRequestData.cookies
    .filter(cookie => cookie.selected)
    .forEach(cookie => Cookies.set(cookie.key, cookie.value));
  // 请求处理
  const params = transform(paramsArr);
  const headers = transform(headersArr);
  if (requestData.bodyType === "JsonBody" && requestData.jsonBody) {
    headers["content-type"] = "application/json;charset=utf-8";
  }
  if (requestData.bodyType !== "None" && requestData.method === "GET" && requestData.jsonBody) {
    toaster.show({ ...toastProps, intent: Intent.NONE, message: "GET请求的Body数据无效，应该使用POST" });
  }
  if (!headers["api-debug"]) {
    headers["api-debug"] = apiDebugId;
  }
  const startTime = lodash.now();
  return debugRequest.request({
    method: requestData.method as Method,
    url: requestData.path,
    params,
    headers,
    data: (requestData.bodyType === "JsonBody" && requestData.jsonBody) ? requestData.jsonBody : undefined,
    responseType: "arraybuffer",
    transformResponse: (data: any, headers: any) => {
      let contentType = headers["content-type"] || "application/json";
      // 图片base64
      const isImg = contentType.indexOf("image") >= 0;
      if (isImg) {
        return arrayBufferToBase64(data);
      }
      // 文件下载 content-disposition: attachment;filename=%E4%BA%8C%E7%BB%B4%E7%A0%81.jpg;filename*=utf-8''%E4%BA%8C%E7%BB%B4%E7%A0%81.jpg
      const contentDisposition: string = headers["content-disposition"] || "";
      const isDownloadFile = contentDisposition.indexOf("attachment") >= 0 && contentDisposition.indexOf("filename") >= 0;
      if (isDownloadFile) {
        const blob = new Blob([data], { type: contentType });
        (blob as any).__type = "blob";
        const filename = contentDisposition.substring(
          contentDisposition.indexOf("attachment;filename=") + "attachment;filename=".length,
          contentDisposition.indexOf(";filename*=")
        );
        (blob as any).__filename = decodeURI(filename);
        return blob;
      }
      // json|xml
      const isJson = contentType.indexOf("json") >= 0;
      // const isXml = contentType.indexOf("xml") >= 0;
      const text = decodeURIComponent(escape(arrayBufferToBinary(data).join("")));
      if (isJson) {
        try {
          return JSON.parse(text);
        } catch (e) {
        }
      }
      return text;
    },
  }).then(response => {
    const endTime = lodash.now();
    const { data, headers, status, statusText } = response;
    const contentLength = headers["content-length"];
    responseData.headers = [];
    lodash.forEach(headers, (value, key) => responseData.headers.push({ key, value }));
    responseData.status = status;
    responseData.statusText = statusText;
    responseData.time = endTime - startTime;
    // 处理body
    responseData.body = "";
    const dataType = variableTypeOf(data);
    if (data.__type === "blob" || dataType === TypeEnum.blob) {
      responseData.body = data;
      responseData.filename = data.__filename;
    } else if (dataType === TypeEnum.string
      || dataType === TypeEnum.number
      || dataType === TypeEnum.boolean) {
      responseData.body = data;
    } else if (dataType === TypeEnum.array
      || dataType === TypeEnum.function
      || dataType === TypeEnum.symbol
      || dataType === TypeEnum.math
      || dataType === TypeEnum.regexp
      || dataType === TypeEnum.date) {
      responseData.body = JSON.stringify(data, null, 4);
    } else if (dataType === TypeEnum.object || dataType === TypeEnum.json) {
      responseData.body = JSON.stringify(data, null, 4);
    }
    if (contentLength) {
      responseData.size = lodash.toNumber(contentLength) * 8;
    } else if (responseData.body) {
      responseData.size = responseData.body.length * 16;
    }
    return response;
  }).catch(err => {
    if (err?.message) {
      toaster.show({ ...toastProps, message: err.message });
    } else {
      toaster.show({ ...toastProps, message: "请求发送失败" });
    }
  });
};

// String.fromCodePoint(...new Uint8Array(data))
function arrayBufferToBinary(buffer: any) {
  const binary: string[] = [];
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary.push(String.fromCharCode(bytes[i]));
  }
  return binary;
}

function arrayBufferToBase64(buffer: any) {
  return window.btoa(arrayBufferToBinary(buffer).join(""));
}

export { globalDebugRequestData, debugRequest, doDebugRequest };
