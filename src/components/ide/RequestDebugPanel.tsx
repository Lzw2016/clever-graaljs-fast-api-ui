import React from "react";
import cls from "classnames";
import lodash from "lodash";
import Split from "react-split";
import SimpleBar from "simplebar-react";
import Icon from "@ant-design/icons";
import { Button, Classes, InputGroup, Intent, Radio, RadioGroup, Spinner, SpinnerSize, Tab, Tabs } from "@blueprintjs/core";
import Editor from "@monaco-editor/react";
import { DynamicForm } from "@/components/DynamicForm";
import { LogViewer } from "@/components/LogViewer";
import { FastApi } from "@/apis";
import { debugRequest } from "@/utils/debug-request";
import { hasPropertyIn, hasValue } from "@/utils/utils";
import { TypeEnum, variableTypeOf } from "@/utils/typeof";
import { bytesFormat } from "@/utils/format";
import { request } from "@/utils/request";
import { editorDefOptions, languageEnum, themeEnum } from "@/utils/editor-utils";
import { Add, Edit, Execute, HttpRequestsFiletype, MenuSaveAll, Refresh, Remove2 } from "@/utils/IdeaIconUtils";
import { componentStateKey, fastApiStore } from "@/utils/storage";
import styles from "./RequestDebugPanel.module.less";

enum RequestTabEnum {
  Params = "Params",
  Headers = "Headers",
  Body = "Body",
  Cookies = "Cookies",
  CURL = "CURL",
}

enum ResponseTabEnum {
  Body = "Body",
  Headers = "Headers",
  Cookies = "Cookies",
  ServerLogs = "ServerLogs",
}

enum RequestBodyTabEnum {
  JsonBody = "JsonBody",
  FormBody = "FormBody",
}

interface RequestDebugPanelProps {
  /** HTTP接口id */
  httpApiId?: string;
}

interface RequestDebugPanelState {
  /** 左中右容器Size */
  hSplitSize: [number, number, number];
  /** 请求叶签 */
  requestTab: RequestTabEnum;
  /** 请求Body叶签 */
  requestBodyTab: RequestBodyTabEnum;
  /** 响应叶签 */
  responseTab: ResponseTabEnum;
  /** HTTP接口id */
  httpApiId?: string;
  /** HttpApiDebug Title 列表 */
  titleList: Array<HttpApiDebugTitleRes>;
  /** 数据加载状态 */
  titleListLoading: boolean;
  /** HttpApiDebug Data */
  httpApiDebugRes: HttpApiDebugRes;
  /** Debug Response Data */
  debugResponseData: DebugResponseData;
  /** debug请求状态 */
  debugLoading: boolean;
}

// 读取组件状态
const storageState: Partial<RequestDebugPanelState> = await fastApiStore.getItem(componentStateKey.RequestDebugPanelState) ?? {};
// 组件状态默认值
const defHttpApiDebugRes = (): HttpApiDebugRes => ({
  id: "", namespace: "", httpApiId: "", title: "",
  requestData: { method: "GET", path: "", params: [], headers: [], jsonBody: "", formBody: [] },
  createAt: "", updateAt: ""
});
const defDebugResponseData = (): DebugResponseData => ({ body: "", headers: [] });
const defaultState: RequestDebugPanelState = {
  hSplitSize: [15, 40, 45],
  requestTab: RequestTabEnum.Params,
  requestBodyTab: RequestBodyTabEnum.JsonBody,
  responseTab: ResponseTabEnum.Body,
  titleList: [],
  titleListLoading: false,
  httpApiDebugRes: { ...defHttpApiDebugRes() },
  debugResponseData: { ...defDebugResponseData() },
  debugLoading: false,
  ...storageState,
}

class RequestDebugPanel extends React.Component<RequestDebugPanelProps, RequestDebugPanelState> {
  /** 执行组件状态的全局锁 */
  private saveStateLock: boolean = false;
  /** 保存组件的状态 */
  private saveComponentState = lodash.debounce(() => this.saveState().finally(), 1_000, { maxWait: 3_000 });
  /** 显示日志组件 */
  private logViewer = React.createRef<LogViewer>();

  constructor(props: RequestDebugPanelProps) {
    super(props);
    this.state = { ...defaultState };
  }

