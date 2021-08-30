import React from "react";
import cls from "classnames";
import lodash from "lodash";
import cookie from "cookie";
import Cookies from "js-cookie";
import Split from "react-split";
import SimpleBar from "simplebar-react";
import Icon from "@ant-design/icons";
import { Alert, Button, Classes, Dialog, FormGroup, InputGroup, Intent, Radio, RadioGroup, Spinner, SpinnerSize, Tab, Tabs } from "@blueprintjs/core";
import { Tooltip2 } from "@blueprintjs/popover2";
import * as MonacoApi from "monaco-editor/esm/vs/editor/editor.api";
import Editor from "@monaco-editor/react";
import { DynamicForm } from "@/components/DynamicForm";
import { LogViewer } from "@/components/LogViewer";
import { FastApi } from "@/apis";
import { doDebugRequest } from "@/utils/debug-request";
import { hasValue, noValue } from "@/utils/utils";
import { bytesFormat } from "@/utils/format";
import { request } from "@/utils/request";
import { editorDefOptions, initEditorConfig, initKeyBinding, languageEnum, themeEnum } from "@/utils/editor-utils";
import { Add, AddFile, Commit, Edit, Execute, HttpRequestsFiletype, MenuSaveAll, Refresh, Remove2 } from "@/utils/IdeaIconUtils";
import { componentStateKey, storeGetData, storeSaveData } from "@/utils/storage";
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
  ServerLogs = "ServerLogs",
}

interface AddHttpApiDebugForm {
  /** 标题 */
  title: string;
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
  /** 响应叶签 */
  responseTab: ResponseTabEnum;
  /** HTTP接口id */
  httpApiId?: string;
  /** HttpApiDebug Title 列表 */
  titleList: Array<HttpApiDebugTitleRes>;
  /** 数据加载状态 */
  titleListLoading: boolean;
  /** HttpApiDebug Data */
  httpApiDebug: HttpApiDebugRes;
  /** HttpApiDebug数据加载状态 */
  httpApiDebugLoading: boolean;
  /** Debug Response Data */
  debugResponseData: DebugResponseData;
  /** debug请求状态 */
  debugLoading: boolean;
  /** 显示新增对话框 */
  showAddDialog: boolean;
  /** 新增表单数据 */
  addForm: AddHttpApiDebugForm;
  /** 新增Loading: */
  addLoading: boolean;
  /** 删除数据对话框 */
  showDeleteDialog: boolean;
  /** 删除数据Loading */
  deleteLoading: boolean;
  /** 显示更新输入框 */
  showUpdateInput: boolean;
  /** 需要更新httpApiDebug */
  needUpdate: boolean;
  /** 更新数据Loading */
  updateLoading: boolean;
}

// 组件状态默认值
const defHttpApiDebug = (): HttpApiDebugRes => ({
  id: "", namespace: "", httpApiId: "", title: "",
  requestData: { method: "GET", path: "", params: [], headers: [], bodyType: "None", jsonBody: "", formBody: [] },
  createAt: "", updateAt: ""
});
const defDebugResponseData = (): DebugResponseData => ({ body: "", headers: [] });
const defaultState: RequestDebugPanelState = {
  hSplitSize: [15, 40, 45],
  requestTab: RequestTabEnum.Params,
  responseTab: ResponseTabEnum.Body,
  titleList: [],
  titleListLoading: false,
  httpApiDebug: { ...defHttpApiDebug() },
  httpApiDebugLoading: false,
  debugResponseData: { ...defDebugResponseData() },
  debugLoading: false,
  showAddDialog: false,
  addForm: { title: "" },
  addLoading: false,
  showDeleteDialog: false,
  deleteLoading: false,
  showUpdateInput: false,
  needUpdate: false,
  updateLoading: false,
}

class RequestDebugPanel extends React.Component<RequestDebugPanelProps, RequestDebugPanelState> {
  /** 执行组件状态的全局锁 */
  private saveStateLock: boolean = false;
  /** 保存组件的状态 */
  private saveComponentState = lodash.debounce(() => this.saveState().finally(), 1_000, { maxWait: 3_000 });
  /** 显示日志组件 */
  private logViewer = React.createRef<LogViewer>();
  /** 设置请求RequestData JsonBody */
  private setRequestDataJsonBody = lodash.debounce((value: string) => {
    const { httpApiDebug: { requestData } } = this.state;
    requestData.jsonBody = value;
    this.setNeedUpdate();
  }, 50, { maxWait: 500 });
  /** 设置需要更新标识 */
  private setNeedUpdate = lodash.debounce(() => this.setState({ needUpdate: true }), 50, { maxWait: 500 });

