// noinspection DuplicatedCode

import React from "react";
import cls from "classnames";
import lodash from "lodash";
import Split from "react-split";
import Icon, {
  ApiOutlined,
  CloseOutlined,
  ControlOutlined,
  FolderFilled,
  GithubOutlined,
  MinusOutlined,
  QqOutlined,
  QuestionCircleOutlined,
  WechatOutlined
} from "@ant-design/icons";
import { Alert, Intent, ProgressBar, Spinner, SpinnerSize } from "@blueprintjs/core";
import * as MonacoApi from "monaco-editor/esm/vs/editor/editor.api";
import Editor from "@monaco-editor/react";
import IconFont from "@/components/IconFont";
import logo from "@/assets/logo.svg";
import { FastApi } from "@/apis";
import {
  EngineInstancePanel,
  ExtendResourcePanel,
  GlobalConfigPanel,
  HttpApiResourcePanel,
  InterfaceConfigPanel,
  JdbcDatabaseManagePanel,
  RedisManagePanel,
  RequestDebugPanel,
  TaskResourcePanel,
  TopStatusPanel,
} from "@/components/ide";
import { hasValue, noValue } from "@/utils/utils";
import { request } from "@/utils/request";
import { componentStateKey, storeGetData, storeSaveData } from "@/utils/storage";
import { ChevronDown, ChevronUp, Debugger, getFileIcon, NoEvents, OpenTerminal } from "@/utils/IdeaIconUtils";
import { editorDefOptions, getLanguage, initEditorConfig, initKeyBinding, themeEnum } from "@/utils/editor-utils";
import {
  BottomPanelEnum,
  EditorTabItem,
  EditorTabsState,
  LayoutSize,
  LeftPanelEnum,
  RightPanelEnum,
  TopStatusFileInfo,
  toTopStatusFileInfo,
  transformEditorTabItem2TopStatusFileInfo,
  WorkbenchLoading
} from "@/types/workbench-layout";
import wechat from "/wechat.png";
import styles from "./Workbench.module.less";

interface WorkbenchProps {
}

interface WorkbenchState extends WorkbenchLoading, LayoutSize, EditorTabsState {
  /** 全局环境变量 */
  globalEnv: FastApiGlobalEnv;
  /** HttpApiTree当前选中的节点 */
  topStatusFileInfo?: TopStatusFileInfo;
  /** 显示微信二维码 */
  wechatQRCode: boolean;
}

// 读取组件状态
const initStorageState = (): Promise<any[]> => {
  const storageState: WorkbenchState = storeGetData(componentStateKey.Workbench);
  const all: Array<Promise<any>> = [];
  if (storageState.openFileMap && storageState.openFileMap.size > 0) {
    const files = [...storageState.openFileMap.values()];
    files.forEach(file => {
      if (file.fileResource.module === 3 && file.httpApi) {
        all.push(
          request
            .get(FastApi.HttpApiManage.getHttpApiFileResource, { params: { httpApiId: file.httpApi.id } })
            .then((data: HttpApiFileResourceRes) => {
              // if (!file.needSave || (file.needSave && file.fileResource.content === data.fileResource.content)) {}
              file.fileResource = data.fileResource;
              file.rawContent = data.fileResource.content;
              file.needSave = false;
              file.httpApi = data.httpApi;
            }).finally()
        );
      } else {
        all.push(
          request
            .get(FastApi.FileResourceManage.getFileResource, { params: { id: file.fileResource.id } })
            .then((data: FileResource) => {
              // if (!file.needSave || (file.needSave && file.fileResource.content === data.content)) {}
              file.fileResource = data;
              file.rawContent = data.content;
              file.needSave = false;
            }).finally()
        );
      }
    });
  }
  return Promise.all(all).finally();
};

// 组件状态默认值
const getDefaultState = (): WorkbenchState => ({
  globalEnv: { version: "", namespace: "", apiPrefix: "" },
  wechatQRCode: false,
  // WorkbenchLoading
  getApiFileResourceLoading: false,
  saveFileResourceLoading: false,
  getFileResourceLoading: false,
  // LayoutSize
  bottomPanel: BottomPanelEnum.GlobalConfig,
  vSplitSize: [80, 20],
  vSplitCollapsedSize: [80, 20],
  leftPanel: LeftPanelEnum.HttpApi,
  rightPanel: RightPanelEnum.JDBC,
  hSplitSize: [15, 75, 10],
  hSplitCollapsedSize: [15, 75, 10],
  // EditorTabsState
  openFileMap: new Map<string, EditorTabItem>(),
});