  // 组件挂载后
  public componentDidMount() {
    this.reLoadData();
  }

  // 组件将要被卸载
  public componentWillUnmount() {
    this.saveState().finally();
  }

  /** 保存组件状态 */
  public async saveState(): Promise<void> {
    if (this.saveStateLock) return;
    const { hSplitSize, requestTab, requestBodyTab, responseTab } = this.state;
    await fastApiStore.setItem(
      componentStateKey.RequestDebugPanelState,
      { hSplitSize, requestTab, requestBodyTab, responseTab },
    ).finally(() => {
      this.saveStateLock = false;
    });
  }

  /** 重新加载数据 */
  public reLoadData(spin: boolean = true, httpApiId?: string, force?: boolean) {
    const { httpApiId: httpApiIdProps } = this.props;
    const { httpApiId: httpApiIdState } = this.state;
    if (!httpApiId) {
      if (!force && httpApiIdProps === httpApiIdState) return;
      httpApiId = httpApiIdProps;
    }
    if (!httpApiId) {
      this.setState({ httpApiId, titleList: [], httpApiDebugRes: { ...defHttpApiDebugRes() } });
      return;
    }
    if (spin) this.setState({ titleListLoading: true });
    request.get(FastApi.HttpApiDebugManage.getTitleList, { params: { httpApiId } })
      .then((data: Array<HttpApiDebugTitleRes>) => {
        this.setState({ httpApiId, titleList: data, httpApiDebugRes: { ...defHttpApiDebugRes() } });
        // TODO loadHttpApiDebugRes
      }).finally(() => {
      if (spin) this.setState({ titleListLoading: false });
    });
  }

  // 加载HttpApiDebug数据
  private loadHttpApiDebugRes(id: string) {
    if (!id) return;
    request.get(FastApi.HttpApiDebugManage.getHttpApiDebug, { params: { id } })
      .then((data: HttpApiDebugRes) => {
        if (data) {
          this.setState({ httpApiDebugRes: { ...defHttpApiDebugRes(), ...data }, debugResponseData: { ...defDebugResponseData() } });
        } else {
          this.setState({ httpApiDebugRes: { ...defHttpApiDebugRes() }, debugResponseData: { ...defDebugResponseData() } });
        }
      }).finally();
  }

  // 调试接口
  private doDebug() {
    const { httpApiDebugRes: { requestData }, debugResponseData } = this.state;
    const params: any = {};
    requestData?.params?.forEach(param => {
      params[param.key] = param.value;
    });
    const headers: any = {};
    requestData?.headers?.forEach(header => {
      headers[header.key] = header.value;
    });
    headers["content-type"] = "application/json;charset=utf-8";
    this.setState({ debugLoading: true });
    const startTime = lodash.now();
    if (!headers["api-debug"]) headers["api-debug"] = `debug_${startTime}_${lodash.uniqueId()}`;
    debugRequest.request({
      withCredentials: true,
      method: requestData.method as any,
      url: requestData.path,
      params,
      headers,
      data: requestData.jsonBody,
    }).then(response => {
      const endTime = lodash.now();
      const { data, headers, status, statusText } = response;
      const contentLength = headers["content-length"];
      debugResponseData.headers = [];
      lodash.forEach(headers, (value, key) => debugResponseData.headers.push({ key, value }));
      debugResponseData.status = status;
      debugResponseData.statusText = statusText;
      debugResponseData.time = endTime - startTime;
      if (contentLength) debugResponseData.size = lodash.toNumber(contentLength) * 8;
      // 处理body
      debugResponseData.body = "";
      debugResponseData.logs = undefined;
      const dataType = variableTypeOf(data);
      if (dataType === TypeEnum.string
        || dataType === TypeEnum.number
        || dataType === TypeEnum.boolean) {
        debugResponseData.body = data;
      } else if (dataType === TypeEnum.array
        || dataType === TypeEnum.function
        || dataType === TypeEnum.symbol
        || dataType === TypeEnum.math
        || dataType === TypeEnum.regexp
        || dataType === TypeEnum.date) {
        debugResponseData.body = JSON.stringify(data, null, 4);
      } else if (dataType === TypeEnum.object || dataType === TypeEnum.json) {
        if (hasPropertyIn(data, "data") && variableTypeOf(data?.logs?.content) === TypeEnum.array) {
          const resData = data?.data;
          const resDataType = variableTypeOf(resData);
          if (resDataType === TypeEnum.string || resDataType === TypeEnum.number || resDataType === TypeEnum.boolean) {
            debugResponseData.body = resData;
          } else if (resDataType !== TypeEnum.null && resDataType !== TypeEnum.undefined && resDataType !== TypeEnum.nan) {
            debugResponseData.body = JSON.stringify(resData, null, 4);
          }
          debugResponseData.logs = data?.logs;
        } else {
          debugResponseData.body = JSON.stringify(data, null, 4);
        }
      }
      // 服务端日志
      const logViewer = this.logViewer.current;
      if (logViewer && debugResponseData.logs && debugResponseData.logs.content && debugResponseData.logs.content.length > 0) {
        logViewer.clear(debugResponseData.logs.firstIndex);
        debugResponseData.logs.content.forEach(log => logViewer.addLogLine(log));
        logViewer.addLogLine("");
      } else if (logViewer) {
        logViewer.clear();
      }
      this.forceUpdate();
    }).finally(() => this.setState({ debugLoading: false }));
  }

