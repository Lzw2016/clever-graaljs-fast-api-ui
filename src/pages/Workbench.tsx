import React from "react";
import cls from "classnames";
import lodash from "lodash";
import qs from "qs";
import Split from "react-split";
import Icon, {
  ApiOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  ControlOutlined,
  FolderFilled,
  GithubOutlined,
  HistoryOutlined,
  LockOutlined,
  MinusOutlined,
  QqOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  UnlockOutlined,
  WechatOutlined
} from "@ant-design/icons";
import { Intent, ProgressBar, Spinner, SpinnerSize } from "@blueprintjs/core";
import * as MonacoApi from "monaco-editor";
import Editor from "@monaco-editor/react";
import IconFont from "@/components/IconFont";
import logo from "@/assets/logo.svg";
import { FastApi } from "@/apis";
import { HttpApiResourcePane } from "@/components/ide";
import { hasValue, noValue } from "@/utils/utils";
import { request } from "@/utils/request";
import { ChevronDown, ChevronUp, getFileIcon } from "@/utils/IdeaIconUtils";
import { editorDefOptions, initKeyBinding, languageEnum, themeEnum } from "@/utils/editor-utils";
import { BottomPanelEnum, EditorTabItem, EditorTabsState, LayoutSize, LeftPanelEnum, RightPanelEnum, TopStatusFileInfo } from "@/types/workbench-layout";
import styles from "./Workbench.module.less";

interface WorkbenchProps {
}

interface WorkbenchState extends LayoutSize, EditorTabsState {
  /** 数据加载状态 */
  editorLoading: boolean;
  /** HttpApiTree当前选中的节点 */
  topStatusFileInfo?: TopStatusFileInfo;
}

const defaultState: WorkbenchState = {
  editorLoading: false,
  // LayoutSize
  bottomPanel: BottomPanelEnum.GlobalConfig,
  vSplitSize: [80, 20],
  vSplitCollapsedSize: [80, 20],
  leftPanel: LeftPanelEnum.Interface,
  rightPanel: RightPanelEnum.JDBC,
  hSplitSize: [15, 75, 10],
  hSplitCollapsedSize: [15, 75, 10],
  // EditorTabsState
  openFileMap: new Map<string, EditorTabItem>(),
  editorStateMap: new Map<string, MonacoApi.editor.IEditorViewState>(),
};

class Workbench extends React.Component<WorkbenchProps, WorkbenchState> {
  /** 编辑器实例 */
  private editor: MonacoApi.editor.IStandaloneCodeEditor | undefined;
  /** 编辑器大小自适应 */
  private editorResize = lodash.debounce(() => this.editor?.layout(), 500, { maxWait: 3000 });

  constructor(props: Readonly<WorkbenchProps>) {
    super(props);
    this.state = { ...defaultState };
  }

  // 组件挂载后
  public componentDidMount() {
    window.addEventListener("resize", this.editorResize);
  }

  // 组件将要被卸载
  public componentWillUnmount() {
    window.removeEventListener("resize", this.editorResize);
  }

