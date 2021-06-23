import React from "react";
import "react-reflex/styles.css";
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";
import { Spinner } from "@blueprintjs/core";
import Editor from "@monaco-editor/react";
import { editorDefOptions, initKeyBinding, languageEnum, themeEnum } from "@/utils/editor-utils";
import cls from "classnames";
import styles from "@/pages/Workbench.module.less";

interface ReflexAdvancedDemoProps {
}

interface ReflexAdvancedDemoState {
  size: number;
  show: boolean;
}

class ReflexAdvancedDemo extends React.Component<ReflexAdvancedDemoProps, ReflexAdvancedDemoState> {

  constructor(props: Readonly<ReflexAdvancedDemoProps>) {
    super(props);
    this.state = { size: 200, show: true };
  }

  render() {
    console.log("state -> ", JSON.stringify(this.state))
    const { size, show } = this.state;
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <ReflexContainer orientation="horizontal">
          <ReflexElement style={{ backgroundColor: "#222" }} direction={[-1, 1]}>
            <ReflexContainer orientation="vertical">
              <ReflexElement style={{ backgroundColor: "#333" }}>
                <button onClick={() => this.setState({ show: true })}>折叠</button>
              </ReflexElement>
              <ReflexSplitter propagate={false}/>
              <ReflexElement style={{ backgroundColor: "#444" }}>
                <Editor
                  wrapperClassName={cls(styles.flexItemRowHeightFull, styles.editorWrapper)}
                  className={styles.editor}
                  width={"100%"}
                  height={"100%"}
                  defaultLanguage={languageEnum.javascript}
                  defaultValue={""}
                  theme={themeEnum.IdeaDracula}
                  options={editorDefOptions}
                  loading={<Spinner intent={"primary"} size={48}/>}
                  onMount={(editor, monaco) => {
                    // this.editor = editor;
                    editor.layout();
                    initKeyBinding(editor, monaco);
                  }}
                />
              </ReflexElement>
              <ReflexSplitter propagate={false}/>
              <ReflexElement style={{ backgroundColor: "#555" }}>
                333
              </ReflexElement>
            </ReflexContainer>
          </ReflexElement>
          <ReflexSplitter propagate={false} style={{ height: 30, display: show ? "unset" : "none", backgroundColor: "#777" }}>
            <button onClick={() => this.setState({ show: !show })}>折叠</button>
          </ReflexSplitter>
          <ReflexElement
            style={{ backgroundColor: "#bbb" }}
            size={show ? size : 0}
            // minSize={show ? 64 : 0}
            direction={-1}
            onStopResize={e => this.setState({ size: (e.domElement as any)?.offsetHeight })}
          >
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "row" }}>
              <div style={{ flexGrow: 1, flexShrink: 1 }}>
                AAA
              </div>

              <div
                style={{ backgroundColor: "red", flexGrow: 0, flexShrink: 0, height: "100%", width: 8 }}
                onDrag={e => {
                  console.log(e)
                }}
              />

              <div style={{ flexGrow: 1, flexShrink: 1 }}>
                BBB
              </div>

              <div style={{ backgroundColor: "red", flexGrow: 0, flexShrink: 0, height: "100%", width: 8 }}/>

              <div style={{ flexGrow: 1, flexShrink: 1 }}>
                CCC
              </div>
            </div>
          </ReflexElement>
        </ReflexContainer>
        <div style={{ height: 64, flexShrink: 0, flexGrow: 0, display: "flex", flexDirection: "row" }}>

        </div>
      </div>
    )
  }
}

export default ReflexAdvancedDemo;
