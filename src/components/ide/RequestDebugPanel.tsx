import React from "react";
import cls from "classnames";
import lodash from "lodash";
import Split from "react-split";
import SimpleBar from "simplebar-react";
import Icon from "@ant-design/icons";
import { Button, Classes, InputGroup, Intent, Radio, RadioGroup, Spinner, SpinnerSize, Tab, Tabs } from "@blueprintjs/core";
import Editor from "@monaco-editor/react";
import { DynamicForm } from "@/components/DynamicForm";
import { editorDefOptions, languageEnum, themeEnum } from "@/utils/editor-utils";
import { Edit, Execute, MenuSaveAll } from "@/utils/IdeaIconUtils";
import { componentStateKey, fastApiStore } from "@/utils/storage";
import styles from "./RequestDebugPanel.module.less";
import { LogViewer } from "@/components/LogViewer";

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
}

// 读取组件状态
const storageState: Partial<RequestDebugPanelState> = await fastApiStore.getItem(componentStateKey.RequestDebugPanelState) ?? {};
// 组件状态默认值
const defaultState: RequestDebugPanelState = {
  hSplitSize: [15, 40, 45],
  requestTab: RequestTabEnum.Params,
  requestBodyTab: RequestBodyTabEnum.JsonBody,
  responseTab: ResponseTabEnum.Body,
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
    this.logViewer.current?.addLogLine("2021-07-04 16:32:38.862 [http-nio-18081-exec-5] DEBUG org.clever.graaljs.core.pool.GraalSingleEngineFactory - 初始化 ScriptContextInstance 全局变量 | counter=1")
    this.logViewer.current?.addLogLine("2021-07-04 16:32:38.874 [http-nio-18081-exec-5] DEBUG org.clever.graaljs.data.jdbc.support.SqlLoggerUtils - ==>  ExecuteSQL: select * from tb_merchandise limit :limit")
    this.logViewer.current?.addLogLine("2021-07-04 16:32:38.875 [http-nio-18081-exec-5] DEBUG org.clever.graaljs.data.jdbc.support.SqlLoggerUtils - ==>  Parameters: limit=1(Integer)")
    this.logViewer.current?.addLogLine("2021-07-04 16:32:38.886 [http-nio-18081-exec-5] DEBUG org.clever.graaljs.data.jdbc.support.SqlLoggerUtils - <==       Total: 1")
    this.logViewer.current?.addLogLine("2021-07-04 16:32:38.892 [http-nio-18081-exec-5] DEBUG org.clever.graaljs.spring.mvc.HttpInterceptorScriptHandler - Script处理请求 | [总]耗时:38ms | 查找脚本耗时:1ms | 执行脚本耗时:34ms | 序列化耗时:3ms | Script=[/test/02test.js]")
    this.logViewer.current?.addLogLine("\u001b[38;5;196mHello\u001b[39m \u001b[48;5;226mWorld\u001b[49m")
    this.logViewer.current?.addLogLine("\u001b[38;5;196mHello\u001b[39m \u001b[48;5;226mWorld\u001b[49m")
    this.logViewer.current?.addLogLine("\u001b[38;5;196mHello\u001b[39m \u001b[48;5;226mWorld\u001b[49m https://www.npmjs.com/package/anser")
    this.logViewer.current?.addLogLine("2021-07-04 14:17:41.404 [http-nio-18081-exec-4] DEBUG org.clever.graaljs.core.utils.tree.BuildTreeUtils - 1 耗时：0ms")
  }

  // 组件将要被卸载
  public componentWillUnmount() {
    this.saveState().finally();
  }

  /** 保存组件状态 */
  public async saveState(): Promise<void> {
    if (this.saveStateLock) return;
    const { hSplitSize } = this.state;
    await fastApiStore.setItem(
      componentStateKey.RequestDebugPanelState,
      { hSplitSize },
    ).finally(() => {
      this.saveStateLock = false;
    });
  }

  // 左边面板
  private getLeftPanel() {
    return (
      <>
        左
      </>
    );
  }

  // 中间面板
  private getCenterPanel() {
    const { requestTab } = this.state;
    return (
      <>
        <div className={cls(styles.requestTitle, styles.flexColumn)}>
          <div className={cls(styles.flexItemColumn, styles.requestTitleText)}>
            请求001
            <Icon className={cls(styles.editIcon)} component={Edit}/>
          </div>
          <div className={cls(styles.flexItemColumnWidthFull)}/>
          <Icon
            className={cls(styles.flexItemColumn, styles.icon)}
            component={MenuSaveAll}
          />
        </div>
        <div className={cls(styles.requestPath, styles.flexColumn)} style={{ alignItems: "center" }}>
          <select
            className={cls(styles.flexItemColumn)}
            // disabled={true}
            // value={requestMethod}
            // onChange={e => this.setState({ addHttpApiForm: { path, name, requestMapping, requestMethod: (e?.target?.value as any) } })}
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
            // readOnly={true}
            // disabled={true}
            // value={addHttpApiRequestMappingChanged ? requestMapping : defRequestMapping}
            // onChange={e => this.setState({ addHttpApiForm: { path, name, requestMapping: e.target.value, requestMethod }, addHttpApiRequestMappingChanged: true })}
          />
          <Button
            className={cls(styles.flexItemColumn)}
            intent={Intent.PRIMARY}
            icon={<Icon component={Execute} style={{ marginRight: 2 }}/>}
            // loading={true}
            // disabled={true}
          >
            <span style={{ marginRight: 4 }}>Send</span>
          </Button>
        </div>
        <Tabs
          className={cls(styles.requestArgs)}
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
    const { responseTab } = this.state;
    return (
      <Tabs
        className={cls(styles.responseData)}
        id={"RequestDebugPanel-RightPanel"}
        animate={false}
        renderActiveTabPanelOnly={false}
        vertical={false}
        selectedTabId={responseTab}
        onChange={newTabId => this.setState({ responseTab: (newTabId as any) })}
      >
        <Tab id={ResponseTabEnum.Body} title="Body" panel={this.getResponseBodyPanel()}/>
        <Tab id={ResponseTabEnum.Headers} title="Headers" panel={this.getResponseHeadersPanel()}/>
        <Tab id={ResponseTabEnum.Cookies} title="Cookies" panel={this.getResponseCookiesPanel()}/>
        <Tab id={ResponseTabEnum.ServerLogs} title="ServerLogs" panel={this.getServerLogsPanel()} className={styles.serverLogs}/>
        <Tabs.Expander/>
        <div className={cls(styles.httpStatus)}>
          <span className={cls(styles.httpStatusItem)}>
            Status:
            <span className={cls(styles.httpStatusValue)}>200 OK</span>
          </span>
          <span className={cls(styles.httpStatusItem)}>
            Time:
            <span className={cls(styles.httpStatusValue)}>93 ms</span>
          </span>
          <span className={cls(styles.httpStatusItem)}>
            Size:
            <span className={cls(styles.httpStatusValue)}>21.15 KB</span>
          </span>
        </div>
      </Tabs>
    );
  }

  // 请求Params面板
  private getParamsPanel() {
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <DynamicForm/>
      </SimpleBar>
    );
  }

  // 请求Headers面板
  private getRequestHeadersPanel() {
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <DynamicForm/>
      </SimpleBar>
    );
  }

  // 请求Body面板
  private getRequestBodyPanel() {
    const { requestBodyTab } = this.state;
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
    return (
      <>
        <Editor
          // wrapperClassName={cls(styles.requestEditor)}
          theme={themeEnum.IdeaDracula}
          loading={<Spinner intent={Intent.PRIMARY} size={SpinnerSize.STANDARD}/>}
          options={{ ...editorDefOptions, readOnly: true, domReadOnly: true }}
          language={languageEnum.json}
          path={"/response_body.json"}
          saveViewState={false}
          keepCurrentModel={false}
        />
      </>
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

  // 响应Headers面板
  private getResponseHeadersPanel() {
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
        style={{ height: "calc(100% - 24px)", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <LogViewer
          ref={this.logViewer}
          maxLine={1000}
          follow={true}
          linkify={true}
        />
        <div style={{ height: 8 }}/>
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
