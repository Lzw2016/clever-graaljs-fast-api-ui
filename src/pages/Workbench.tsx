import React from "react";
import cls from "classnames";
import lodash from "lodash";
import { Spin } from "antd";
import Icon, {
  ApiOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  ControlOutlined,
  FolderFilled,
  GithubOutlined,
  HistoryOutlined,
  Loading3QuartersOutlined,
  LockOutlined,
  MinusOutlined,
  QqOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  UnlockOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";
import "react-reflex/styles.css";
import * as MonacoApi from "monaco-editor/esm/vs/editor/editor.api";
import Editor from "@monaco-editor/react";
import IconFont from "@/components/IconFont";
import { editorDefOptions, initKeyBinding, languageEnum, themeEnum } from "@/utils/editor-utils";
import { ChevronDown, ChevronUp, JsFile, JsonFile, YmlFile } from "@/utils/IdeaIconUtils";
import { TypeEnum, variableTypeOf } from "@/utils/typeof";
import logo from "@/assets/logo.svg";
import styles from "./Workbench.module.less";

/** 布局状态 */
interface LayoutSize {
  /** 左侧容器宽度 */
  leftSize: number;
  /** 是否显示左侧容器 */
  showLeft: boolean;
  /** 右侧容器宽度 */
  rightSize: number;
  /** 是否显示右侧容器 */
  showRight: boolean;
  /** 底部侧容器宽度 */
  bottomSize: number;
  /** 是否显示底部侧容器 */
  showBottom: boolean;
}

enum LayoutPanelEnum {
  Left,
  Right,
  Bottom,
}

interface WorkbenchProps {
}

interface WorkbenchState extends LayoutSize {
}

class Workbench extends React.Component<WorkbenchProps, WorkbenchState> {
  static defaultState: WorkbenchState = {
    leftSize: 256,
    showLeft: true,
    rightSize: 256,
    showRight: true,
    bottomSize: 200,
    showBottom: true,
  };

  /**
   * 编辑器实例
   */
  private editor: MonacoApi.editor.IStandaloneCodeEditor | undefined;
  /**
   * 编辑器大小自适应
   */
  private editorResize = lodash.debounce(() => this.editor?.layout(), 60, { maxWait: 150 });
  /**
   * 分隔面板大小自适应
   */
  private splitPaneResize = {
    onResize: (e: any) => e?.domElement?.classList?.add("resizing"),
    onStopResize: (e: any) => e?.domElement?.classList?.remove("resizing"),
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

  public setLayoutSize(layoutSize: Partial<LayoutSize>) {
    if (variableTypeOf(layoutSize.leftSize) === TypeEnum.number) this.setState({ leftSize: layoutSize.leftSize! });
    if (variableTypeOf(layoutSize.rightSize) === TypeEnum.number) this.setState({ rightSize: layoutSize.rightSize! });
    if (variableTypeOf(layoutSize.bottomSize) === TypeEnum.number) this.setState({ bottomSize: layoutSize.bottomSize! });
  }

  public toggleLayoutPanel(layoutPanel: LayoutPanelEnum) {
    if (layoutPanel === LayoutPanelEnum.Left) this.setState({ showLeft: !this.state.showLeft });
    if (layoutPanel === LayoutPanelEnum.Right) this.setState({ showRight: !this.state.showRight });
    if (layoutPanel === LayoutPanelEnum.Bottom) this.setState({ showBottom: !this.state.showBottom });
  }

  private getLayout() {
    const { leftSize, showLeft, rightSize, showRight, bottomSize, showBottom } = this.state;
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
              className={cls(styles.flexItemRow, styles.verticalTabsItem, styles.verticalTabsItemActive)}
              onClick={() => this.toggleLayoutPanel(LayoutPanelEnum.Left)}
            >
              接口文件<FolderFilled/>
            </div>
            <div className={cls(styles.flexItemRow, styles.verticalTabsItem)}>
              自定义扩展<FolderFilled/>
            </div>
            <div className={cls(styles.flexItemRow, styles.verticalTabsItem)}>
              初始化脚本<FolderFilled/>
            </div>
            <div className={styles.flexItemRowHeightFull}/>
          </div>
          {/*内层中间区域*/}
          <ReflexContainer orientation="horizontal" maxRecDepth={1}>
            {/*IDE左、中、右部面板*/}
            <ReflexElement {...this.splitPaneResize} minSize={128}>
              <ReflexContainer orientation="vertical" maxRecDepth={1}>
                {/*IDE左部面板 - 文件管理器等*/}
                <ReflexElement
                  {...this.splitPaneResize}
                  size={showLeft ? leftSize : 0}
                  minSize={showLeft ? 64 : 0}
                  maxSize={512}
                  className={styles.leftPane}
                  onStopResize={e => {
                    this.splitPaneResize.onStopResize(e);
                    this.setLayoutSize({ leftSize: (e.domElement as any)?.offsetWidth });
                  }}
                >
                </ReflexElement>
                <ReflexSplitter
                  propagate={true}
                  className={showLeft ? styles.leftResizerStyle : styles.leftResizerStyleHide}
                  {...this.splitPaneResize}
                  onResize={this.editorResize}
                />
                {/*IDE中部面板 - 编辑器*/}
                <ReflexElement {...this.splitPaneResize} minSize={256} className={styles.editorPane}>
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
                    width={"100%"}
                    height={"100%"}
                    defaultLanguage={languageEnum.javascript}
                    defaultValue={""}
                    theme={themeEnum.IdeaDracula}
                    options={editorDefOptions}
                    loading={<Spin delay={200} spinning={true} indicator={<Loading3QuartersOutlined style={{ fontSize: 32 }} spin/>}/>}
                    onMount={(editor, monaco) => {
                      this.editor = editor;
                      this.editor.layout();
                      initKeyBinding(editor, monaco);
                    }}
                  />
                </ReflexElement>
                <ReflexSplitter
                  propagate={true}
                  className={styles.rightResizerStyle}
                  {...this.splitPaneResize}
                  onResize={this.editorResize}
                />
                {/*IDE右部面板 - 数据库管理器等*/}
                <ReflexElement
                  {...this.splitPaneResize}
                  size={showRight ? rightSize : 0}
                  minSize={64}
                  maxSize={512}
                  className={styles.rightPane}
                  onStopResize={e => {
                    this.splitPaneResize.onStopResize(e);
                    this.setLayoutSize({ rightSize: (e.domElement as any)?.offsetWidth });
                  }}
                >

                </ReflexElement>
              </ReflexContainer>
            </ReflexElement>
            <ReflexSplitter
              propagate={true}
              className={cls(styles.splitTabsResizerStyle, styles.flexColumn)}
              {...this.splitPaneResize}
              onResize={this.editorResize}
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
              <Icon component={ChevronUp} className={cls(styles.flexItemColumn, styles.icon, styles.bottomTabsIcon)} onMouseDown={e => e.stopPropagation()}/>
              <Icon component={ChevronDown} className={cls(styles.flexItemColumn, styles.icon, styles.bottomTabsIcon)} onMouseDown={e => e.stopPropagation()}/>
              <MinusOutlined className={cls(styles.flexItemColumn, styles.icon, styles.bottomTabsIcon)} onMouseDown={e => e.stopPropagation()}/>
              <div className={cls(styles.flexItemColumn)} style={{ width: 2 }}/>
            </ReflexSplitter>
            {/*IDE底部面板*/}
            <ReflexElement
              {...this.splitPaneResize}
              size={showBottom ? bottomSize : 0}
              minSize={64}
              className={styles.bottomPane}
              onStopResize={e => {
                this.splitPaneResize.onStopResize(e);
                this.setLayoutSize({ bottomSize: (e.domElement as any)?.offsetHeight });
              }}
            >

            </ReflexElement>
          </ReflexContainer>
          {/*右边多叶签栏*/}
          <div className={cls(styles.flexItemColumn, styles.rightTabs, styles.flexRow)} style={{ alignItems: "center" }}>
            <div className={cls(styles.flexItemRow, styles.verticalTabsItem, styles.verticalTabsItemActive)} style={{ height: 110 }}>
              <IconFont type="icon-database"/>
              <div style={{ marginTop: 6, marginBottom: 16, marginLeft: -2, transform: "rotate(90deg)" }}>JDBC</div>
              数据库
            </div>
            <div className={cls(styles.flexItemRow, styles.verticalTabsItem)} style={{ height: 110 }}>
              <IconFont type="icon-redis"/>
              <div style={{ marginTop: 6, marginBottom: 16, marginLeft: -2, transform: "rotate(90deg)" }}>Redis</div>
              数据库
            </div>
            <div className={cls(styles.flexItemRow, styles.verticalTabsItem)} style={{ height: 146 }}>
              <IconFont type="icon-elasticsearch"/>
              <div style={{ marginTop: 6, marginLeft: -2, transform: "rotate(90deg)" }}>Elasticsearch</div>
            </div>
            <div className={styles.flexItemRowHeightFull}/>
          </div>
        </div>
        {/*底部多叶签栏*/}
        <div className={cls(styles.flexItemRow, styles.bottomTabs, styles.flexColumn)} style={{ alignItems: "center" }}>
          <div className={cls(styles.flexItemColumn, styles.horizontalTabsFirst)}/>
          <div className={cls(styles.flexItemColumn, styles.horizontalTabsItem, styles.horizontalTabsItemActive)}>
            {/*接口路由|接口文档*/}
            <ApiOutlined/>接口配置
          </div>
          <div className={cls(styles.flexItemColumn, styles.horizontalTabsItem)}>
            {/*请求参数(单选列表)*/}
            <IconFont type="icon-http"/>请求配置
          </div>
          <div className={cls(styles.flexItemColumn, styles.horizontalTabsItem)}>
            {/*HTTP请求响应数据|运行日志*/}
            <IconFont type="icon-run"/>运行结果
          </div>
          <div className={cls(styles.flexItemColumn, styles.horizontalTabsItem)}>
            {/*HTTP全局请求配置*/}
            <ControlOutlined/>全局请求参数
          </div>
          <div className={cls(styles.flexItemColumnWidthFull)}/>
          <div className={cls(styles.flexItemColumn, styles.horizontalTabsItem)}>
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
    console.log("### render");
    return this.getLayout();
  }
}

export default Workbench;