  // 左边面板
  private getLeftPanel() {
    const { titleList, titleListLoading, httpApiDebugRes } = this.state;
    return (
      <>
        <div className={cls(styles.flexColumn, styles.leftPanelTools)}>
          <div className={cls(styles.flexItemColumnWidthFull)}/>
          <Icon component={Remove2} className={cls(styles.flexItemColumn, styles.icon)}/>
          <Icon component={Add} className={cls(styles.flexItemColumn, styles.icon)}/>
          <Icon
            className={cls(styles.flexItemColumn, styles.icon)}
            component={Refresh}
            onClick={() => this.reLoadData(true, undefined, true)}
          />
        </div>
        <div className={cls(styles.flexColumn, styles.leftPanelList)}>
          <SimpleBar
            style={{ height: "100%", width: "100%" }}
            autoHide={false}
            scrollbarMinSize={48}
          >
            {titleListLoading && <Spinner className={cls(styles.loading)} intent={Intent.PRIMARY} size={SpinnerSize.SMALL}/>}
            {
              !titleListLoading &&
              titleList.map(title => (
                <div
                  key={title.id}
                  className={cls(
                    styles.flexColumn, styles.leftPanelListItem,
                    { [styles.leftPanelListItemSelected]: httpApiDebugRes.id === title.id },
                  )}
                >
                  <Icon component={HttpRequestsFiletype} className={cls(styles.flexItemColumn, styles.leftPanelListItemIcon)}/>
                  <div
                    className={cls(styles.flexItemColumnWidthFull, styles.leftPanelListItemText)}
                    onClick={() => this.loadHttpApiDebugRes(title.id)}
                  >
                    {title.title}
                  </div>
                </div>
              ))
            }
          </SimpleBar>
        </div>
      </>
    );
  }

