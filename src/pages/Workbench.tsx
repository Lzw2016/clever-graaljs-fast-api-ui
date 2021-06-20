import React from "react";
import cls from "classnames";
import lodash from "lodash";
import { Spin } from "antd";
import {
  ApiOutlined,
  ControlOutlined,
  FolderFilled,
  GithubOutlined,
  HistoryOutlined,
  Loading3QuartersOutlined,
  LockOutlined,
  QqOutlined,
  QuestionCircleOutlined,
  UnlockOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";
import "react-reflex/styles.css";
import * as MonacoApi from "monaco-editor/esm/vs/editor/editor.api";
import Editor from "@monaco-editor/react";
import { editorDefOptions, initKeyBinding, languageEnum, themeEnum } from "@/utils/editor-utils";
import IconFont from "@/components/IconFont";
import logo from "@/assets/logo.svg";
import styles from "./Workbench.module.less";

interface WorkbenchProps {
}

interface WorkbenchState {

}

class Workbench extends React.Component<WorkbenchProps, WorkbenchState> {
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
  }

  public componentDidMount() {
    window.addEventListener("resize", this.editorResize);
  }

  public componentWillUnmount() {
    window.removeEventListener("resize", this.editorResize);
  }

  private getLayout() {
    return (
      <div className={styles.flexRow}>
        {/*顶部菜单栏*/}
        <div className={cls(styles.flexItemRow, styles.topMenu, styles.flexColumn)} style={{ alignItems: "center" }}>
          <div className={cls(styles.flexItemColumn, styles.logo)} style={{ marginLeft: 2 }}>
            <img src={logo} alt={"logo"}/> Fast-API
            <span>0.0.1</span>
          </div>
          <div className={cls(styles.flexItemColumnWidthFull)}/>
          <IconFont type="icon-run" className={cls(styles.flexItemColumn, styles.icon)} style={{ color: "#499C54" }}/>
          <IconFont type="icon-save" className={cls(styles.flexItemColumn, styles.icon)}/>
          <LockOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
          <UnlockOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
          <IconFont type="icon-search" className={cls(styles.flexItemColumn, styles.icon)}/>
          <HistoryOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
          <IconFont type="icon-keyboard" className={cls(styles.flexItemColumn, styles.icon)} style={{ fontSize: 22, padding: "2px 6px" }}/>
          <div className={cls(styles.flexItemColumn)} style={{ width: 16 }}/>
          <IconFont type="icon-gitee" className={cls(styles.flexItemColumn, styles.icon)} style={{ padding: "6px 4px" }}/>
          <GithubOutlined className={cls(styles.flexItemColumn, styles.icon)} style={{ padding: "6px 4px" }}/>
          <QqOutlined className={cls(styles.flexItemColumn, styles.icon)} style={{ padding: "6px 4px" }}/>
          <WechatOutlined className={cls(styles.flexItemColumn, styles.icon)} style={{ padding: "6px 4px" }}/>
          <QuestionCircleOutlined className={cls(styles.flexItemColumn, styles.icon)} style={{ padding: "6px 4px" }}/>
          <div className={cls(styles.flexItemColumn)} style={{ marginRight: 16 }}/>
        </div>
        {/*顶部工具栏*/}
        {/*<div className={cls(styles.flexItemRow, styles.topStatus)}></div>*/}
        {/*外层中间区域*/}
        <div className={cls(styles.flexItemRowHeightFull, styles.flexColumn)}>
          {/*左边多叶签栏*/}
          <div className={cls(styles.flexItemColumn, styles.leftTabs, styles.flexRow)} style={{ alignItems: "center" }}>
            <div className={cls(styles.flexItemRow, styles.verticalTabsItem, styles.verticalTabsItemActive)}>
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
                <ReflexElement {...this.splitPaneResize} size={256} minSize={64} className={styles.leftPane}>

                </ReflexElement>
                <ReflexSplitter
                  propagate={true}
                  className={styles.leftResizerStyle}
                  {...this.splitPaneResize}
                  onResize={this.editorResize}
                />
                {/*IDE中部面板 - 编辑器*/}
                <ReflexElement {...this.splitPaneResize} minSize={256} className={styles.editorPane}>
                  {/*Monaco编辑器文件叶签*/}
                  <div className={cls(styles.flexItemRow, styles.editorTabs)}>

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
                <ReflexElement {...this.splitPaneResize} size={256} minSize={64} className={styles.rightPane}>

                </ReflexElement>
              </ReflexContainer>
            </ReflexElement>
            <ReflexSplitter
              propagate={true}
              className={styles.horizontalResizerStyle}
              {...this.splitPaneResize}
              onResize={this.editorResize}
            />
            {/*IDE底部面板*/}
            <ReflexElement {...this.splitPaneResize} size={200} minSize={64} className={styles.bottomPane}>

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
    return this.getLayout();
  }
}

export default Workbench;
