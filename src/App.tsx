import React, { useState } from 'react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import Editor, { loader, Monaco } from "@monaco-editor/react";
import ideaDraculaTheme from '@/assets/idea-dracula-theme.json'
import { TypeEnum, variableTypeOf } from '@/utils/typeof'
import './assets/App.css'

loader.config({
  "vs/nls": {
    availableLanguages: {
      '*': 'zh-cn'
    }
  },
});

const COLOR_TABLE: { [name: string]: string } = {
  black: "#000000",
  silver: "#C0C0C0",
  gray: "#808080",
  white: "#FFFFFF",
  maroon: "#800000",
  red: "#FF0000",
  purple: "#800080",
  fuchsia: "#FF00FF",
  green: "#008000",
  lime: "#00FF00",
  olive: "#808000",
  yellow: "#FFFF00",
  navy: "#000080",
  blue: "#0000FF",
  teal: "#008080",
  aqua: "#00FFFF",
}

loader.init().then(monaco => {
  const rules: Array<monaco.editor.ITokenThemeRule> = [];
  ideaDraculaTheme.tokenColors.forEach(tokenColor => {
    if (tokenColor?.settings?.fontStyle && !tokenColor?.settings?.fontStyle?.startsWith("#")) {
      if (COLOR_TABLE[tokenColor.settings.fontStyle]) {
        tokenColor.settings.fontStyle = COLOR_TABLE[tokenColor.settings.fontStyle];
      }
    }
    if (tokenColor?.settings?.foreground && !tokenColor?.settings?.foreground?.startsWith("#")) {
      if (COLOR_TABLE[tokenColor.settings.foreground]) {
        tokenColor.settings.foreground = COLOR_TABLE[tokenColor.settings.foreground];
      }
    }
    if (variableTypeOf(tokenColor.scope) === TypeEnum.string) {
      rules.push({ token: tokenColor.scope as string, ...tokenColor.settings });
    } else if (variableTypeOf(tokenColor.scope) === TypeEnum.array) {
      (tokenColor.scope as string[]).forEach(scope => {
        rules.push({ token: scope, ...tokenColor.settings });
      });
    }
  });

  monaco.editor.defineTheme("idea-dracula-theme", {
    base: "vs-dark",
    inherit: true,
    rules: [
      ...rules
    ],
    colors: {
      ...ideaDraculaTheme.colors,
    },
    encodedTokensColors: [],
  });
});

function App() {
  const [value, setValue] = useState("// some comment")

  function handleEditorDidMount(editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) {
    // Alt + / --> 智能提示
    editor.addCommand(
      monaco.KeyMod.Alt | monaco.KeyCode.US_SLASH,
      () => editor.trigger(null, 'editor.action.triggerSuggest', {}),
      '!findWidgetVisible && !inReferenceSearchEditor && !editorHasSelection'
    );
    // Ctrl + Shift + U --> 选中内容转大写
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_U,
      () => editor.trigger(null, 'editor.action.transformToUppercase', {}),
    );
    // Ctrl + Shift + I --> 选中内容转小写
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_I,
      () => editor.trigger(null, 'editor.action.transformToLowercase', {}),
    );
  }

  return (
    <Editor
      height="100%"
      defaultLanguage="javascript"
      defaultValue={value}
      theme={"idea-dracula-theme"}
      options={{
        minimap: { enabled: false },
      }}
      onMount={handleEditorDidMount}
    />
  )
}

export default App
