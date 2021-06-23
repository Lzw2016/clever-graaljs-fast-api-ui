import React from "react";
import cls from "classnames";
import lodash from "lodash";
import Icon, {
  ApiOutlined,
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
  WechatOutlined,
} from "@ant-design/icons";
import { Spinner } from "@blueprintjs/core";
import "react-reflex/styles.css";
import { ReflexContainer, ReflexElement, ReflexElementProps, ReflexSplitter } from "react-reflex";
import * as MonacoApi from "monaco-editor/esm/vs/editor/editor.api";
import Editor from "@monaco-editor/react";
import IconFont from "@/components/IconFont";
import { FileResourceTree } from "@/components/ide";
import { editorDefOptions, initKeyBinding, languageEnum, themeEnum } from "@/utils/editor-utils";
import { ChevronDown, ChevronUp, JsFile, JsonFile, YmlFile } from "@/utils/IdeaIconUtils";
import { hasValue, noValue } from "@/utils/utils";
import { TypeEnum, variableTypeOf } from "@/utils/typeof";
import logo from "@/assets/logo.svg";
import styles from "./Workbench.module.less";

// enum LayoutPanelEnum {
//   Left,
//   Right,
//   Bottom,
// }

enum LeftPanelEnum {
  /** 接口文件 */
  Interface,
  /** 自定义扩展 */
  Expand,
  /** 初始化脚本 */
  Initialization
}

enum RightPanelEnum {
  /** JDBC数据库 */
  JDBC,
  /** Redis数据库 */
  Redis,
  /** Elasticsearch数据库 */
  Elasticsearch
}

enum BottomPanelEnum {
  /** 接口配置 */
  Interface,
  /** 请求配置 */
  Request,
  /** 运行结果 */
  RunResult,
  /** 全局请求参数 */
  GlobalConfig,
  /** 系统事件 */
  SysEvent,
}

/** 文件资源 */
interface FileResource {
// TODO 文件资源
}

/** HTTP接口 */
interface HttpApi {
// TODO HTTP接口
}

interface EditorTabItem {
  /** 顺序(由小到大) */
  sort: number;
  /** 文件 */
  fileResource: FileResource,
  /** 是否需要保存 */
  needSave: boolean;
  /** Http接口 */
  httpApi?: HttpApi,
  /** TODO 请求参数(列表) */
  httpApiRequestParamList?: Array<any>;
  /** TODO API文档 */
  httpApiDoc?: any;
}

/** 布局状态 */
interface LayoutSize {
  /** 左侧容器宽度 */
  leftSize: number;
  /** 左侧容器显示的叶签 */
  leftPanel?: LeftPanelEnum;
  /** 右侧容器宽度 */
  rightSize: number;
  /** 右侧容器显示的叶签 */
  rightPanel?: RightPanelEnum;
  /** 底部侧容器宽度 */
  bottomSize: number;
  /** 底部容器显示的叶签 */
  bottomPanel?: BottomPanelEnum;
}

/** 编辑器打开的文件 */
interface EditorTabsState {
  /** 当前编辑的文件ID */
  currentItemId: string;
  /** 当前打开的文件列表 */
  tabItems: Map<string, EditorTabItem>;
  /** 编辑器文件状态 */
  editorStates: { [fileResourceId: string]: MonacoApi.editor.IEditorViewState };
  /**  */
  /**  */
}

interface WorkbenchProps {
}

interface WorkbenchState extends LayoutSize {
}

class Workbench extends React.Component<WorkbenchProps, WorkbenchState> {
  static defaultState: WorkbenchState = {
    leftSize: 256,
    leftPanel: LeftPanelEnum.Interface,
    rightSize: 256,
    rightPanel: RightPanelEnum.JDBC,
    bottomSize: 200,
    bottomPanel: BottomPanelEnum.GlobalConfig,
  };

