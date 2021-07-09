import qs from "qs";
import axios, { Method } from "axios";
import lodash from "lodash";
import { hasPropertyIn, hasValue } from "@/utils/utils";
import { TypeEnum, variableTypeOf } from "@/utils/typeof";
import { Intent, IToastProps, Toaster } from "@blueprintjs/core";

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

const doDebugRequest = async (requestData: DebugRequestData, responseData: DebugResponseData) => {
  const params = transform(requestData?.params);
  const headers = transform(requestData?.headers);
  if (requestData.jsonBody) {
    headers["content-type"] = "application/json;charset=utf-8";
  }
  if (requestData.method === "GET" && requestData.jsonBody) {
    toaster.show({ ...toastProps, intent: Intent.NONE, message: "GET请求的Body数据无效，应该使用POST" });
  }
  const startTime = lodash.now();
  if (!headers["api-debug"]) {
    headers["api-debug"] = `debug_${startTime}_${lodash.uniqueId()}`;
  }
  return debugRequest.request({
    method: requestData.method as Method,
    url: requestData.path,
    params,
    headers,
    data: requestData.jsonBody ? requestData.jsonBody : undefined,
  }).then(response => {
    const endTime = lodash.now();
    const { data, headers, status, statusText } = response;
    const contentLength = headers["content-length"];
    responseData.headers = [];
    lodash.forEach(headers, (value, key) => responseData.headers.push({ key, value }));
    responseData.status = status;
    responseData.statusText = statusText;
    responseData.time = endTime - startTime;
    if (contentLength) responseData.size = lodash.toNumber(contentLength) * 8;
    // 处理body
    responseData.body = "";
    responseData.logs = undefined;
    const dataType = variableTypeOf(data);
    if (dataType === TypeEnum.string
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
      if (hasPropertyIn(data, "data") && variableTypeOf(data?.logs?.content) === TypeEnum.array) {
        const resData = data?.data;
        const resDataType = variableTypeOf(resData);
        if (resDataType === TypeEnum.string || resDataType === TypeEnum.number || resDataType === TypeEnum.boolean) {
          responseData.body = resData;
        } else if (resDataType !== TypeEnum.null && resDataType !== TypeEnum.undefined && resDataType !== TypeEnum.nan) {
          responseData.body = JSON.stringify(resData, null, 4);
        }
        responseData.logs = data?.logs;
      } else {
        responseData.body = JSON.stringify(data, null, 4);
      }
    }
    return response;
  });
};

export { debugRequest, doDebugRequest };