  constructor(props: RequestDebugPanelProps) {
    super(props);
    this.state = { ...defaultState, ...storeGetData(componentStateKey.RequestDebugPanelState) };
  }

  // 组件挂载后
  public componentDidMount() {
    this.reLoadData();
  }

  // 组件更新成功
  public componentDidUpdate(prevProps: Readonly<RequestDebugPanelProps>, prevState: Readonly<RequestDebugPanelState>, snapshot?: any) {
    if (prevProps.httpApiId !== this.props.httpApiId) this.reLoadData();
  }

  // 组件将要被卸载
  public componentWillUnmount() {
    this.saveState().finally();
  }

  /** 保存组件状态 */
  public async saveState(): Promise<void> {
    if (this.saveStateLock) return;
    const { hSplitSize, requestTab, responseTab } = this.state;
    await storeSaveData(
      componentStateKey.RequestDebugPanelState,
      { hSplitSize, requestTab, responseTab },
    ).finally(() => {
      this.saveStateLock = false;
    });
  }

  /** 重新加载数据 */
  public reLoadData(spin: boolean = true, httpApiId?: string, force?: boolean) {
    const { httpApiId: httpApiIdProps } = this.props;
    const { httpApiId: httpApiIdState, httpApiDebug } = this.state;
    if (!httpApiId) {
      if (!force && httpApiIdProps === httpApiIdState) return;
      httpApiId = httpApiIdProps;
    }
    if (!httpApiId) {
      this.setState({ httpApiId, titleList: [], httpApiDebug: { ...defHttpApiDebug() } });
      return;
    }
    if (spin) this.setState({ titleListLoading: true });
    request.get(FastApi.HttpApiDebugManage.getTitleList, { params: { httpApiId } })
      .then((data: Array<HttpApiDebugTitleRes>) => {
        const newState: Partial<RequestDebugPanelState> = { httpApiId, titleList: data };
        if (!httpApiDebug || !data.map(item => item.id).includes(httpApiDebug.id)) {
          newState.httpApiDebug = { ...defHttpApiDebug() };
        }
        this.setState(newState as any);
      }).finally(() => {
      if (spin) this.setState({ titleListLoading: false });
    });
  }

  // 加载HttpApiDebug数据
  private loadHttpApiDebugRes(id: string) {
    if (!id) return;
    const { httpApiDebug } = this.state;
    this.setState({ httpApiDebugLoading: true, httpApiDebug: { ...httpApiDebug, id } });
    request.get(FastApi.HttpApiDebugManage.getHttpApiDebug, { params: { id } })
      .then((data: HttpApiDebugRes) => {
        if (data) {
          this.setState({ httpApiDebug: { ...defHttpApiDebug(), ...data }, debugResponseData: { ...defDebugResponseData() }, needUpdate: false });
        } else {
          this.setState({ httpApiDebug: { ...defHttpApiDebug() }, debugResponseData: { ...defDebugResponseData() }, needUpdate: false });
        }
      }).finally(() => this.setState({ httpApiDebugLoading: false }));
  }

  // 调试接口
  private doDebug() {
    const { httpApiDebug: { requestData }, debugResponseData } = this.state;
    this.setState({ debugLoading: true });
    doDebugRequest(requestData, debugResponseData)
      .then(() => {
        // 服务端日志
        const logViewer = this.logViewer.current;
        if (logViewer && debugResponseData.logs && debugResponseData.logs.content && debugResponseData.logs.content.length > 0) {
          logViewer.clear(debugResponseData.logs.firstIndex);
          debugResponseData.logs.content.forEach(log => logViewer.addLogLine(log));
          logViewer.addLogLine("\n\n\n");
        } else if (logViewer) {
          logViewer.clear();
        }
        this.forceUpdate();
      }).finally(() => this.setState({ debugLoading: false }));
  }

  // 删除调试数据
  private delHttpApiDebug() {
    const { httpApiDebug } = this.state;
    this.setState({ deleteLoading: true });

    request.delete(FastApi.HttpApiDebugManage.delHttpApiDebug, { params: { id: httpApiDebug.id } })
      .then(() => this.setState({
          showDeleteDialog: false,
          httpApiDebug: { ...defHttpApiDebug() },
          debugResponseData: { ...defDebugResponseData() },
        }, () => this.reLoadData(false, undefined, true)
      )).finally(() => this.setState({ deleteLoading: false }));
  }