  /** 切换底部布局区域隐藏/显示 */
  public toggleBottomPanel(panel?: BottomPanelEnum) {
    const { bottomPanel, vSplitSize, vSplitCollapsedSize } = this.state;
    let newBottomPanel: BottomPanelEnum | undefined;
    if (panel === BottomPanelEnum.Interface) {
      newBottomPanel = (bottomPanel === BottomPanelEnum.Interface ? undefined : BottomPanelEnum.Interface);
    } else if (panel === BottomPanelEnum.Request) {
      newBottomPanel = (bottomPanel === BottomPanelEnum.Request ? undefined : BottomPanelEnum.Request);
    } else if (panel === BottomPanelEnum.RunResult) {
      newBottomPanel = (bottomPanel === BottomPanelEnum.RunResult ? undefined : BottomPanelEnum.RunResult);
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
    if (panel === LeftPanelEnum.Interface) {
      newLeftPanel = (leftPanel === LeftPanelEnum.Interface ? undefined : LeftPanelEnum.Interface);
    } else if (panel === LeftPanelEnum.TimedTask) {
      newLeftPanel = (leftPanel === LeftPanelEnum.TimedTask ? undefined : LeftPanelEnum.TimedTask);
    } else if (panel === LeftPanelEnum.Expand) {
      newLeftPanel = (leftPanel === LeftPanelEnum.Expand ? undefined : LeftPanelEnum.Expand);
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

  /** 设置当前编辑的文件ID */
  public setCurrentEditId(fileResourceId?: string, httpApiId?: string) {
    if (!fileResourceId) return;
    const { openFileMap } = this.state;
    const openFile = openFileMap.get(fileResourceId);
    if (openFile) {
      openFile.lastEditTime = lodash.now();
      this.setState({ currentEditId: fileResourceId });
      return;
    }
    if (!httpApiId) return;
    const url = `${FastApi.HttpApiManage.getHttpApiFileResource}?${qs.stringify({ httpApiId })}`;
    this.setState({ editorLoading: true });
    request.get(url).then(data => {
      if (!data || !data.fileResource || !data.httpApi) return;
      const fileResource: FileResource = data.fileResource;
      const httpApi: HttpApi = data.httpApi;
      const sort = openFileMap.size + 1;
      openFileMap.set(fileResource.id, { sort, lastEditTime: lodash.now(), fileResource, needSave: false, httpApi });
      this.setState({ currentEditId: fileResource.id });
    }).finally(() => this.setState({ editorLoading: false }));
  }

  /** 关闭打开的文件 */
  public closeEditFile(fileResourceId?: string) {
    if (!fileResourceId) return;
    const { openFileMap } = this.state;
    if (!openFileMap.has(fileResourceId)) return;
    openFileMap.delete(fileResourceId);
    let editId: string | undefined;
    let lastEditTime: number = 0;
    openFileMap.forEach((item, fileResourceId) => {
      if (item.lastEditTime > lastEditTime) {
        lastEditTime = item.lastEditTime;
        editId = fileResourceId;
      }
    });
    this.setState({ currentEditId: editId });
  }

  private calculateHSplitCollapsedSize(leftPanel: LeftPanelEnum | undefined, rightPanel: RightPanelEnum | undefined): [number, number, number] {
    const { hSplitSize, hSplitCollapsedSize } = this.state;
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

  private getTopMenu() {
    return (
      <>
        <img className={cls(styles.flexItemColumn, styles.topMenuLogoImg)} src={logo} alt={"logo"}/>
        <div className={cls(styles.flexItemColumn, styles.topMenuLogoText)}>Fast-API</div>
        <div className={cls(styles.flexItemColumn, styles.topMenuLogoTextVersion)}>0.0.1</div>
        <div className={cls(styles.flexItemColumnWidthFull)}/>
        <IconFont type="icon-gitee" className={cls(styles.flexItemColumn, styles.icon)}/>
        <GithubOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
        <QqOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
        <WechatOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
        <QuestionCircleOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
        <div className={cls(styles.flexItemColumn)} style={{ marginRight: 16 }}/>
      </>
    );
  }

  private getTopStatus() {
    const { topStatusFileInfo } = this.state;
    return (
      <>
        <div className={cls(styles.flexItemColumn)} style={{ width: 3 }}/>
        <div className={cls(styles.flexItemColumn, styles.topStatusFileResourcePath)} style={{ paddingTop: 6 }}>
          <AppstoreOutlined style={{ fontSize: 16 }}/>
        </div>
        <div className={cls(styles.flexItemColumn, styles.topStatusFileResourcePath)} style={{ margin: "0 8px 0 4px", fontWeight: "bold" }}>
          [default]
        </div>
        {
          topStatusFileInfo &&
          <div className={cls(styles.flexItemColumn, styles.topStatusFileResourcePath)}>
            {
              topStatusFileInfo.isFile === 1 ?
                (
                  <>
                    {topStatusFileInfo.path}
                    <span className={styles.topStatusFileModify}>
                      {topStatusFileInfo.name}
                    </span>
                  </>
                ) :
                (topStatusFileInfo.path + topStatusFileInfo.name)
            }
          </div>
        }
        {
          topStatusFileInfo?.httpApiId &&
          <div className={cls(styles.flexItemColumn, styles.topStatusFileResourcePath)}>
            <ArrowRightOutlined style={{ fontSize: 10, padding: "0 8px 0 8px" }}/>
          </div>
        }
        {
          topStatusFileInfo?.httpApiId &&
          <SettingOutlined className={cls(styles.flexItemColumn, styles.icon)} style={{ fontSize: 14, padding: "4px 4px" }}/>
        }
        {
          topStatusFileInfo?.httpApiId &&
          <div className={cls(styles.flexItemColumn, styles.topStatusFileResourcePath)}>
            &nbsp;[{topStatusFileInfo.requestMethod}]&nbsp;{topStatusFileInfo.requestMapping}
          </div>
        }
        <div className={cls(styles.flexItemColumnWidthFull)}/>
        <IconFont type="icon-run" className={cls(styles.flexItemColumn, styles.icon)} style={{ color: "#499C54" }}/>
        <IconFont type="icon-save" className={cls(styles.flexItemColumn, styles.icon)}/>
        <LockOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
        <UnlockOutlined className={cls(styles.flexItemColumn, styles.icon, styles.iconDisable)}/>
        <IconFont type="icon-search" className={cls(styles.flexItemColumn, styles.icon)}/>
        <HistoryOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
        <IconFont type="icon-keyboard" className={cls(styles.flexItemColumn, styles.icon)} style={{ fontSize: 20, padding: "1px 2px" }}/>
        <div className={cls(styles.flexItemColumn)} style={{ marginRight: 16 }}/>
      </>
    );
  }

  private getBottomStatus() {
    const { editorLoading } = this.state;
    return (
      <>
        <div className={cls(styles.flexItemColumn, styles.bottomStatusFirst)}/>
        <div className={cls(styles.flexItemColumn, styles.bottomStatusItem)} style={{ paddingLeft: 0 }}>
          正在检查更新，请稍候...
        </div>
        <div className={cls(styles.flexItemColumnWidthFull)}/>
        {
          editorLoading &&
          <ProgressBar className={cls(styles.flexItemColumn, styles.bottomProgressBar)} intent={Intent.NONE}/>
        }
        <div className={cls(styles.flexItemColumn, styles.bottomStatusItem)}/>
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
          <ApiOutlined/>接口配置
        </div>
        <div
          className={cls(styles.flexItemColumn, styles.bottomTabsItem, { [styles.bottomTabsItemActive]: bottomPanel === BottomPanelEnum.Request })}
          onClick={() => this.toggleBottomPanel(BottomPanelEnum.Request)}
        >
          {/*请求参数(单选列表)*/}
          <IconFont type="icon-http"/>请求配置
        </div>
        <div
          className={cls(styles.flexItemColumn, styles.bottomTabsItem, { [styles.bottomTabsItemActive]: bottomPanel === BottomPanelEnum.RunResult })}
          onClick={() => this.toggleBottomPanel(BottomPanelEnum.RunResult)}
        >
          {/*HTTP请求响应数据|运行日志*/}
          <IconFont type="icon-run"/>运行结果
        </div>
        <div
          className={cls(styles.flexItemColumn, styles.bottomTabsItem, { [styles.bottomTabsItemActive]: bottomPanel === BottomPanelEnum.GlobalConfig })}
          onClick={() => this.toggleBottomPanel(BottomPanelEnum.GlobalConfig)}
        >
          {/*HTTP全局请求配置*/}
          <ControlOutlined/>全局请求参数
        </div>
        <div className={cls(styles.flexItemColumnWidthFull)}/>
        <div
          className={cls(styles.flexItemColumn, styles.bottomTabsItem, { [styles.bottomTabsItemActive]: bottomPanel === BottomPanelEnum.SysEvent })}
          onClick={() => this.toggleBottomPanel(BottomPanelEnum.SysEvent)}
        >
          <IconFont type="icon-message"/>系统事件
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
          className={cls(styles.flexItemRow, styles.leftTabsItem, { [styles.leftTabsItemActive]: leftPanel === LeftPanelEnum.Interface })}
          onClick={() => this.toggleLeftPanel(LeftPanelEnum.Interface)}
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
          className={cls(styles.flexItemRow, styles.leftTabsItem, { [styles.leftTabsItemActive]: leftPanel === LeftPanelEnum.Expand })}
          onClick={() => this.toggleLeftPanel(LeftPanelEnum.Expand)}
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
      <div className={cls(styles.verticalSplitTabs, styles.flexColumn)}>
        <div className={cls(styles.flexItemColumn, styles.verticalSplitTabsLabel)}>接口配置:</div>
        <div className={cls(styles.flexItemColumn, styles.verticalSplitTabsItem, styles.verticalSplitTabsItemActive)}>
          <span className={cls(styles.verticalSplitTabsItemLabel)}>叶签1</span>
          <CloseOutlined className={cls(styles.verticalSplitTabsItemClose)}/>
        </div>
        <div className={cls(styles.flexItemColumn, styles.verticalSplitTabsItem)}>
          <span className={cls(styles.verticalSplitTabsItemLabel)}>叶签2</span>
          <CloseOutlined className={cls(styles.verticalSplitTabsItemClose)}/>
        </div>
        <div className={cls(styles.flexItemColumn, styles.verticalSplitTabsItem)}>
          <span className={cls(styles.verticalSplitTabsItemLabel)}>叶签3</span>
          <CloseOutlined className={cls(styles.verticalSplitTabsItemClose)}/>
        </div>
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

  private getLeftContent() {
    const { leftPanel, currentEditId } = this.state;
    return (
      <>
        <HttpApiResourcePane
          className={cls({ [styles.hide]: leftPanel !== LeftPanelEnum.Interface })}
          openFileId={currentEditId}
          onHidePanel={() => this.toggleLeftPanel()}
          onSelectChange={node => {
            const apiFileResource = node.nodeData;
            if (!apiFileResource) {
              this.setState({ topStatusFileInfo: undefined });
              return;
            }
            this.setState({
              topStatusFileInfo: {
                fileResourceId: apiFileResource.fileResourceId,
                isFile: apiFileResource.isFile,
                path: apiFileResource.path,
                name: apiFileResource.name,
                httpApiId: apiFileResource.httpApiId,
                requestMapping: apiFileResource.requestMapping,
                requestMethod: apiFileResource.requestMethod,
              }
            });
          }}
          onOpenFile={apiFileResource => {
            if (apiFileResource.isFile !== 1) return;
            this.setCurrentEditId(apiFileResource.fileResourceId, apiFileResource.httpApiId);
          }}
        />
        <div className={cls({ [styles.hide]: leftPanel !== LeftPanelEnum.TimedTask })}>
          TimedTask
        </div>
        <div className={cls({ [styles.hide]: leftPanel !== LeftPanelEnum.Expand })}>
          Expand
        </div>
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
          JDBC
        </div>
        <div className={cls({ [styles.hide]: rightPanel !== RightPanelEnum.Redis })}>
          Redis
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
          key={file.fileResource.id}
          className={cls(styles.flexItemColumn, styles.fileTabsItem, { [styles.fileTabsItemActive]: currentEditId === file.fileResource.id })}
          onClick={() => this.setCurrentEditId(file.fileResource.id)}
        >
          <Icon component={getFileIcon(file.fileResource.name)} className={styles.fileTabsItemType}/>
          {file.fileResource.name}
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
    return (<div className={cls(styles.editorTabs, styles.flexColumn, { [styles.hide]: fileTabs.length <= 0 })}>{fileTabs}</div>);
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
        defaultLanguage={languageEnum.javascript}
        defaultValue={""}
        value={openFile?.fileResource?.content}
        theme={themeEnum.IdeaDracula}
        options={editorDefOptions}
        loading={<Spinner intent={Intent.PRIMARY} size={SpinnerSize.STANDARD}/>}
        onMount={(editor, monaco) => {
          this.editor = editor;
          this.editor.layout();
          initKeyBinding(editor, monaco);
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
            onDragEnd={sizes => this.setState({ hSplitSize: sizes as any })}
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
          <div className={cls(styles.bottomPane, { [styles.hide]: noValue(bottomPanel) })}>
            {this.getVSplitTabs()}
          </div>
        </Split>
      </>
    );
  }

  public render() {
    console.log("### render", this.state);
    return this.getLayout();
  }
}

export default Workbench;