  // 中间面板
  private getCenterPanel() {
    const { requestTab, httpApiDebugRes, debugLoading } = this.state;
    const isHide = lodash.toString(httpApiDebugRes.id).length <= 0;
    return (
      <>
        <div className={cls(styles.requestTitle, styles.flexColumn, { [styles.hide]: isHide })}>
          <div className={cls(styles.flexItemColumn, styles.requestTitleText)}>
            {httpApiDebugRes?.title ?? "undefined"}
            <Icon className={cls(styles.editIcon)} component={Edit}/>
          </div>
          <div className={cls(styles.flexItemColumnWidthFull)}/>
          <Icon
            className={cls(styles.flexItemColumn, styles.icon)}
            component={MenuSaveAll}
          />
        </div>
        <div className={cls(styles.requestPath, styles.flexColumn, { [styles.hide]: isHide })}>
          <select
            className={cls(styles.flexItemColumn)}
            disabled={debugLoading}
            value={httpApiDebugRes?.requestData?.method ?? "GET"}
            onChange={e => {
              if (!httpApiDebugRes?.requestData) return;
              httpApiDebugRes.requestData.method = e.target.value as any;
              this.forceUpdate();
            }}
          >
            <option value={"GET"}>GET</option>
            <option value={"POST"}>POST</option>
            <option value={"PUT"}>PUT</option>
            <option value={"DELETE"}>DELETE</option>
            <option value={"PATCH"}>PATCH</option>
            <option value={"OPTIONS"}>OPTIONS</option>
            <option value={"HEAD"}>HEAD</option>
            <option value={"CONNECT"}>CONNECT</option>
            <option value={"TRACE"}>TRACE</option>
          </select>
          <InputGroup
            className={cls(styles.flexItemColumnWidthFull)}
            style={{ cursor: "default", height: 24 }}
            type={"text"}
            placeholder={"输入接口路径"}
            readOnly={debugLoading}
            disabled={debugLoading}
            value={httpApiDebugRes?.requestData?.path}
            onChange={e => {
              if (!httpApiDebugRes?.requestData) return;
              httpApiDebugRes.requestData.path = e.target.value;
              this.forceUpdate();
            }}
          />
          <Button
            className={cls(styles.flexItemColumn)}
            intent={Intent.PRIMARY}
            icon={<Icon component={Execute} style={{ marginRight: 2 }}/>}
            loading={debugLoading}
            disabled={debugLoading}
            onClick={() => this.doDebug()}
          >
            <span style={{ marginRight: 4 }}>Send</span>
          </Button>
        </div>
        <Tabs
          className={cls(styles.requestArgs, { [styles.hide]: isHide })}
          id={"RequestDebugPanel-CenterPanel"}
          animate={false}
          renderActiveTabPanelOnly={false}
          vertical={false}
          selectedTabId={requestTab}
          onChange={newTabId => this.setState({ requestTab: (newTabId as any) })}
        >
          <Tab id={RequestTabEnum.Params} title="Params" panel={this.getParamsPanel()}/>
          <Tab id={RequestTabEnum.Headers} title="Headers" panel={this.getRequestHeadersPanel()}/>
          <Tab id={RequestTabEnum.Body} title="Body" panel={this.getRequestBodyPanel()}/>
          <Tabs.Expander/>
          <Tab id={RequestTabEnum.Cookies} title="Cookies" panel={this.getRequestCookiesPanel()} disabled={true}/>
          <Tab id={RequestTabEnum.CURL} title="CURL" panel={this.getRequestCookiesPanel()} disabled={true}/>
        </Tabs>
      </>
    );
  }

  // 右边面板
  private getRightPanel() {
    const { responseTab, httpApiDebugRes, debugResponseData } = this.state;
    const isHide = lodash.toString(httpApiDebugRes.id).length <= 0 || lodash.toString(debugResponseData.status).length <= 0;
    return (
      <Tabs
        className={cls(styles.responseData, { [styles.hide]: isHide })}
        id={"RequestDebugPanel-RightPanel"}
        animate={false}
        renderActiveTabPanelOnly={false}
        vertical={false}
        selectedTabId={responseTab}
        onChange={newTabId => this.setState({ responseTab: (newTabId as any) })}
      >
        <Tab id={ResponseTabEnum.Body} title="Body" panel={this.getResponseBodyPanel()}/>
        <Tab id={ResponseTabEnum.Headers} title="Headers" panel={this.getResponseHeadersPanel()}/>
        <Tab id={ResponseTabEnum.Cookies} title="Cookies" panel={this.getResponseCookiesPanel()} disabled={true}/>
        <Tab id={ResponseTabEnum.ServerLogs} title="ServerLogs" panel={this.getServerLogsPanel()} className={styles.serverLogs}/>
        <Tabs.Expander/>
        <div className={cls(styles.httpStatus)}>
          <span className={cls(styles.httpStatusItem)}>
            Status:
            <span className={cls(styles.httpStatusValue)}>
              {
                debugResponseData.status ?
                  `${debugResponseData.status} ${debugResponseData.statusText}` :
                  "-"
              }
            </span>
          </span>
          <span className={cls(styles.httpStatusItem)}>
            Time:
            <span className={cls(styles.httpStatusValue)}>
              {
                hasValue(debugResponseData.time) ?
                  `${debugResponseData.time} ms` :
                  "-"
              }
            </span>
          </span>
          <span className={cls(styles.httpStatusItem)}>
            Size:
            <span className={cls(styles.httpStatusValue)}>
                 {
                   hasValue(debugResponseData.size) ?
                     bytesFormat(debugResponseData.size!) :
                     "-"
                 }
            </span>
          </span>
        </div>
      </Tabs>
    );
  }