class Workbench extends React.Component<WorkbenchProps, WorkbenchState> {
  /** HTTP API组件 */
  private httpApiResourcePane = React.createRef<HttpApiResourcePanel>();
  /** 定时任务组件 */
  private taskResourcePanel = React.createRef<TaskResourcePanel>();
  /** 自定义扩展组件 */
  private extendResourcePane = React.createRef<ExtendResourcePanel>();
  /** 接口调试组件 */
  private requestDebugPane = React.createRef<RequestDebugPanel>();
  /** 全局请求参数组件 */
  private globalConfigPanel = React.createRef<GlobalConfigPanel>();
  /** 执行保存整个应用状态的全局锁 */
  private saveAppStateLock: boolean = false;
  /** 保存整个应用的状态 */
  private saveAppState = lodash.debounce(() => {
    if (this.saveAppStateLock) return;
    console.log("保存整个应用的状态"); // TODO UI提示
    this.saveAppStateLock = true;
    Promise.all([
      this.saveState(),
      this.httpApiResourcePane.current?.saveState(),
      this.extendResourcePane.current?.saveState(),
      this.requestDebugPane.current?.saveState(),
      this.globalConfigPanel.current?.saveState(),
    ]).finally(() => {
      this.saveAppStateLock = false;
    });
  }, 1_500, { maxWait: 6_000 });
  // /** 页面重新加载之前 */
  // private pageBeforeunload = (event: BeforeUnloadEvent) => {
  //   debugger
  //   event.preventDefault();
  //   this.saveAppState();
  //   event.returnValue = "";
  // };
  /** 编辑器实例 */
  private editor: MonacoApi.editor.IStandaloneCodeEditor | undefined;
  /** 编辑器大小自适应 */
  private editorResize = lodash.debounce(() => this.editor?.layout(), 500, { maxWait: 3000 });
  /** 保存当前编辑的文件 */
  private saveCurrentEditFile = lodash.debounce((changed: boolean, openFile: EditorTabItem, editorValue?: string) => {
    if (!this.editor) return; // TODO 错误提示
    openFile.fileResource.content = editorValue ?? "";
    if (openFile.needSave !== changed) {
      openFile.needSave = changed;
      this.forceUpdate();
    }
  }, 50, { maxWait: 500 });
  /** 更新TopStatusFileInfo */
  private setTopStatusFileInfo = () => {
    const { currentEditId, openFileMap, topStatusFileInfo } = this.state;
    const openFile = openFileMap.get(currentEditId ?? "");
    if (!openFile) return;
    if (topStatusFileInfo && openFile.fileResource.id === topStatusFileInfo.fileResourceId) return;
    this.setState({ topStatusFileInfo: transformEditorTabItem2TopStatusFileInfo(openFile) });
  };
  /** 保存文件到服务器 */
  private saveFileResource = lodash.debounce((file: EditorTabItem) => {
    this.setState({ saveFileResourceLoading: true });
    request.put(FastApi.FileResourceManage.saveFileContent, { id: file.fileResource.id, content: file.fileResource.content })
      .then((fileResource: FileResource) => {
        file.needSave = false;
        file.rawContent = fileResource.content;
        this.forceUpdate();
      }).finally(() => this.setState({ saveFileResourceLoading: false }));
  }, 150, { maxWait: 1000 });
  /** 显示当前编辑的文件Tab叶签 */
  private showCurrentEditFileTab = (currentEditId: string) => {
    const div = document.getElementById(`fileTab#${currentEditId}`);
    if (div) div.scrollIntoView();
  };
  /** 全局快捷键 */
  private hotkeys: ((e: KeyboardEvent) => void) = e => {
    let preventDefault = false;
    if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === "C") {
      // Ctrl + Shift + C  -> 接口配置面板切换
      preventDefault = true;
      this.toggleBottomPanel(BottomPanelEnum.Interface);
    } else if ((e.ctrlKey && e.shiftKey && e.key.toUpperCase() === "D") || (e.ctrlKey && e.key.toUpperCase() === "J")) {
      // Ctrl + Shift + D  -> 接口调试面板切换
      // Ctrl + J          -> 接口调试面板切换
      preventDefault = true;
      this.toggleBottomPanel(BottomPanelEnum.RequestDebug);
    } else if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === "S") {
      // Ctrl + Shift + S  -> 服务端日志面板切换
      preventDefault = true;
      this.toggleBottomPanel(BottomPanelEnum.ServerLogs);
    } else if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === "G") {
      // Ctrl + Shift + G  -> 全局请求参数面板切换
      preventDefault = true;
      this.toggleBottomPanel(BottomPanelEnum.GlobalConfig);
    } else if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === "E") {
      // Ctrl + Shift + E  -> 系统日志面板切换
      preventDefault = true;
      this.toggleBottomPanel(BottomPanelEnum.SysEvent);
    }
    // 警用浏览器默认行为
    if (preventDefault) e.preventDefault();
  };

  constructor(props: Readonly<WorkbenchProps>) {
    super(props);
    this.state = { ...getDefaultState(), ...storeGetData(componentStateKey.Workbench) };
  }

  // 组件挂载后
  public componentDidMount() {
    // window.addEventListener("beforeunload", this.pageBeforeunload);
    window.addEventListener("resize", this.editorResize);
    window.addEventListener("keydown", this.hotkeys);
    initStorageState().then(() => this.forceUpdate());
    request.get(FastApi.Global.getGlobalEnv)
      .then(data => {
        if (!data) return;
        this.setState({ globalEnv: data });
      }).finally();
  }

  // 组件将要被卸载
  public componentWillUnmount() {
    window.removeEventListener("resize", this.editorResize);
    window.removeEventListener("keydown", this.hotkeys);
    // window.removeEventListener("beforeunload", this.pageBeforeunload);
    this.saveState().finally();
  }

  /** 保存组件状态 */
  public async saveState(): Promise<void> {
    // FastApiGlobalEnv
    const { globalEnv } = this.state;
    // LayoutSize
    const { bottomPanel, vSplitSize, vSplitCollapsedSize, leftPanel, rightPanel, hSplitSize, hSplitCollapsedSize } = this.state;
    // TopStatusFileInfo
    const { topStatusFileInfo } = this.state;
    // EditorTabsState
    const { currentEditId, openFileMap } = this.state;
    await storeSaveData(
      componentStateKey.Workbench,
      {
        globalEnv,
        bottomPanel, vSplitSize, vSplitCollapsedSize, leftPanel, rightPanel, hSplitSize, hSplitCollapsedSize,
        topStatusFileInfo,
        currentEditId, openFileMap,
      },
    );
  }

  /** 切换底部布局区域隐藏/显示 */
  public toggleBottomPanel(panel?: BottomPanelEnum) {
    const { bottomPanel, vSplitSize, vSplitCollapsedSize } = this.state;
    let newBottomPanel: BottomPanelEnum | undefined;
    if (panel === BottomPanelEnum.Interface) {
      newBottomPanel = (bottomPanel === BottomPanelEnum.Interface ? undefined : BottomPanelEnum.Interface);
    } else if (panel === BottomPanelEnum.RequestDebug) {
      newBottomPanel = (bottomPanel === BottomPanelEnum.RequestDebug ? undefined : BottomPanelEnum.RequestDebug);
    } else if (panel === BottomPanelEnum.ServerLogs) {
      newBottomPanel = (bottomPanel === BottomPanelEnum.ServerLogs ? undefined : BottomPanelEnum.ServerLogs);
    } else if (panel === BottomPanelEnum.GlobalConfig) {
      newBottomPanel = (bottomPanel === BottomPanelEnum.GlobalConfig ? undefined : BottomPanelEnum.GlobalConfig);
    } else if (panel === BottomPanelEnum.SysEvent) {
      newBottomPanel = (bottomPanel === BottomPanelEnum.SysEvent ? undefined : BottomPanelEnum.SysEvent);
    }
    if (hasValue(newBottomPanel)) {
      vSplitCollapsedSize[1] = vSplitSize[1];
    } else {
      vSplitCollapsedSize[1] = 0;
    }
    vSplitCollapsedSize[0] = 100 - vSplitCollapsedSize[1];
    this.setState({ bottomPanel: newBottomPanel, vSplitCollapsedSize });
  }

  /** 切换左侧布局区域隐藏/显示 */
  public toggleLeftPanel(panel?: LeftPanelEnum) {
    const { leftPanel, rightPanel } = this.state;
    let newLeftPanel: LeftPanelEnum | undefined;
    if (panel === LeftPanelEnum.ResourceFile) {
      newLeftPanel = (leftPanel === LeftPanelEnum.ResourceFile ? undefined : LeftPanelEnum.ResourceFile);
    } else if (panel === LeftPanelEnum.HttpApi) {
      newLeftPanel = (leftPanel === LeftPanelEnum.HttpApi ? undefined : LeftPanelEnum.HttpApi);
    } else if (panel === LeftPanelEnum.TimedTask) {
      newLeftPanel = (leftPanel === LeftPanelEnum.TimedTask ? undefined : LeftPanelEnum.TimedTask);
    } else if (panel === LeftPanelEnum.Extend) {
      newLeftPanel = (leftPanel === LeftPanelEnum.Extend ? undefined : LeftPanelEnum.Extend);
    } else if (panel === LeftPanelEnum.Initialization) {
      newLeftPanel = (leftPanel === LeftPanelEnum.Initialization ? undefined : LeftPanelEnum.Initialization);
    }
    const hSplitCollapsedSize = this.calculateHSplitCollapsedSize(newLeftPanel, rightPanel);
    this.setState({ leftPanel: newLeftPanel, hSplitCollapsedSize });
  }

  /** 切换右侧布局区域隐藏/显示 */
  public toggleRightPanel(panel?: RightPanelEnum) {
    const { leftPanel, rightPanel } = this.state;
    let newRightPanel: RightPanelEnum | undefined;
    if (panel === RightPanelEnum.JDBC) {
      newRightPanel = (rightPanel === RightPanelEnum.JDBC ? undefined : RightPanelEnum.JDBC);
    } else if (panel === RightPanelEnum.Redis) {
      newRightPanel = (rightPanel === RightPanelEnum.Redis ? undefined : RightPanelEnum.Redis);
    } else if (panel === RightPanelEnum.Elasticsearch) {
      newRightPanel = (rightPanel === RightPanelEnum.Elasticsearch ? undefined : RightPanelEnum.Elasticsearch);
    }
    const hSplitCollapsedSize = this.calculateHSplitCollapsedSize(leftPanel, newRightPanel);
    this.setState({ rightPanel: newRightPanel, hSplitCollapsedSize });
  }

  /** 设置当前编辑器编辑的HttpApi文件 */
  public setCurrentEditHttpApiFile(fileResourceId?: string, httpApiId?: string) {
    if (!fileResourceId) return;
    const { currentEditId, openFileMap } = this.state;
    const openFile = openFileMap.get(fileResourceId);
    if (openFile) {
      if (currentEditId === fileResourceId) {
        this.showCurrentEditFileTab(currentEditId);
        return;
      }
      openFile.lastEditTime = lodash.now();
      this.setState(
        { currentEditId: fileResourceId, topStatusFileInfo: transformEditorTabItem2TopStatusFileInfo(openFile) },
        () => this.showCurrentEditFileTab(fileResourceId),
      );
      return;
    }
    if (!httpApiId) return;
    this.setState({ getApiFileResourceLoading: true });
    request.get(FastApi.HttpApiManage.getHttpApiFileResource, { params: { httpApiId } })
      .then((data: HttpApiFileResourceRes) => {
        if (!data || !data.fileResource || !data.httpApi) return;
        const fileResource: FileResource = data.fileResource;
        const httpApi: HttpApi = data.httpApi;
        const sort = openFileMap.size + 1;
        const openFile: EditorTabItem = { sort, lastEditTime: lodash.now(), fileResource, rawContent: fileResource.content, needSave: false, httpApi };
        openFileMap.set(fileResource.id, openFile);
        this.setState(
          { currentEditId: fileResource.id, topStatusFileInfo: transformEditorTabItem2TopStatusFileInfo(openFile) },
          () => this.showCurrentEditFileTab(fileResource.id),
        );
      }).finally(() => this.setState({ getApiFileResourceLoading: false }));
  }

  /** 设置当前编辑器编辑的Js定时任务 */
  public setCurrentEditJsJobFile(fileResourceId?: string, jobId?: string) {
    if (!fileResourceId) return;
    const { currentEditId, openFileMap } = this.state;
    const openFile = openFileMap.get(fileResourceId);
    if (openFile) {
      if (currentEditId === fileResourceId) {
        this.showCurrentEditFileTab(currentEditId);
        return;
      }
      openFile.lastEditTime = lodash.now();
      this.setState(
        { currentEditId: fileResourceId, topStatusFileInfo: transformEditorTabItem2TopStatusFileInfo(openFile) },
        () => this.showCurrentEditFileTab(fileResourceId),
      );
      return;
    }
    if (!jobId) return;
    this.setState({ getApiFileResourceLoading: true });
    request.get(FastApi.TaskManage.getJsJobInfo, { params: { jobId } })
      .then((data: JsJobInfoRes) => {
        if (!data || !data.fileResource) return;
        const fileResource: FileResource = data.fileResource;
        const sort = openFileMap.size + 1;
        const openFile: EditorTabItem = {
          sort, lastEditTime: lodash.now(), fileResource, rawContent: fileResource.content, needSave: false,
          job: data.job, jobTrigger: data.jobTrigger,
        };
        openFileMap.set(fileResource.id, openFile);
        this.setState(
          { currentEditId: fileResource.id, topStatusFileInfo: transformEditorTabItem2TopStatusFileInfo(openFile) },
          () => this.showCurrentEditFileTab(fileResource.id),
        );
      }).finally(() => this.setState({ getApiFileResourceLoading: false }));
  }

  /** 设置当前编辑器编辑的文件 */
  public setCurrentEditFile(fileResourceId?: string) {
    if (!fileResourceId) return;
    const { currentEditId, openFileMap } = this.state;
    const openFile = openFileMap.get(fileResourceId);
    if (openFile) {
      if (currentEditId === fileResourceId) {
        this.showCurrentEditFileTab(currentEditId);
        return;
      }
      openFile.lastEditTime = lodash.now();
      this.setState(
        { currentEditId: fileResourceId, topStatusFileInfo: transformEditorTabItem2TopStatusFileInfo(openFile) },
        () => this.showCurrentEditFileTab(fileResourceId),
      );
      return;
    }
    this.setState({ getFileResourceLoading: true });
    request.get(FastApi.FileResourceManage.getFileResource, { params: { id: fileResourceId } })
      .then((fileResource: FileResource) => {
        if (!fileResource) return; // TODO 文件不存在错误提示
        const sort = openFileMap.size + 1;
        const openFile: EditorTabItem = { sort, lastEditTime: lodash.now(), fileResource, rawContent: fileResource.content, needSave: false };
        openFileMap.set(fileResource.id, openFile);
        this.setState(
          { currentEditId: fileResource.id, topStatusFileInfo: transformEditorTabItem2TopStatusFileInfo(openFile) },
          () => this.showCurrentEditFileTab(fileResourceId),
        );
      }).finally(() => this.setState({ getFileResourceLoading: false }));
  }

  /** 关闭打开的文件 */
  public closeEditFile(fileResourceId?: string) {
    if (!fileResourceId) return;
    const { openFileMap } = this.state;
    let { topStatusFileInfo } = this.state;
    const closeFile = openFileMap.get(fileResourceId);
    if (!closeFile) return;
    // if(closeFile.needSave) {} // TODO 提示是否强行关闭
    openFileMap.delete(fileResourceId);
    let editFile: EditorTabItem | undefined;
    let lastEditTime: number = 0;
    openFileMap.forEach(item => {
      if (item.lastEditTime > lastEditTime) {
        lastEditTime = item.lastEditTime;
        editFile = item;
      }
    });
    if (editFile) topStatusFileInfo = transformEditorTabItem2TopStatusFileInfo(editFile);
    this.setState({ currentEditId: editFile?.fileResource.id, topStatusFileInfo });
  }

  /** 计算水平分隔面板大小 */
  private calculateHSplitCollapsedSize(leftPanel: LeftPanelEnum | undefined, rightPanel: RightPanelEnum | undefined, hSplitSize?: [number, number, number]): [number, number, number] {
    const { hSplitCollapsedSize } = this.state;
    if (!hSplitSize) hSplitSize = this.state.hSplitSize;
    if (hasValue(leftPanel)) {
      hSplitCollapsedSize[0] = hSplitSize[0];
    } else {
      hSplitCollapsedSize[0] = 0;
    }
    if (hasValue(rightPanel)) {
      hSplitCollapsedSize[2] = hSplitSize[2];
    } else {
      hSplitCollapsedSize[2] = 0;
    }
    hSplitCollapsedSize[1] = 100 - hSplitCollapsedSize[0] - hSplitCollapsedSize[2];
    return hSplitCollapsedSize;
  }

  /** 返回左边面板 */
  private getLeftPanel(openFile?: EditorTabItem): { leftPanel: LeftPanelEnum | undefined, changed: boolean } {
    const { leftPanel, currentEditId, openFileMap } = this.state;
    let newLeftPanel = leftPanel;
    if (hasValue(leftPanel) && currentEditId) {
      if (!openFile) openFile = openFileMap.get(currentEditId);
      const module = openFile?.fileResource?.module;
      if (module === 0) newLeftPanel = LeftPanelEnum.Extend;
      else if (module === 1) newLeftPanel = LeftPanelEnum.ResourceFile;
      else if (module === 2) newLeftPanel = LeftPanelEnum.Initialization;
      else if (module === 3) newLeftPanel = LeftPanelEnum.HttpApi;
      else if (module === 4) newLeftPanel = LeftPanelEnum.TimedTask;
    }
    return { leftPanel: newLeftPanel, changed: newLeftPanel !== leftPanel };
  }

  /** 微信二维码 */
  private getWechatQRCode() {
    const { wechatQRCode } = this.state;
    return (
      <Alert
        intent={Intent.NONE}
        confirmButtonText={"关闭"}
        canEscapeKeyCancel={false}
        canOutsideClickCancel={false}
        transitionDuration={0.1}
        isOpen={wechatQRCode}
        onConfirm={() => this.setState({ wechatQRCode: false })}
      >
        <img src={wechat} style={{ width: 358 }} alt={"微信二维码"}/>
      </Alert>
    );
  }

  private getTopMenu() {
    const { globalEnv } = this.state;
    return (
      <>
        <img className={cls(styles.flexItemColumn, styles.topMenuLogoImg)} src={logo} alt={"logo"}/>
        <div className={cls(styles.flexItemColumn, styles.topMenuLogoText)}>Fast-API</div>
        <div className={cls(styles.flexItemColumn, styles.topMenuLogoTextVersion)}>{globalEnv.version}</div>
        <div className={cls(styles.flexItemColumnWidthFull)}/>
        <IconFont
          type="icon-gitee"
          className={cls(styles.flexItemColumn, styles.icon)}
          onClick={() => window.open("https://gitee.com/LiZhiW/clever-graaljs")}
        />
        <GithubOutlined
          className={cls(styles.flexItemColumn, styles.icon)}
          onClick={() => window.open("https://github.com/Lzw2016/clever-graaljs")}
        />
        <QqOutlined
          className={cls(styles.flexItemColumn, styles.icon)}
          onClick={() => window.open("https://qm.qq.com/cgi-bin/qm/qr?k=h6BQqIoVb_MqBy2esg1TPljIqoZNyFUi&jump_from=webapi")}
        />
        <WechatOutlined
          className={cls(styles.flexItemColumn, styles.icon)}
          onClick={() => this.setState({ wechatQRCode: true })}
        />
        <QuestionCircleOutlined className={cls(styles.flexItemColumn, styles.icon, styles.iconDisable)}/>
        <div className={cls(styles.flexItemColumn)} style={{ marginRight: 16 }}/>
      </>
    );
  }

  private getTopStatus() {
    const { globalEnv, topStatusFileInfo, openFileMap } = this.state;
    const currentFile = topStatusFileInfo && openFileMap.get(topStatusFileInfo.fileResourceId);
    return (
      <TopStatusPanel
        globalEnv={globalEnv}
        topStatusFileInfo={topStatusFileInfo}
        currentFile={currentFile}
        toggleBottomPanel={() => this.toggleBottomPanel(BottomPanelEnum.Interface)}
        reLoadTaskResourceTree={() => this.taskResourcePanel.current?.reLoadTreeData(false, true)}
      />
    );
  }

  private getBottomStatus() {
    const { getApiFileResourceLoading, saveFileResourceLoading } = this.state;
    let loadingText = "";
    if (getApiFileResourceLoading) loadingText = "加载API数据";
    else if (saveFileResourceLoading) loadingText = "保存文件";
    return (
      <>
        <div className={cls(styles.flexItemColumn, styles.bottomStatusFirst)}/>
        {
          (getApiFileResourceLoading || saveFileResourceLoading) &&
          (
            <>
              <div
                className={cls(styles.flexItemColumn, styles.bottomStatusItem, styles.bottomLoadingText)}
                style={{ paddingLeft: 0, paddingRight: 4 }}
              >
                <span>{loadingText}</span>
              </div>
              <ProgressBar className={cls(styles.flexItemColumn, styles.bottomLoadingProgressBar)} intent={Intent.NONE}/>
            </>
          )
        }
        <div className={cls(styles.flexItemColumnWidthFull)}/>
        <EngineInstancePanel className={cls(styles.flexItemColumn, styles.bottomStatusItem)}/>
      </>
    );
  }

  private getBottomTabs() {
    const { bottomPanel } = this.state;
    return (
      <>
        <div className={cls(styles.flexItemColumn, styles.bottomTabsFirst)}/>
        <div
          className={cls(styles.flexItemColumn, styles.bottomTabsItem, { [styles.bottomTabsItemActive]: bottomPanel === BottomPanelEnum.Interface })}
          onClick={() => this.toggleBottomPanel(BottomPanelEnum.Interface)}
        >
          {/*接口路由|接口文档*/}
          <ApiOutlined/><span className={styles.bottomTabsItemText}>接口配置</span>
        </div>
        <div
          className={cls(styles.flexItemColumn, styles.bottomTabsItem, { [styles.bottomTabsItemActive]: bottomPanel === BottomPanelEnum.RequestDebug })}
          onClick={() => this.toggleBottomPanel(BottomPanelEnum.RequestDebug)}
        >
          <Icon component={Debugger}/><span className={styles.bottomTabsItemText}>接口调试</span>
        </div>
        <div
          className={cls(styles.flexItemColumn, styles.bottomTabsItem, { [styles.bottomTabsItemActive]: bottomPanel === BottomPanelEnum.ServerLogs })}
          onClick={() => this.toggleBottomPanel(BottomPanelEnum.ServerLogs)}
        >
          <Icon component={OpenTerminal}/><span className={styles.bottomTabsItemText}>服务端日志</span>
        </div>
        <div
          className={cls(styles.flexItemColumn, styles.bottomTabsItem, { [styles.bottomTabsItemActive]: bottomPanel === BottomPanelEnum.GlobalConfig })}
          onClick={() => this.toggleBottomPanel(BottomPanelEnum.GlobalConfig)}
        >
          {/*HTTP全局请求参数*/}
          <ControlOutlined/><span className={styles.bottomTabsItemText}>全局请求参数</span>
        </div>
        <div className={cls(styles.flexItemColumnWidthFull)}/>
        <div
          className={cls(styles.flexItemColumn, styles.bottomTabsItem, { [styles.bottomTabsItemActive]: bottomPanel === BottomPanelEnum.SysEvent })}
          onClick={() => this.toggleBottomPanel(BottomPanelEnum.SysEvent)}
        >
          <Icon component={NoEvents}/><span className={styles.bottomTabsItemText}>系统日志</span>
        </div>
        <div className={cls(styles.flexItemColumn)} style={{ marginRight: 16 }}/>
      </>
    );
  }

  private getLeftTabs() {
    const { leftPanel } = this.state;
    return (
      <>
        <div
          className={cls(styles.flexItemRow, styles.leftTabsItem, { [styles.leftTabsItemActive]: leftPanel === LeftPanelEnum.ResourceFile })}
          onClick={() => this.toggleLeftPanel(LeftPanelEnum.ResourceFile)}
        >
          资源文件
          <FolderFilled/>
        </div>
        <div
          className={cls(styles.flexItemRow, styles.leftTabsItem, { [styles.leftTabsItemActive]: leftPanel === LeftPanelEnum.HttpApi })}
          onClick={() => this.toggleLeftPanel(LeftPanelEnum.HttpApi)}
        >
          接口列表
          <FolderFilled/>
        </div>
        <div
          className={cls(styles.flexItemRow, styles.leftTabsItem, { [styles.leftTabsItemActive]: leftPanel === LeftPanelEnum.TimedTask })}
          onClick={() => this.toggleLeftPanel(LeftPanelEnum.TimedTask)}
        >
          定时任务
          <FolderFilled/>
        </div>
        <div
          className={cls(styles.flexItemRow, styles.leftTabsItem, { [styles.leftTabsItemActive]: leftPanel === LeftPanelEnum.Extend })}
          onClick={() => this.toggleLeftPanel(LeftPanelEnum.Extend)}
        >
          自定义扩展
          <FolderFilled/>
        </div>
        <div
          className={cls(styles.flexItemRow, styles.leftTabsItem, { [styles.leftTabsItemActive]: leftPanel === LeftPanelEnum.Initialization })}
          onClick={() => this.toggleLeftPanel(LeftPanelEnum.Initialization)}
        >
          初始化脚本
          <FolderFilled/>
        </div>
        <div className={styles.flexItemRowHeightFull}/>
      </>
    );
  }

  private getRightTabs() {
    const { rightPanel } = this.state;
    return (
      <>
        <div
          className={cls(styles.flexItemRow, styles.rightTabsItem, { [styles.rightTabsItemActive]: rightPanel === RightPanelEnum.JDBC })}
          style={{ height: 110 }}
          onClick={() => this.toggleRightPanel(RightPanelEnum.JDBC)}
        >
          <IconFont type="icon-database"/>
          <div style={{ marginTop: 6, marginBottom: 16, marginLeft: -2, transform: "rotate(90deg)" }}>JDBC</div>
          数据库
        </div>
        <div
          className={cls(styles.flexItemRow, styles.rightTabsItem, { [styles.rightTabsItemActive]: rightPanel === RightPanelEnum.Redis })}
          style={{ height: 110 }}
          onClick={() => this.toggleRightPanel(RightPanelEnum.Redis)}
        >
          <IconFont type="icon-redis"/>
          <div style={{ marginTop: 6, marginBottom: 16, marginLeft: -2, transform: "rotate(90deg)" }}>Redis</div>
          数据库
        </div>
        <div
          className={cls(styles.flexItemRow, styles.rightTabsItem, { [styles.rightTabsItemActive]: rightPanel === RightPanelEnum.Elasticsearch })}
          style={{ height: 146 }}
          onClick={() => this.toggleRightPanel(RightPanelEnum.Elasticsearch)}
        >
          <IconFont type="icon-elasticsearch"/>
          <div style={{ marginTop: 6, marginLeft: -2, transform: "rotate(90deg)" }}>Elasticsearch</div>
        </div>
        <div className={styles.flexItemRowHeightFull}/>
      </>
    );
  }

  private getVSplitTabs() {
    const { bottomPanel, vSplitSize, vSplitCollapsedSize } = this.state;
    const sizes = hasValue(bottomPanel) ? vSplitSize : vSplitCollapsedSize;
    const topSize = sizes[0];
    return (
      <div className={cls(styles.verticalSplitTabs, styles.flexItemRow, styles.flexColumn)}>
        <div className={cls(styles.flexItemColumn, styles.verticalSplitTabsLabel)}>
          {bottomPanel === BottomPanelEnum.Interface && <span>接口配置:</span>}
          {bottomPanel === BottomPanelEnum.RequestDebug && <span>接口调试:</span>}
          {bottomPanel === BottomPanelEnum.ServerLogs && <span>服务端日志:</span>}
          {bottomPanel === BottomPanelEnum.GlobalConfig && <span>全局请求参数:</span>}
          {bottomPanel === BottomPanelEnum.SysEvent && <span>系统日志:</span>}
        </div>
        {/*<div className={cls(styles.flexItemColumn, styles.verticalSplitTabsItem, styles.verticalSplitTabsItemActive)}>*/}
        {/*  <span className={cls(styles.verticalSplitTabsItemLabel)}>叶签1</span>*/}
        {/*  <CloseOutlined className={cls(styles.verticalSplitTabsItemClose)}/>*/}
        {/*</div>*/}
        {/*<div className={cls(styles.flexItemColumn, styles.verticalSplitTabsItem)}>*/}
        {/*  <span className={cls(styles.verticalSplitTabsItemLabel)}>叶签2</span>*/}
        {/*  <CloseOutlined className={cls(styles.verticalSplitTabsItemClose)}/>*/}
        {/*</div>*/}
        {/*<div className={cls(styles.flexItemColumn, styles.verticalSplitTabsItem)}>*/}
        {/*  <span className={cls(styles.verticalSplitTabsItemLabel)}>叶签3</span>*/}
        {/*  <CloseOutlined className={cls(styles.verticalSplitTabsItemClose)}/>*/}
        {/*</div>*/}
        <div className={cls(styles.flexItemColumnWidthFull)}/>
        {
          topSize > 20 &&
          <Icon
            component={ChevronUp}
            className={cls(styles.flexItemColumn, styles.icon)}
            onClick={() => {
              sizes[0] = 20;
              sizes[1] = 80;
              this.forceUpdate();
            }}
          />
        }
        {
          topSize <= 20 &&
          <Icon
            component={ChevronDown}
            className={cls(styles.flexItemColumn, styles.icon)}
            onClick={() => {
              sizes[0] = 80;
              sizes[1] = 20;
              this.forceUpdate();
            }}
          />
        }
        <MinusOutlined
          className={cls(styles.flexItemColumn, styles.icon)}
          onClick={() => this.toggleBottomPanel()}
        />
        <div className={cls(styles.flexItemColumn)} style={{ width: 2 }}/>
      </div>
    );
  }

  private getBottomContent() {
    const { bottomPanel, currentEditId, openFileMap } = this.state;
    let httpApiId: string | undefined;
    let openFile: EditorTabItem | undefined;
    if (currentEditId) {
      openFile = openFileMap.get(currentEditId);
      httpApiId = openFile?.httpApi?.id;
    }
    const style: React.CSSProperties = { height: "100%" };
    return (
      <>
        <div className={cls(styles.flexItemRowHeightFull, { [styles.hide]: bottomPanel !== BottomPanelEnum.Interface })} style={style}>
          <InterfaceConfigPanel
            openFile={openFile}
            onSaved={res => {
              if (openFile) {
                openFile.fileResource = res.fileResource;
                openFile.httpApi = res.httpApi;
              }
              this.httpApiResourcePane.current?.reLoadTreeData(false, true);
            }}
          />
        </div>
        <div className={cls(styles.flexItemRowHeightFull, { [styles.hide]: bottomPanel !== BottomPanelEnum.RequestDebug })} style={style}>
          <RequestDebugPanel
            ref={this.requestDebugPane}
            httpApiId={httpApiId}
          />
        </div>
        <div className={cls(styles.flexItemRowHeightFull, { [styles.hide]: bottomPanel !== BottomPanelEnum.ServerLogs })} style={style}>
          RunResult
        </div>
        <div className={cls(styles.flexItemRowHeightFull, { [styles.hide]: bottomPanel !== BottomPanelEnum.GlobalConfig })} style={style}>
          <GlobalConfigPanel ref={this.globalConfigPanel}/>
        </div>
        <div className={cls(styles.flexItemRowHeightFull, { [styles.hide]: bottomPanel !== BottomPanelEnum.SysEvent })} style={style}>
          SysEvent
        </div>
      </>
    );
  }

  private getLeftContent() {
    const { leftPanel, currentEditId } = this.state;
    return (
      <>
        <div className={cls({ [styles.hide]: leftPanel !== LeftPanelEnum.ResourceFile })}>
          ResourceFile
        </div>
        <HttpApiResourcePanel
          ref={this.httpApiResourcePane}
          className={cls({ [styles.hide]: leftPanel !== LeftPanelEnum.HttpApi })}
          openFileId={currentEditId}
          onHidePanel={() => this.toggleLeftPanel()}
          onSelectChange={node => {
            const apiFileResource = node.nodeData;
            if (!apiFileResource) {
              this.setState({ topStatusFileInfo: undefined });
              return;
            }
            this.setState({ topStatusFileInfo: toTopStatusFileInfo(apiFileResource) });
          }}
          onOpenFile={apiFileResource => {
            if (apiFileResource.isFile !== 1) return;
            this.setCurrentEditHttpApiFile(apiFileResource.fileResourceId, apiFileResource.httpApiId);
          }}
          onAddHttpApi={(httpApi, file) => {
            if (file.isFile !== 1) return;
            this.setCurrentEditHttpApiFile(file.id, httpApi.id);
          }}
          onDelHttpApi={files => files.forEach(file => this.closeEditFile(file.id))}
        />
        <TaskResourcePanel
          ref={this.taskResourcePanel}
          className={cls({ [styles.hide]: leftPanel !== LeftPanelEnum.TimedTask })}
          openFileId={currentEditId}
          onHidePanel={() => this.toggleLeftPanel()}
          onSelectChange={node => {
            const resource = node.nodeData;
            if (!resource) {
              this.setState({ topStatusFileInfo: undefined });
              return;
            }
            this.setState({ topStatusFileInfo: toTopStatusFileInfo(resource) });
          }}
          onOpenFile={resource => {
            if (resource.isFile !== 1) return;
            this.setCurrentEditJsJobFile(resource.fileResourceId, resource.jobId);
          }}
          // onAddFile={file => {
          //   if (file.isFile !== 1) return;
          //   this.setCurrentEditFile(file.id);
          // }}
          // onDelFile={files => files.forEach(file => this.closeEditFile(file.id))}
        />
        <ExtendResourcePanel
          ref={this.extendResourcePane}
          className={cls({ [styles.hide]: leftPanel !== LeftPanelEnum.Extend })}
          openFileId={currentEditId}
          onHidePanel={() => this.toggleLeftPanel()}
          onSelectChange={node => {
            const resource = node.nodeData;
            if (!resource) {
              this.setState({ topStatusFileInfo: undefined });
              return;
            }
            this.setState({ topStatusFileInfo: toTopStatusFileInfo(resource) });
          }}
          onOpenFile={resource => {
            if (resource.isFile !== 1) return;
            this.setCurrentEditFile(resource.id);
          }}
          onAddFile={file => {
            if (file.isFile !== 1) return;
            this.setCurrentEditFile(file.id);
          }}
          onDelFile={files => files.forEach(file => this.closeEditFile(file.id))}
        />
        <div className={cls({ [styles.hide]: leftPanel !== LeftPanelEnum.Initialization })}>
          Initialization
        </div>
      </>
    );
  }

  private getRightContent() {
    const { rightPanel } = this.state;
    return (
      <>
        <div className={cls({ [styles.hide]: rightPanel !== RightPanelEnum.JDBC })}>
          <JdbcDatabaseManagePanel/>
        </div>
        <div className={cls({ [styles.hide]: rightPanel !== RightPanelEnum.Redis })}>
          <RedisManagePanel/>
        </div>
        <div className={cls({ [styles.hide]: rightPanel !== RightPanelEnum.Elasticsearch })}>
          Elasticsearch
        </div>
      </>
    );
  }

  private getOpenFilesTabs() {
    const { currentEditId, openFileMap } = this.state;
    const openFiles = lodash.sortBy([...openFileMap.values()], item => item.sort);
    const fileTabs: React.ReactNode[] = [];
    openFiles.forEach(file => {
      fileTabs.push(
        <div
          id={`fileTab#${file.fileResource.id}`}
          key={file.fileResource.id}
          className={cls(styles.flexItemColumn, styles.fileTabsItem, { [styles.fileTabsItemActive]: currentEditId === file.fileResource.id })}
          onClick={() => {
            const leftPanel = this.getLeftPanel(file);
            if (leftPanel.changed) {
              this.setState({ leftPanel: leftPanel.leftPanel });
            }
            if (file.fileResource.module === 3) {
              this.setCurrentEditHttpApiFile(file.fileResource.id)
            } else {
              this.setCurrentEditFile(file.fileResource.id)
            }
          }}
        >
          <Icon component={getFileIcon(file.fileResource.name)} className={styles.fileTabsItemType}/>
          <span className={cls({ [styles.fileTabsItemModify]: file.needSave })}>{file.fileResource.name}</span>
          <CloseOutlined
            className={styles.fileTabsItemClose}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              this.closeEditFile(file.fileResource.id);
            }}
          />
        </div>
      );
    });
    return (
      <div
        className={cls(styles.editorTabs, styles.flexColumn, { [styles.hide]: fileTabs.length <= 0 })}
        onWheel={e => {
          const delta = Math.max(-1, Math.min(1, ((e.nativeEvent as any).wheelDelta || -e.nativeEvent.detail)))
          e.currentTarget.scrollLeft -= (delta * 30)
        }}
      >
        {fileTabs}
      </div>
    );
  }

  private getTips() {
    const { currentEditId } = this.state;
    return (
      <div className={cls({ [styles.emptyEditor]: !currentEditId }, { [styles.hide]: currentEditId })}>
        <p>
          保存<em>Ctrl + S</em><br/>
          代码提示<em>Alt + /</em><br/>
          参数提示<em>Ctrl + P</em><br/>
          格式化<em>Ctrl + Alt + L</em><br/>
          复制行<em>Ctrl + D</em><br/>
          删除行<em>Ctrl + Y</em><br/>
          向下插入行<em>Shift + Enter</em><br/>
          向上插入行<em>Ctrl + Shift + Enter</em><br/>
        </p>
      </div>
    );
  }

  private getEditor() {
    const { currentEditId, openFileMap } = this.state;
    const openFile: EditorTabItem | undefined = openFileMap.get(currentEditId ?? "");
    return (
      <Editor
        wrapperClassName={cls(styles.editorWrapper, { [styles.hide]: !currentEditId })}
        className={styles.editor}
        theme={themeEnum.IdeaDracula}
        loading={<Spinner intent={Intent.PRIMARY} size={SpinnerSize.STANDARD}/>}
        options={editorDefOptions}
        language={getLanguage(openFile?.fileResource.name)}
        value={openFile?.fileResource?.content}
        saveViewState={true}
        path={openFile?.fileResource ? (openFile.fileResource.path + openFile.fileResource.name) : "/empty.js"}
        keepCurrentModel={true}
        onMount={(editor, monaco) => {
          initEditorConfig(editor);
          initKeyBinding(editor, monaco);
          this.editor = editor;
          this.editor.layout();
          this.editor.onDidFocusEditorText(() => {
            const leftPanel = this.getLeftPanel();
            if (leftPanel.changed) {
              this.setState({ leftPanel: leftPanel.leftPanel });
            }
            this.setTopStatusFileInfo();
          });
          this.editor.addCommand(
            MonacoApi.KeyMod.CtrlCmd | MonacoApi.KeyCode.KEY_S,
            () => {
              const { currentEditId, openFileMap } = this.state;
              const file: EditorTabItem | undefined = openFileMap.get(currentEditId ?? "");
              if (!file) return; // TODO 错误提示
              this.saveFileResource(file);
            },
          );
        }}
        onChange={value => {
          const { currentEditId, openFileMap } = this.state;
          const openFile: EditorTabItem | undefined = openFileMap.get(currentEditId ?? "");
          if (!openFile) return; // TODO 错误提示
          const changed = (openFile.rawContent !== value);
          this.saveCurrentEditFile(changed, openFile, value);
        }}
      />
    );
  }

  private getLayout() {
    const { bottomPanel, vSplitSize, vSplitCollapsedSize, leftPanel, rightPanel, hSplitSize, hSplitCollapsedSize } = this.state;
    return (
      <>
        <div className={cls(styles.topMenu, styles.flexColumn)}>
          {this.getTopMenu()}
        </div>
        <div className={cls(styles.topStatus, styles.flexColumn)}>
          {this.getTopStatus()}
        </div>
        <div className={cls(styles.bottomTabs, styles.flexColumn)}>
          {this.getBottomTabs()}
        </div>
        <div className={cls(styles.bottomStatus, styles.flexColumn)}>
          {this.getBottomStatus()}
        </div>
        <div className={cls(styles.leftTabs, styles.flexRow)}>
          {this.getLeftTabs()}
        </div>
        <div className={cls(styles.rightTabs, styles.flexRow)}>
          {this.getRightTabs()}
        </div>
        <Split
          className={cls(styles.center, styles.verticalSplit, { [styles.verticalSplitHideGutter]: noValue(bottomPanel) })}
          direction={"vertical"}
          sizes={hasValue(bottomPanel) ? vSplitSize : vSplitCollapsedSize}
          minSize={[128, hasValue(bottomPanel) ? 128 : 0]}
          maxSize={[Infinity, Infinity]}
          snapOffset={20}
          dragInterval={1}
          gutterSize={0}
          cursor={"ns-resize"}
          elementStyle={(_, elementSize) => {
            if (elementSize < 1) elementSize = 0;
            if (elementSize > 99) elementSize = 100;
            return { height: `${elementSize}%` };
          }}
          onDragEnd={sizes => this.setState({ vSplitSize: sizes as any })}
          gutter={() => {
            const element = document.createElement("div");
            element.className = cls("gutter gutter-vertical", styles.verticalSplitGutter);
            return element;
          }}
        >
          <Split
            className={cls(
              styles.horizontalSplit,
              { [styles.horizontalLeftSplitHideGutter]: noValue(leftPanel) },
              { [styles.horizontalRightSplitHideGutter]: noValue(rightPanel) },
            )}
            direction={"horizontal"}
            sizes={noValue(leftPanel) || noValue(rightPanel) ? hSplitCollapsedSize : hSplitSize}
            minSize={[hasValue(leftPanel) ? 300 : 0, 256, hasValue(rightPanel) ? 128 : 0]}
            maxSize={[512, Infinity, 512]}
            snapOffset={20}
            dragInterval={1}
            gutterSize={0}
            cursor={"ew-resize"}
            elementStyle={(_, elementSize) => {
              return { width: `${elementSize}%` };
            }}
            onDragEnd={sizes => {
              this.setState({
                hSplitSize: sizes as any,
                hSplitCollapsedSize: this.calculateHSplitCollapsedSize(leftPanel, rightPanel, sizes as any)
              });
            }}
            gutter={index => {
              const element = document.createElement("div");
              element.className = cls(
                "gutter gutter-horizontal",
                styles.horizontalSplitGutter,
                { [styles.leftSplitGutter]: index === 1 },
                { [styles.rightSplitGutter]: index === 2 },
              );
              return element;
            }}
          >
            <div className={cls(styles.leftPane, styles.flexRow, { [styles.hide]: noValue(leftPanel) })}>
              {this.getLeftContent()}
            </div>
            <div>
              {this.getOpenFilesTabs()}
              {this.getTips()}
              {this.getEditor()}
            </div>
            <div className={cls(styles.rightPane, styles.flexRow, { [styles.hide]: noValue(rightPanel) })}>
              {this.getRightContent()}
            </div>
          </Split>
          <div className={cls(styles.bottomPane, styles.flexRow, { [styles.hide]: noValue(bottomPanel) })}>
            {this.getVSplitTabs()}
            {this.getBottomContent()}
          </div>
        </Split>
        {this.getWechatQRCode()}
      </>
    );
  }

  public render() {
    this.saveAppState();
    return this.getLayout();
  }
}

export default Workbench;
