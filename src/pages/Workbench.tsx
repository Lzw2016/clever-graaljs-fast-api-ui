import React from "react";
import cls from "classnames";
import lodash from "lodash";
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";
import "react-reflex/styles.css";
import * as MonacoApi from "monaco-editor/esm/vs/editor/editor.api";
import Editor from "@monaco-editor/react";
import { editorDefOptions, initKeyBinding, languageEnum, themeEnum } from "@/utils/editor-utils";
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
  private editorResize = lodash.debounce(() => this.editor?.layout(), 30, { maxWait: 150 });
  /**
   * 分隔面板大小自适应
   */
  private splitPaneResize = {
    onResize: (e: any) => e?.domElement?.classList?.add('resizing'),
    onStopResize: (e: any) => e?.domElement?.classList?.remove('resizing'),
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
        <div className={cls(styles.flexItemRow, styles.topMenu)}>
        </div>
        {/*顶部工具栏*/}
        <div className={cls(styles.flexItemRow, styles.topStatus)}>
        </div>
        {/*外层中间区域*/}
        <div className={cls(styles.flexItemRowHeightFull, styles.flexColumn)}>
          {/*左边多叶签栏*/}
          <div className={cls(styles.flexItemColumn, styles.leftTabs)}>
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
                    wrapperClassName={styles.editorWrapper}
                    className={styles.editor}
                    width={"100%"}
                    height={"100%"}
                    defaultLanguage={languageEnum.javascript}
                    defaultValue={""}
                    theme={themeEnum.IdeaDracula}
                    options={editorDefOptions}
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
            <ReflexElement {...this.splitPaneResize} size={256} minSize={64} className={styles.bottomPane}>

            </ReflexElement>
          </ReflexContainer>
          {/*右边多叶签栏*/}
          <div className={cls(styles.flexItemColumn, styles.rightTabs)}>
          </div>
        </div>
        {/*底部多叶签栏*/}
        <div className={cls(styles.flexItemRow, styles.bottomTabs)}>
        </div>
        {/*底部状态栏*/}
        <div className={cls(styles.flexItemRow, styles.bottomStatus)}>
        </div>
      </div>
    );
  }

  public render() {
    return this.getLayout();
  }
}

export default Workbench;
