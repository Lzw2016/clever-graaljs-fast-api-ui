import React from "react";
import cls from "classnames";
import Split from "react-split";
import styles from "./App6.module.less";
import ReactDOM from "react-dom";
import Editor from "@monaco-editor/react";
import { editorDefOptions, initKeyBinding, languageEnum } from "@/utils/editor-utils";
import { Intent, Spinner, SpinnerSize } from "@blueprintjs/core";
import * as MonacoApi from "monaco-editor";
import lodash from "lodash";

interface AppProps {
}

interface AppState {
  bottom: boolean;
  sizes1: [number, number];
  sizes1_c: [number, number];
  left: boolean;
  right: boolean;
  sizes2: [number, number, number];
  sizes2_c: [number, number, number];
}

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps, context: any) {
    super(props, context);
    this.state = { bottom: true, sizes1: [80, 20], sizes1_c: [80, 20], left: true, right: true, sizes2: [10, 80, 10], sizes2_c: [10, 80, 10] };
  }

  private instance1: Split | null = null;
  private instance2: Split | null = null;

  /**
   * 编辑器实例
   */
  private editor: MonacoApi.editor.IStandaloneCodeEditor | undefined;
  /**
   * 编辑器大小自适应
   */
  private editorResize = lodash.debounce(() => this.editor?.layout(), 500, { maxWait: 3000 });

  render() {
    const { bottom, sizes1, sizes1_c, left, right, sizes2, sizes2_c } = this.state;
    console.log("### sizes1 ", sizes1, " sizes1_c ", sizes1_c, " sizes2", sizes2, " sizes2_c ", sizes2_c);
    return (
      <>
        <div className={styles.top1}>Top1</div>
        <div className={styles.top2}>Top2</div>
        <div className={styles.bottom1}>
          Bottom1
        </div>
        <div className={styles.bottom2}>
          Bottom2
          <button
            onClick={() => {
              // console.log("#### ", this.instance1)
              const newBottom = !bottom;
              if (newBottom) {
                sizes1_c[1] = sizes1[1];
              } else {
                sizes1_c[1] = 0;
              }
              sizes1_c[0] = 100 - sizes1_c[1];
              this.setState({ bottom: newBottom, sizes1_c });
            }}
          >
            底部
          </button>
        </div>
        <div className={styles.left}>
          <button
            onClick={() => {
              // console.log("#### ", this.instance)
              const newLeft = !left;
              if (newLeft) {
                sizes2_c[0] = sizes2[0];
              } else {
                sizes2_c[0] = 0;
              }
              if (right) {
                sizes2_c[2] = sizes2[2];
              } else {
                sizes2_c[2] = 0;
              }
              sizes2_c[1] = 100 - sizes2_c[0] - sizes2_c[2];
              this.setState({ left: newLeft, sizes2_c });
            }}
          >
            左
          </button>
        </div>
        <div className={styles.right}>
          <button
            onClick={() => {
              // console.log("#### ", this.instance)
              const newRight = !right;
              if (left) {
                sizes2_c[0] = sizes2[0];
              } else {
                sizes2_c[0] = 0;
              }
              if (newRight) {
                sizes2_c[2] = sizes2[2];
              } else {
                sizes2_c[2] = 0;
              }
              sizes2_c[1] = 100 - sizes2_c[0] - sizes2_c[2];
              this.setState({ right: newRight, sizes2_c });
            }}
          >
            右
          </button>
        </div>
        <Split
          ref={instance => {
            this.instance1 = instance;
          }}
          className={cls(styles.split1, styles.center, { [styles.hideGutter]: !bottom })}
          direction={"vertical"}
          sizes={bottom ? sizes1 : sizes1_c}
          minSize={[64, bottom ? 64 : 0]}
          maxSize={[Infinity, Infinity]}
          snapOffset={0}
          dragInterval={1}
          gutterSize={0}
          elementStyle={(dimension, elementSize, gutterSize, index) => {
            // return { flexBasis: `calc(${elementSize}% - 12px)` };
            // if (index === 0) {
            //   return { flex: `1 1 ${elementSize}%` };
            // }
            // return { flexBasis: `${elementSize}%` };
            return { height: `${elementSize}%` };
          }}
          gutterStyle={(dimension, gutterSize, index) => {
            // console.log("### gutterStyle ", index)
            const css: Partial<CSSStyleDeclaration> = { width: "100%", height: "24px" };
            // css.marginTop = "-8px";
            return css;
          }}
          onDragEnd={sizes => {
            // console.log("### onDragEnd ", sizes);
            this.editor?.layout();
            this.setState({ sizes1: sizes as any });
          }}
          gutter={(index, direction) => {
            const element = document.createElement("div");
            element.className = cls("gutter gutter-vertical test");
            ReactDOM.render((
              <>
                <span>AAA</span>
                <span>BBB</span>
              </>
            ), element);
            return element;
          }}
        >
          {/*<div/>*/}
          <Split
            ref={instance => {
              this.instance2 = instance;
            }}
            className={cls(styles.split2)}
            direction={"horizontal"}
            sizes={!left || !right ? sizes2_c : sizes2}
            minSize={[left ? 64 : 0, 256, right ? 64 : 0]}
            maxSize={[512, Infinity, 512]}
            snapOffset={0}
            dragInterval={1}
            gutterSize={0}
            elementStyle={(dimension, elementSize, gutterSize, index) => {
              // return { flexBasis: `${elementSize}%` };
              return { width: `${elementSize}%` };
            }}
            gutterStyle={(dimension, gutterSize, index) => {
              // console.log("### gutterStyle ", index)
              const css: Partial<CSSStyleDeclaration> = { height: "100%", width: "8px" };
              if (index === 1) {
                css.marginRight = "-8px";
              }
              if (index === 2) {
                css.marginLeft = "-8px";
              }
              return css;
            }}
            onDragEnd={sizes => {
              // console.log("### onDragEnd ", sizes);
              this.setState({ sizes2: sizes as any });
            }}
          >
            <div className={cls({ [styles.hide]: !left })}/>
            <div>
              <Editor
                // wrapperClassName={cls(styles.flexItemRowHeightFull, styles.editorWrapper)}
                // className={styles.editor}
                // width={"100%"}
                // height={"100%"}
                defaultLanguage={languageEnum.javascript}
                defaultValue={""}
                theme={"light"}
                options={editorDefOptions}
                loading={<Spinner intent={Intent.PRIMARY} size={SpinnerSize.STANDARD}/>}
                onMount={(editor, monaco) => {
                  this.editor = editor;
                  this.editor.layout();
                  initKeyBinding(editor, monaco);
                }}
              />
            </div>
            <div className={cls({ [styles.hide]: !right })}/>
          </Split>
          <div className={cls({ [styles.hide]: !bottom })}/>
        </Split>
      </>
    );
  }
}

export default App;