  // 新增调试数据
  private addHttpApiDebug() {
    const { httpApiId } = this.props;
    const { addForm: { title } } = this.state;
    this.setState({ addLoading: true });
    request.post(FastApi.HttpApiDebugManage.addHttpApiDebug, { httpApiId, title })
      .then(() => this.setState({
          showAddDialog: false,
        }, () => this.reLoadData(false, undefined, true)
      )).finally(() => this.setState({ addLoading: false }));
  }

  // 更新调试数据
  private updateHttpApiDebug() {
    const { httpApiDebug, titleList, updateLoading } = this.state;
    if (updateLoading) return;
    const { id, title, requestData } = httpApiDebug;
    this.setState({ updateLoading: true });
    request.put(FastApi.HttpApiDebugManage.updateHttpApiDebug, { id, title, requestData })
      .then((data: HttpApiDebug) => {
        titleList.forEach(title => {
          if (title.id === data.id) {
            title.title = data.title;
          }
        });
        this.setState({ needUpdate: false, showUpdateInput: false, });
      }).finally(() => this.setState({ updateLoading: false }));
  }

  // 左边面板
  private getLeftPanel() {
    const { httpApiId } = this.props;
    const { titleList, titleListLoading, httpApiDebug } = this.state;
    const delDisable = lodash.toString(httpApiDebug?.id).length <= 0;
    const addDisable = noValue(httpApiId);
    return (
      <>
        <div className={cls(styles.flexColumn, styles.leftPanelTools)}>
          <div className={cls(styles.flexItemColumnWidthFull)}/>
          <Icon
            component={Remove2}
            className={cls(styles.flexItemColumn, styles.icon, { [styles.iconDisable]: delDisable })}
            onClick={() => {
              if (delDisable) return;
              this.setState({ showDeleteDialog: true });
            }}
          />
          <Icon
            component={Add}
            className={cls(styles.flexItemColumn, styles.icon, { [styles.iconDisable]: addDisable })}
            onClick={() => {
              if (addDisable) return;
              this.setState({ showAddDialog: true, addForm: { title: "" } });
            }}
          />
          <Icon
            className={cls(styles.flexItemColumn, styles.icon, { [styles.iconDisable]: addDisable })}
            component={Refresh}
            onClick={() => {
              if (addDisable) return;
              this.reLoadData(true, undefined, true);
            }}
          />
        </div>
        <SimpleBar
          className={cls(styles.leftPanelList)}
          style={{ width: "100%" }}
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
                  { [styles.leftPanelListItemSelected]: httpApiDebug.id === title.id },
                )}
              >
                <Icon component={HttpRequestsFiletype} className={cls(styles.flexItemColumn, styles.leftPanelListItemIcon)}/>
                <div
                  className={cls(styles.flexItemColumnWidthFull, styles.leftPanelListItemText)}
                  onClick={() => {
                    if (httpApiDebug.id === title.id) return;
                    this.loadHttpApiDebugRes(title.id);
                  }}
                >
                  {title.title}
                </div>
              </div>
            ))
          }
        </SimpleBar>
      </>
    );
  }

  // 中间面板
  private getCenterPanel() {
    const { requestTab, httpApiDebug, debugLoading, showUpdateInput, needUpdate, updateLoading } = this.state;
    const isHide = lodash.toString(httpApiDebug.id).length <= 0;
    return (
      <>
        <div className={cls(styles.requestTitle, styles.flexColumn, { [styles.hide]: isHide })}>
          {
            !showUpdateInput &&
            <div className={cls(styles.flexItemColumn, styles.requestTitleText, { [styles.requestTitleTextNeedUpdate]: needUpdate })}>
              {httpApiDebug?.title ?? "undefined"}
              <Icon
                className={cls(styles.editIcon)}
                component={Edit}
                onClick={() => this.setState({ showUpdateInput: true })}
              />
            </div>
          }
          {
            !showUpdateInput &&
            <div className={cls(styles.flexItemColumnWidthFull)}/>
          }
          {
            showUpdateInput &&
            <InputGroup
              className={cls(styles.flexItemColumnWidthFull, styles.requestTitleInput)}
              type={"text"}
              small={true}
              rightElement={(
                <Tooltip2 className={cls(styles.requestTitleBut)} disabled={true}>
                  <Button
                    icon={<Icon component={Commit}/>}
                    intent={Intent.NONE}
                    minimal={true}
                    onClick={() => this.setState({ showUpdateInput: false })}
                  />
                </Tooltip2>
              )}
              placeholder="新名称"
              value={httpApiDebug?.title ?? ""}
              onChange={e => {
                httpApiDebug.title = e.target.value;
                this.setNeedUpdate();
              }}
            />
          }
          <div className={cls(styles.flexItemColumn)} style={{ width: 43 }}/>
          <Icon
            className={cls(styles.flexItemColumn, styles.icon, { [styles.iconDisable]: !needUpdate }, { [styles.iconActive]: updateLoading })}
            component={MenuSaveAll}
            onClick={() => {
              if (updateLoading || !needUpdate) return;
              this.updateHttpApiDebug();
            }}
          />
        </div>
        <div className={cls(styles.requestPath, styles.flexColumn, { [styles.hide]: isHide })}>
          <select
            className={cls(styles.flexItemColumn)}
            disabled={debugLoading}
            value={httpApiDebug?.requestData?.method ?? "GET"}
            onChange={e => {
              if (!httpApiDebug?.requestData) return;
              httpApiDebug.requestData.method = e.target.value as any;
              this.setState({ needUpdate: true });
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
            value={httpApiDebug?.requestData?.path}
            onChange={e => {
              if (!httpApiDebug?.requestData) return;
              httpApiDebug.requestData.path = e.target.value;
              this.setState({ needUpdate: true });
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
          <Tab id={RequestTabEnum.Cookies} title="Cookies" panel={this.getRequestCookiesPanel()}/>
          <Tab id={RequestTabEnum.CURL} title="CURL" panel={this.getCURL()} disabled={true}/>
        </Tabs>
      </>
    );
  }

  // 右边面板
  private getRightPanel() {
    const { responseTab, httpApiDebug, debugResponseData } = this.state;
    const isHide = lodash.toString(httpApiDebug.id).length <= 0 || lodash.toString(debugResponseData.status).length <= 0;
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
    const { httpApiDebug: { requestData } } = this.state;
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <DynamicForm data={requestData?.params} onChange={() => this.setNeedUpdate()}/>
      </SimpleBar>
    );
  }

  // 请求Headers面板
  private getRequestHeadersPanel() {
    const { httpApiDebug: { requestData } } = this.state;
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <DynamicForm data={requestData?.headers} onChange={() => this.setNeedUpdate()}/>
      </SimpleBar>
    );
  }

  // 请求Body面板
  private getRequestBodyPanel() {
    const { httpApiDebug: { requestData } } = this.state;
    return (
      <>
        <RadioGroup
          className={cls(styles.requestBodyRadio)}
          inline={true}
          onChange={event => {
            requestData.bodyType = event.currentTarget.value as any;
            this.setState({ needUpdate: true });
          }}
          selectedValue={requestData.bodyType}
        >
          <Radio label="none" value={"None"}/>
          <Radio label="json-body" value={"JsonBody"}/>
          <Radio label="form-body" value={"FormBody"} disabled={true}/>
        </RadioGroup>
        {
          requestData.bodyType === "JsonBody" &&
          <Editor
            wrapperClassName={cls(styles.requestEditor)}
            theme={themeEnum.IdeaDracula}
            loading={<Spinner intent={Intent.PRIMARY} size={SpinnerSize.STANDARD}/>}
            options={{ ...editorDefOptions, contextmenu: false }}
            language={languageEnum.json}
            path={"/request_body.json"}
            value={requestData?.jsonBody}
            onMount={(editor, monaco) => {
              initEditorConfig(editor);
              initKeyBinding(editor, monaco);
              editor.addCommand(
                MonacoApi.KeyMod.CtrlCmd | MonacoApi.KeyCode.KEY_S,
                () => {
                  if (this.state.needUpdate) {
                    this.updateHttpApiDebug();
                  }
                },
              );
            }}
            onChange={value => {
              if (!requestData) return;
              this.setRequestDataJsonBody(value ?? "");
            }}
            saveViewState={false}
            keepCurrentModel={false}
          />
        }
      </>
    );
  }

  // 请求Cookies面板
  private getRequestCookiesPanel() {
    const cookies = cookie.parse(document.cookie);
    const data: Array<RequestItemData> = [];
    lodash(cookies).forEach((value: string, key: string) => data.push({ key, value }));
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <DynamicForm
          readOnly={true}
          canDeleted={true}
          noCheckbox={true}
          noDescription={true}
          data={data}
          onDelete={item => Cookies.remove(item.key)}
        />
      </SimpleBar>
    );
  }

  // 请求CURL命令行
  private getCURL() {
    return <div/>;
  }

  // 响应Body面板
  private getResponseBodyPanel() {
    const { debugResponseData } = this.state;
    let contentType = "application/json";
    debugResponseData?.headers?.forEach(item => {
      if (item.key === "content-type") contentType = item.value;
    });
    if (contentType.indexOf("xml") >= 0) {
      return (
        <Editor
          theme={themeEnum.IdeaDracula}
          loading={<Spinner intent={Intent.PRIMARY} size={SpinnerSize.STANDARD}/>}
          options={{ ...editorDefOptions, readOnly: true, domReadOnly: true, contextmenu: false }}
          language={languageEnum.xml}
          path={"/response_body.xml"}
          value={debugResponseData.body}
          saveViewState={false}
          keepCurrentModel={false}
        />
      );
    } else if (contentType.indexOf("png") >= 0) {
      return <img src={`data:image/png;base64,${debugResponseData.body}`} alt="img" style={{ width: 358 }}/>;
    }
    return (
      <Editor
        theme={themeEnum.IdeaDracula}
        loading={<Spinner intent={Intent.PRIMARY} size={SpinnerSize.STANDARD}/>}
        options={{ ...editorDefOptions, readOnly: true, domReadOnly: true, contextmenu: false }}
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

  private getDeleteDialog() {
    const { httpApiDebug, showDeleteDialog, deleteLoading } = this.state;
    return (
      <Alert
        icon={"trash"}
        intent={Intent.DANGER}
        cancelButtonText={"取消"}
        confirmButtonText={"删除"}
        canEscapeKeyCancel={!deleteLoading}
        canOutsideClickCancel={!deleteLoading}
        transitionDuration={0.1}
        isOpen={showDeleteDialog && hasValue(httpApiDebug?.id)}
        loading={deleteLoading}
        onCancel={() => this.setState({ showDeleteDialog: false })}
        onConfirm={() => this.delHttpApiDebug()}
      >
        <p>
          确认删除调试数据: <br/>
          {httpApiDebug.title}？
        </p>
      </Alert>
    );
  }

  private getAddDialog() {
    const { showAddDialog, addForm: { title }, addLoading } = this.state;
    return (
      <Dialog
        className={cls(Classes.DARK, styles.dialog, styles.addHttpApiDialog)}
        style={{ width: 350 }}
        lazy={true}
        icon={<Icon component={AddFile} className={cls(styles.menuIcon)} style={{ marginRight: 8 }}/>}
        title={"新增调试数据"}
        transitionDuration={0.1}
        usePortal={true}
        isCloseButtonShown={!addLoading}
        canEscapeKeyClose={!addLoading}
        canOutsideClickClose={false}
        autoFocus={true}
        enforceFocus={true}
        isOpen={showAddDialog}
        onClose={() => this.setState({ showAddDialog: false })}
      >
        <FormGroup style={{ marginTop: 12 }} inline={true} label={"名称"}>
          <InputGroup
            type={"text"}
            placeholder={"输入名称"}
            disabled={addLoading}
            autoFocus={true}
            value={title}
            onChange={e => this.setState({ addForm: { title: e.target.value } })}
          />
        </FormGroup>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={() => this.setState({ showAddDialog: false })} disabled={addLoading}>取消</Button>
            <Button intent={Intent.PRIMARY} onClick={() => this.addHttpApiDebug()} loading={addLoading}>确认</Button>
          </div>
        </div>
      </Dialog>
    );
  }

  render() {
    this.saveComponentState();
    const { hSplitSize, httpApiDebug, needUpdate } = this.state;
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
        <div
          className={cls(styles.centerPanel)}
          onKeyDown={e => {
            let preventDefault = false;
            if (e.ctrlKey && e.key.toUpperCase() === "S") {
              preventDefault = true;
              const isHide = lodash.toString(httpApiDebug.id).length <= 0;
              if (!isHide && needUpdate) this.updateHttpApiDebug();
            }
            if (preventDefault) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
        >
          {this.getCenterPanel()}
        </div>
        <div className={cls(styles.rightPanel)}>
          {this.getRightPanel()}
        </div>
        {this.getDeleteDialog()}
        {this.getAddDialog()}
      </Split>
    );
  }
}

export type { RequestDebugPanelProps, RequestDebugPanelState };
export { RequestDebugPanel };