  /**
   * 编辑器实例
   */
  private editor: MonacoApi.editor.IStandaloneCodeEditor | undefined;
  /**
   * 编辑器大小自适应
   */
  private editorResize = lodash.debounce(() => this.editor?.layout(), 500, { maxWait: 3000 });
  /**
   * 分隔面板大小自适应
   */
  private splitPaneResize: ReflexElementProps = {
    // onResize: e => this.editorResize(),
  };

  constructor(props: Readonly<WorkbenchProps>) {
    super(props);
    this.state = { ...Workbench.defaultState };
  }

  // 组件挂载后
  public componentDidMount() {
    window.addEventListener("resize", this.editorResize);
  }

  // 组件将要被卸载
  public componentWillUnmount() {
    window.removeEventListener("resize", this.editorResize);
  }

  // 设置布局区域大小
  public setLayoutSize(layoutSize: Partial<LayoutSize>) {
    if (variableTypeOf(layoutSize.leftSize) === TypeEnum.number) this.setState({ leftSize: layoutSize.leftSize! });
    if (variableTypeOf(layoutSize.rightSize) === TypeEnum.number) this.setState({ rightSize: layoutSize.rightSize! });
    if (variableTypeOf(layoutSize.bottomSize) === TypeEnum.number) this.setState({ bottomSize: layoutSize.bottomSize! });
  }

  // 切换左侧布局区域隐藏/显示
  public toggleLeftPanel(panel: LeftPanelEnum) {
    const { leftPanel } = this.state;
    if (panel === LeftPanelEnum.Interface) {
      this.setState({ leftPanel: leftPanel === LeftPanelEnum.Interface ? undefined : LeftPanelEnum.Interface });
    } else if (panel === LeftPanelEnum.Expand) {
      this.setState({ leftPanel: leftPanel === LeftPanelEnum.Expand ? undefined : LeftPanelEnum.Expand });
    } else if (panel === LeftPanelEnum.Initialization) {
      this.setState({ leftPanel: leftPanel === LeftPanelEnum.Initialization ? undefined : LeftPanelEnum.Initialization });
    }
  }

  // 切换右侧布局区域隐藏/显示
  public toggleRightPanel(panel: RightPanelEnum) {
    const { rightPanel } = this.state;
    if (panel === RightPanelEnum.JDBC) {
      this.setState({ rightPanel: rightPanel === RightPanelEnum.JDBC ? undefined : RightPanelEnum.JDBC });
    } else if (panel === RightPanelEnum.Redis) {
      this.setState({ rightPanel: rightPanel === RightPanelEnum.Redis ? undefined : RightPanelEnum.Redis });
    } else if (panel === RightPanelEnum.Elasticsearch) {
      this.setState({ rightPanel: rightPanel === RightPanelEnum.Elasticsearch ? undefined : RightPanelEnum.Elasticsearch });
    }
  }

  // 切换底部布局区域隐藏/显示
  public toggleBottomPanel(panel?: BottomPanelEnum) {
    const { bottomPanel } = this.state;
    if (panel === BottomPanelEnum.Interface) {
      this.setState({ bottomPanel: bottomPanel === BottomPanelEnum.Interface ? undefined : BottomPanelEnum.Interface });
    } else if (panel === BottomPanelEnum.Request) {
      this.setState({ bottomPanel: bottomPanel === BottomPanelEnum.Request ? undefined : BottomPanelEnum.Request });
    } else if (panel === BottomPanelEnum.RunResult) {
      this.setState({ bottomPanel: bottomPanel === BottomPanelEnum.RunResult ? undefined : BottomPanelEnum.RunResult });
    } else if (panel === BottomPanelEnum.GlobalConfig) {
      this.setState({ bottomPanel: bottomPanel === BottomPanelEnum.GlobalConfig ? undefined : BottomPanelEnum.GlobalConfig });
    } else if (panel === BottomPanelEnum.SysEvent) {
      this.setState({ bottomPanel: bottomPanel === BottomPanelEnum.SysEvent ? undefined : BottomPanelEnum.SysEvent });
    } else {
      this.setState({ bottomPanel: undefined });
    }
  }