  // 请求Params面板
  private getParamsPanel() {
    const { httpApiDebugRes: { requestData } } = this.state;
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <DynamicForm data={requestData?.params}/>
      </SimpleBar>
    );
  }

  // 请求Headers面板
  private getRequestHeadersPanel() {
    const { httpApiDebugRes: { requestData } } = this.state;
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <DynamicForm data={requestData?.headers}/>
      </SimpleBar>
    );
  }

  // 请求Body面板
  private getRequestBodyPanel() {
    const { requestBodyTab, httpApiDebugRes: { requestData } } = this.state;
    return (
      <>
        <RadioGroup
          className={cls(styles.requestBodyRadio)}
          inline={true}
          onChange={event => this.setState({ requestBodyTab: (event.currentTarget.value as any) })}
          selectedValue={requestBodyTab}
        >
          <Radio label="json-body" value={RequestBodyTabEnum.JsonBody}/>
          <Radio label="form-body" value={RequestBodyTabEnum.FormBody} disabled={true}/>
        </RadioGroup>
        <Editor
          wrapperClassName={cls(styles.requestEditor)}
          theme={themeEnum.IdeaDracula}
          loading={<Spinner intent={Intent.PRIMARY} size={SpinnerSize.STANDARD}/>}
          options={editorDefOptions}
          language={languageEnum.json}
          path={"/request_body.json"}
          value={requestData?.jsonBody}
          onChange={value => {
            if (!requestData) return;
            requestData.jsonBody = value;
          }}
          saveViewState={false}
          keepCurrentModel={false}
        />
      </>
    );
  }

  // 请求Cookies面板
  private getRequestCookiesPanel() {
    return (
      <>
        444
      </>
    );
  }

  // 响应Body面板
  private getResponseBodyPanel() {
    const { debugResponseData } = this.state;
    return (
      <Editor
        theme={themeEnum.IdeaDracula}
        loading={<Spinner intent={Intent.PRIMARY} size={SpinnerSize.STANDARD}/>}
        options={{ ...editorDefOptions, readOnly: true, domReadOnly: true }}
        language={languageEnum.json}
        path={"/response_body.json"}
        value={debugResponseData.body}
        saveViewState={false}
        keepCurrentModel={false}
      />
    );
  }

  // 响应Headers面板
  private getResponseHeadersPanel() {
    const { debugResponseData } = this.state;
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <DynamicForm readOnly={true} noCheckbox={true} noDescription={true} data={debugResponseData.headers}/>
      </SimpleBar>
    );
  }

  // 响应Cookies面板
  private getResponseCookiesPanel() {
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <DynamicForm readOnly={true} noCheckbox={true} noDescription={true}/>
      </SimpleBar>
    );
  }

  // ServerLogs面板
  private getServerLogsPanel() {
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <LogViewer
          ref={this.logViewer}
          maxLine={1000}
          follow={true}
          linkify={true}
        />
      </SimpleBar>
    );
  }

  render() {
    this.saveComponentState();
    const { hSplitSize } = this.state;
    return (
      <Split
        className={cls(styles.panel, styles.horizontalSplit, Classes.DARK)}
        direction={"horizontal"}
        sizes={hSplitSize}
        minSize={[128, 256, 256]}
        maxSize={[450, Infinity, Infinity]}
        snapOffset={20}
        dragInterval={1}
        gutterSize={0}
        cursor={"ew-resize"}
        elementStyle={(_, elementSize) => {
          return { width: `${elementSize}%` };
        }}
        onDragEnd={sizes => this.setState({ hSplitSize: sizes as any })}
        gutter={_ => {
          const element = document.createElement("div");
          element.className = cls(styles.horizontalSplitGutter, "gutter gutter-horizontal");
          return element;
        }}
      >
        <div className={cls(styles.leftPanel)}>
          {this.getLeftPanel()}
        </div>
        <div className={cls(styles.centerPanel)}>
          {this.getCenterPanel()}
        </div>
        <div className={cls(styles.rightPanel)}>
          {this.getRightPanel()}
        </div>
      </Split>
    );
  }
}

export type { RequestDebugPanelProps, RequestDebugPanelState };
export { RequestDebugPanel } ;
