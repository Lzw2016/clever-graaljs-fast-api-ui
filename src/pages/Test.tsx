import React from "react";
import Editor from "@monaco-editor/react";
import { editorDefOptions, initEditorConfig, initKeyBinding, themeEnum } from "@/utils/editor-utils";
import { Intent, Spinner, SpinnerSize } from "@blueprintjs/core";

interface TestProps {
}

interface TestState {
}

class Test extends React.Component<TestProps, TestState> {
  render() {
    return (
      <Editor
        theme={themeEnum.IdeaDracula}
        loading={<Spinner intent={Intent.PRIMARY} size={SpinnerSize.STANDARD}/>}
        options={editorDefOptions}
        language={"sql"}
        saveViewState={true}
        path={"/test.sql"}
        keepCurrentModel={true}
        onMount={(editor, monaco) => {
          initEditorConfig(editor);
          initKeyBinding(editor, monaco);
          editor.layout();
          // monaco.languages.registerCompletionItemProvider()
        }}
      />
    );
  }
}

export type { TestProps, TestState };
export { Test };