  private getLayout() {
    const { leftSize, leftPanel, rightSize, rightPanel, bottomSize, bottomPanel } = this.state;
    return (
      <div className={styles.flexRow}>
        {/*顶部菜单栏*/}
        <div className={cls(styles.flexItemRow, styles.topMenu, styles.flexColumn)} style={{ alignItems: "center" }}>
          <div className={cls(styles.flexItemColumn, styles.logo)} style={{ marginLeft: 2 }}>
            <img src={logo} alt={"logo"}/> Fast-API
            <span>0.0.1</span>
          </div>
          <div className={cls(styles.flexItemColumnWidthFull)}/>
          {/*<div className={cls(styles.flexItemColumn)} style={{ width: 16 }}/>*/}
          <IconFont type="icon-gitee" className={cls(styles.flexItemColumn, styles.icon)}/>
          <GithubOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
          <QqOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
          <WechatOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
          <QuestionCircleOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
          <div className={cls(styles.flexItemColumn)} style={{ marginRight: 16 }}/>
        </div>
        {/*顶部工具栏*/}
        <div className={cls(styles.flexItemRow, styles.topStatus, styles.flexColumn)} style={{ alignItems: "center" }}>
          <div className={cls(styles.flexItemColumn)} style={{ width: 24 }}/>
          <div className={cls(styles.flexItemColumn, styles.fileResourcePath)}>
            /clever-graaljs/clever-graaljs-data-jdbc/src/builtin/
            <span className={styles.fileModify}>JdbcDatabaseTest.js</span>
          </div>
          <div className={cls(styles.flexItemColumn, styles.fileResourcePath)}>
            <ArrowRightOutlined style={{ fontSize: 10, padding: "0 8px 0 8px" }}/>
          </div>
          <SettingOutlined className={cls(styles.flexItemColumn, styles.icon)} style={{ fontSize: 14, padding: "4px 4px" }}/>
          <div className={cls(styles.flexItemColumn, styles.fileResourcePath)}>
            [GET] /api/aaa/bbb/ccc/ddd
          </div>
          <div className={cls(styles.flexItemColumnWidthFull)}/>
          <IconFont type="icon-run" className={cls(styles.flexItemColumn, styles.icon)} style={{ color: "#499C54" }}/>
          <IconFont type="icon-save" className={cls(styles.flexItemColumn, styles.icon)}/>
          <LockOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
          <UnlockOutlined className={cls(styles.flexItemColumn, styles.icon, styles.iconDisable)}/>
          <IconFont type="icon-search" className={cls(styles.flexItemColumn, styles.icon)}/>
          <HistoryOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
          <IconFont type="icon-keyboard" className={cls(styles.flexItemColumn, styles.icon)} style={{ fontSize: 20, padding: "1px 2px" }}/>
          <div className={cls(styles.flexItemColumn)} style={{ marginRight: 16 }}/>
        </div>
        {/*外层中间区域*/}
        <div className={cls(styles.flexItemRowHeightFull, styles.flexColumn)}>
          {/*左边多叶签栏*/}
          <div className={cls(styles.flexItemColumn, styles.leftTabs, styles.flexRow)} style={{ alignItems: "center" }}>
            <div
              className={cls(styles.flexItemRow, styles.verticalTabsItem, { [styles.verticalTabsItemActive]: leftPanel === LeftPanelEnum.Interface })}
              onClick={() => this.toggleLeftPanel(LeftPanelEnum.Interface)}
            >
              接口文件<FolderFilled/>
            </div>
            <div
              className={cls(styles.flexItemRow, styles.verticalTabsItem, { [styles.verticalTabsItemActive]: leftPanel === LeftPanelEnum.Expand })}
              onClick={() => this.toggleLeftPanel(LeftPanelEnum.Expand)}
            >
              自定义扩展<FolderFilled/>
            </div>
            <div
              className={cls(styles.flexItemRow, styles.verticalTabsItem, { [styles.verticalTabsItemActive]: leftPanel === LeftPanelEnum.Initialization })}
              onClick={() => this.toggleLeftPanel(LeftPanelEnum.Initialization)}
            >
              初始化脚本<FolderFilled/>
            </div>
            <div className={styles.flexItemRowHeightFull}/>
          </div>
          {/*内层中间区域*/}
          <ReflexContainer orientation="horizontal" maxRecDepth={1} className={cls(styles.flexItemColumnWidthFull, styles.flexRow)}>
            {/*IDE左、中、右部面板*/}
            <ReflexElement {...this.splitPaneResize} direction={[-1, 1]} minSize={128} className={cls(styles.flexItemRowHeightFull)}>
              <ReflexContainer orientation="vertical" maxRecDepth={1} className={cls(styles.flexColumn)}>
                {/*IDE左部面板 - 文件管理器等*/}
                <ReflexElement
                  {...this.splitPaneResize}
                  className={cls(styles.flexItemColumn, styles.leftPane, { [styles.leftPaneHide]: noValue(leftPanel) }, styles.flexRow)}
                  direction={1}
                  size={hasValue(leftPanel) ? leftSize : 0}
                  minSize={hasValue(leftPanel) ? 64 : 0}
                  maxSize={512}
                  onStopResize={e => this.setLayoutSize({ leftSize: (e.domElement as any)?.offsetWidth })}
                >
                  <FileResourceTree/>
                </ReflexElement>
                <ReflexSplitter
                  propagate={true}
                  className={cls(styles.flexItemColumn, hasValue(leftPanel) ? styles.leftResizerStyle : styles.leftResizerHideStyle)}
                  {...this.splitPaneResize}
                />
                {/*IDE中部面板 - 编辑器*/}
                <ReflexElement {...this.splitPaneResize} className={cls(styles.editorPane, styles.flexItemColumnWidthFull, styles.flexRow)} direction={[-1, 1]} minSize={256}>
                  {/*Monaco编辑器文件叶签*/}
                  <div className={cls(styles.flexItemRow, styles.editorTabs, styles.flexColumn)}>
                    <div className={cls(styles.flexItemColumn, styles.fileTabsItem)}>
                      <Icon component={JsFile} className={styles.fileTabsItemType}/>
                      index01.js
                      <CloseOutlined className={styles.fileTabsItemClose}/>
                    </div>
                    <div className={cls(styles.flexItemColumn, styles.fileTabsItem, styles.fileTabsItemActive)}>
                      <Icon component={YmlFile} className={styles.fileTabsItemType}/>
                      index02.js
                      <CloseOutlined className={styles.fileTabsItemClose}/>
                    </div>
                    <div className={cls(styles.flexItemColumn, styles.fileTabsItem)}>
                      <Icon component={JsonFile} className={styles.fileTabsItemType}/>
                      index03.js
                      <CloseOutlined className={styles.fileTabsItemClose}/>
                    </div>
                    <div className={styles.flexItemColumnWidthFull}/>
                    <div className={cls(styles.flexItemColumn)}/>
                  </div>
                  {/*Monaco编辑器*/}
                  <Editor
                    wrapperClassName={cls(styles.flexItemRowHeightFull, styles.editorWrapper)}
                    className={styles.editor}
                    // width={"100%"}
                    // height={"100%"}
                    defaultLanguage={languageEnum.javascript}
                    defaultValue={""}
                    theme={themeEnum.IdeaDracula}
                    options={editorDefOptions}
                    loading={<Spinner intent={"primary"} size={48}/>}
                    onMount={(editor, monaco) => {
                      this.editor = editor;
                      this.editor.layout();
                      initKeyBinding(editor, monaco);
                    }}
                  />
                </ReflexElement>
                <ReflexSplitter
                  propagate={true}
                  className={cls(styles.flexItemColumn, hasValue(rightPanel) ? styles.rightResizerStyle : styles.rightResizerHideStyle)}
                  {...this.splitPaneResize}
                />
                {/*IDE右部面板 - 数据库管理器等*/}
                <ReflexElement
                  {...this.splitPaneResize}
                  className={cls(styles.flexItemColumn, styles.rightPane, { [styles.rightPaneHide]: noValue(rightPanel) })}
                  direction={-1}
                  size={hasValue(rightPanel) ? rightSize : 0}
                  minSize={hasValue(rightPanel) ? 64 : 0}
                  maxSize={512}
                  onStopResize={e => this.setLayoutSize({ rightSize: (e.domElement as any)?.offsetWidth })}
                >
                </ReflexElement>
              </ReflexContainer>
            </ReflexElement>
            <ReflexSplitter
              propagate={true}
              className={cls(styles.flexItemRow, hasValue(bottomPanel) ? styles.splitTabsResizerStyle : styles.splitTabsResizerHideStyle, styles.flexColumn)}
              {...this.splitPaneResize}
            >
              <div className={cls(styles.flexItemColumn, styles.splitTabsLabel)}>接口配置:</div>
              <div className={cls(styles.flexItemColumn, styles.splitTabsItem, styles.splitTabsItemActive)} onMouseDown={e => e.stopPropagation()}>
                叶签1<CloseOutlined/>
              </div>
              <div className={cls(styles.flexItemColumn, styles.splitTabsItem)} onMouseDown={e => e.stopPropagation()}>
                叶签2<CloseOutlined/>
              </div>
              <div className={cls(styles.flexItemColumn, styles.splitTabsItem)} onMouseDown={e => e.stopPropagation()}>
                叶签3<CloseOutlined/>
              </div>
              <div className={cls(styles.flexItemColumnWidthFull)}/>
              {
                bottomSize < 666 &&
                <Icon
                  component={ChevronUp}
                  className={cls(styles.flexItemColumn, styles.icon, styles.bottomTabsIcon)}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => this.setLayoutSize({ bottomSize: 666 })}
                />
              }
              {
                bottomSize >= 666 &&
                <Icon
                  component={ChevronDown}
                  className={cls(styles.flexItemColumn, styles.icon, styles.bottomTabsIcon)}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => this.setLayoutSize({ bottomSize: 64 })}
                />
              }
              <MinusOutlined
                className={cls(styles.flexItemColumn, styles.icon, styles.bottomTabsIcon)}
                onMouseDown={e => e.stopPropagation()}
                onClick={() => this.toggleBottomPanel()}
              />
              <div className={cls(styles.flexItemColumn)} style={{ width: 2 }}/>
            </ReflexSplitter>
            {/*IDE底部面板*/}
            <ReflexElement
              className={cls(styles.flexItemRow, styles.bottomPane, { [styles.bottomPaneHide]: noValue(bottomPanel) })}
              {...this.splitPaneResize}
              direction={-1}
              size={hasValue(bottomPanel) ? bottomSize : 0}
              minSize={hasValue(bottomPanel) ? 64 : 0}
              onStopResize={e => this.setLayoutSize({ bottomSize: (e.domElement as any)?.offsetHeight })}
            >
            </ReflexElement>
          </ReflexContainer>
          {/*右边多叶签栏*/}
          <div className={cls(styles.flexItemColumn, styles.rightTabs, styles.flexRow)} style={{ alignItems: "center" }}>
            <div
              className={cls(styles.flexItemRow, styles.verticalTabsItem, { [styles.verticalTabsItemActive]: rightPanel === RightPanelEnum.JDBC })}
              style={{ height: 110 }}
              onClick={() => this.toggleRightPanel(RightPanelEnum.JDBC)}
            >
              <IconFont type="icon-database"/>
              <div style={{ marginTop: 6, marginBottom: 16, marginLeft: -2, transform: "rotate(90deg)" }}>JDBC</div>
              数据库
            </div>
            <div
              className={cls(styles.flexItemRow, styles.verticalTabsItem, { [styles.verticalTabsItemActive]: rightPanel === RightPanelEnum.Redis })}
              style={{ height: 110 }}
              onClick={() => this.toggleRightPanel(RightPanelEnum.Redis)}
            >
              <IconFont type="icon-redis"/>
              <div style={{ marginTop: 6, marginBottom: 16, marginLeft: -2, transform: "rotate(90deg)" }}>Redis</div>
              数据库
            </div>
            <div
              className={cls(styles.flexItemRow, styles.verticalTabsItem, { [styles.verticalTabsItemActive]: rightPanel === RightPanelEnum.Elasticsearch })}
              style={{ height: 146 }}
              onClick={() => this.toggleRightPanel(RightPanelEnum.Elasticsearch)}
            >
              <IconFont type="icon-elasticsearch"/>
              <div style={{ marginTop: 6, marginLeft: -2, transform: "rotate(90deg)" }}>Elasticsearch</div>
            </div>
            <div className={styles.flexItemRowHeightFull}/>
          </div>
        </div>
        {/*底部多叶签栏*/}
        <div className={cls(styles.flexItemRow, styles.bottomTabs, styles.flexColumn)} style={{ alignItems: "center" }}>
          <div className={cls(styles.flexItemColumn, styles.horizontalTabsFirst)}/>
          <div
            className={cls(styles.flexItemColumn, styles.horizontalTabsItem, { [styles.horizontalTabsItemActive]: bottomPanel === BottomPanelEnum.Interface })}
            onClick={() => this.toggleBottomPanel(BottomPanelEnum.Interface)}
          >
            {/*接口路由|接口文档*/}
            <ApiOutlined/>接口配置
          </div>
          <div
            className={cls(styles.flexItemColumn, styles.horizontalTabsItem, { [styles.horizontalTabsItemActive]: bottomPanel === BottomPanelEnum.Request })}
            onClick={() => this.toggleBottomPanel(BottomPanelEnum.Request)}
          >
            {/*请求参数(单选列表)*/}
            <IconFont type="icon-http"/>请求配置
          </div>
          <div
            className={cls(styles.flexItemColumn, styles.horizontalTabsItem, { [styles.horizontalTabsItemActive]: bottomPanel === BottomPanelEnum.RunResult })}
            onClick={() => this.toggleBottomPanel(BottomPanelEnum.RunResult)}
          >
            {/*HTTP请求响应数据|运行日志*/}
            <IconFont type="icon-run"/>运行结果
          </div>
          <div
            className={cls(styles.flexItemColumn, styles.horizontalTabsItem, { [styles.horizontalTabsItemActive]: bottomPanel === BottomPanelEnum.GlobalConfig })}
            onClick={() => this.toggleBottomPanel(BottomPanelEnum.GlobalConfig)}
          >
            {/*HTTP全局请求配置*/}
            <ControlOutlined/>全局请求参数
          </div>
          <div className={cls(styles.flexItemColumnWidthFull)}/>
          <div
            className={cls(styles.flexItemColumn, styles.horizontalTabsItem, { [styles.horizontalTabsItemActive]: bottomPanel === BottomPanelEnum.SysEvent })}
            onClick={() => this.toggleBottomPanel(BottomPanelEnum.SysEvent)}
          >
            <IconFont type="icon-message"/>系统事件
          </div>
          <div className={cls(styles.flexItemColumn)} style={{ marginRight: 16 }}/>
        </div>
        {/*底部状态栏*/}
        <div className={cls(styles.flexItemRow, styles.bottomStatus, styles.flexColumn)} style={{ alignItems: "center" }}>
          <div className={cls(styles.flexItemColumn, styles.statusTabsFirst)}/>
          <div className={cls(styles.flexItemColumn, styles.statusTabsItem)} style={{ paddingLeft: 0 }}>
            正在检查更新，请稍候...
          </div>
          <div className={cls(styles.flexItemColumnWidthFull)}/>
          <div className={cls(styles.flexItemColumn, styles.statusTabsItem)}>
          </div>
        </div>
      </div>
    );
  }

  public render() {
    console.log("### render", this.state);
    return this.getLayout();
  }
}

export default Workbench;
