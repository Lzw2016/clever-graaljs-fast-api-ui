import React, { useState } from 'react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// @ts-ignore
// import * as actions from "monaco-editor/esm/vs/platform/actions/common/actions";
import * as actions from 'monaco-editor/esm/vs/platform/actions/common/actions';
import Editor, { loader, Monaco } from "@monaco-editor/react";
import ideaDraculaTheme from '@/assets/idea-dracula-theme.json'
import { TypeEnum, variableTypeOf } from '@/utils/typeof'
import './assets/App.css'


loader.config({
  paths: {
    // vs: "http://cdn.static.msvc.top/monaco-editor/0.25.1/min/vs"
    vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.25.2/min/vs"
  },
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


//   let menus = actions.MenuRegistry._menuItems
//   let contextMenuEntry = [...menus].find(entry => entry[0]._debugName == "EditorContext")
//   let contextMenuLinks = contextMenuEntry[1]
//   let removableIds = ["editor.action.clipboardCopyAction", "editor.action.clipboardPasteAction"]
// // @ts-ignore
//   let removeById = (list, ids) => {
//     let node = list._first
//     do {
//       let shouldRemove = ids.includes(node.element?.command?.id)
//       if (shouldRemove) {
//         list._remove(node)
//       }
//     } while ((node = node.next))
//   }
//   removeById(contextMenuLinks, removableIds)


  // 设置主题
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

  monaco.editor.defineTheme("idea-dracula", {
    base: "vs-dark",
    inherit: true,
    rules: [
      ...rules,
    ],
    colors: {
      ...ideaDraculaTheme.colors,
      "editor.background": "#2B2B2B",
      "editor.lineHighlightBackground": "#323232",
      "editorLineNumber.foreground": "#606366",
      "editorGutter.background": "#313335",
      "editor.selectionHighlightBackground": "#214283",
    },
    encodedTokensColors: [],
  });

  // 设置语法检测
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: false,
  });
  // 编译设置
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    ...monaco.languages.typescript.javascriptDefaults.getCompilerOptions(),
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    noLib: true,
  });

  // extra libraries
  const libSource = `
declare class Facts {
  /**
   * Returns the next fact
   */
  static next(): string
}
  `;
  const libUri = 'facts.d.ts';
  monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri);
  // When resolving definitions and references, the editor will try to use created models.
  // Creating a model for the library allows "peek definition/references" commands to work with the library.
  monaco.editor.createModel(libSource, 'typescript', monaco.Uri.parse(libUri));
});

function App() {
  const [value, setValue] = useState(`
// some comment
\n\n\n\n\n\n
const log = LoggerFactory.getLogger("logger");
const jdbc = JdbcDatabase.getDefault();

const sql = "select baseprice from  tb_gos_sale_saleorderdet where baseprice>0 limit 1";
log.info("String        --> {}", jdbc.queryString(sql));
log.info("Double        --> {}", jdbc.queryDouble(sql));
log.info("BigDecimal    --> {}", jdbc.queryBigDecimal(sql));

const sql2 = "select issettlement from  tb_gos_sale_saleorderdet where issettlement is not null limit 1";
log.info("Boolean   --> {}", jdbc.queryBoolean(sql2));

const sql3 = "select createtime from  tb_gos_sale_saleorderdet where issettlement is not null limit 1";
log.info("Date   --> {}", jdbc.queryDate(sql3));

const sql4 = "select * from  tb_merchandise_ext where update_at>:startDate";
log.info("Count  --> {}", jdbc.queryCount(sql4, {startDate: DateUtils.parseDate("2021-01-27 15:38:31")}));

const sql5 = "select prod_no,branch_id,merchandise_type,merchandise_state from tb_merchandise_ext limit 3";
log.info("queryList --> {}", [jdbc.queryList(sql5)]);

const sql6 = "select prod_no,branch_id,merchandise_type,merchandise_state from tb_merchandise_ext where prod_no=:prodNo";
log.info("queryList --> {}", [jdbc.queryList(sql6, {prodNo: "A000212131002"})]);
log.info("queryMap  --> {}", jdbc.queryMap(sql6, {prodNo: "A000212131002"}));

const sql7 = "select prod_no,branch_id,merchandise_type,merchandise_state from tb_merchandise_ext where prod_no='A000212131002'";
log.info("queryMap  --> {}", jdbc.queryMap(sql7));

const res1 = jdbc.queryTableMap("tb_merchandise_ext", {prod_no: 'A000212131002'}, false);
const res2 = jdbc.queryTableMap("tb_merchandise_ext", {prodNo: 'A000212131002'}, true);
log.info("res1  -> {}", res1);
log.info("res2  -> {}", res2);

const res3 = jdbc.queryTableList("tb_merchandise_ext", {purchaseMobile: '13006155525'}, true);
log.info("res3  -> {}", res3.size());

const sql8 = "select prod_no,branch_id,merchandise_type,merchandise_state from  tb_merchandise_ext where update_at>:startDate"
log.info("queryByPage   -> {}", jdbc.queryByPage(sql8, {pageNo: 5, pageSize: 3}, {startDate: DateUtils.parseDate("2021-01-27 15:38:31")}));

sds'wq
\n\n\n\n\n\n
return Facts.next();
\n\n\n\n\n\n
  `)

  function handleEditorDidMount(editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) {
    console.log("###->", actions.MenuRegistry._menuItems);
    (window as any).aaa = actions.MenuRegistry._menuItems;

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

    editor.addAction({
      id: "00a",
      label: "自定义菜单",
      // keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_V],
      contextMenuGroupId: "001",
      run: editor => {
        alert("Add your custom pasting code here");
      }
    });

    // delete (editor as any)._action["editor.action.revealDefinition"]
    // (editor as any)._action["editor.action.revealDefinition"] = undefined;
    // (editor as any).setAction() = {};
    // console.log("@@@@", (editor as any)._actions);
    console.log("@@@@", editor.getAction("editor.action.revealDefinition"));
    editor.getAction("editor.action.revealDefinition")
    // editor.onContextMenu(e => {
    //   e.target.
    // })
  }

  return (
    <Editor
      height="90%"
      defaultLanguage="javascript"
      defaultValue={value}
      // theme={"vs-dark"}
      theme={"idea-dracula"}
      options={{
        fontSize: 14,
        // automaticLayout: false,
        contextmenu: true,
        minimap: { enabled: false },
        scrollbar: {
          vertical: "visible",
          horizontal: "visible",
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
          arrowSize: 16,
        },
      }}
      onMount={handleEditorDidMount}
    />
  )
}

export default App
