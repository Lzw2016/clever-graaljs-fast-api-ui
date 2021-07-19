import * as MonacoApi from "monaco-editor/esm/vs/editor/editor.api";
import { TypeEnum, variableTypeOf } from "@/utils/typeof";
import { request } from "@/utils/request";
import ideaDraculaTheme from "@/assets/idea-dracula-theme.json";
import ideaLightTheme from "@/assets/idea-light-theme.json";
import { FastApi } from "@/apis";

const colorEnum: { [name: string]: string; } = {
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
};

/**
 * 主题枚举
 */
const themeEnum = {
  IdeaDracula: "idea-dracula",
  IdeaLight: "idea-light",
};

/**
 * 语言枚举
 */
const languageEnum = {
  typescript: "typescript",
  javascript: "javascript",
  xml: "xml",
  json: "json",
  yaml: "yaml",
  sql: "sql",
};

/**
 * Monaco编辑器默认选择
 */
const editorDefOptions: MonacoApi.editor.IStandaloneEditorConstructionOptions = {
  fontSize: 14,
  automaticLayout: true,
  contextmenu: true,
  minimap: { enabled: false },
  scrollbar: {
    vertical: "visible",
    horizontal: "visible",
    verticalScrollbarSize: 12,
    horizontalScrollbarSize: 12,
    arrowSize: 24,
  },
  fixedOverflowWidgets: true,
  // overflowWidgetsDomNode: window.document.body,
};

const getRules = (themeConfig: { colors: any, tokenColors: Array<{ scope: string | string[], settings: any }> }): Array<MonacoApi.editor.ITokenThemeRule> => {
  const rules: Array<MonacoApi.editor.ITokenThemeRule> = [];
  themeConfig.tokenColors.forEach(tokenColor => {
    const settings = tokenColor?.settings ?? {};
    const scope: string | string[] = tokenColor?.scope;
    if (settings?.fontStyle && !settings.fontStyle.startsWith("#") && colorEnum[settings.fontStyle]) {
      settings.fontStyle = colorEnum[settings.fontStyle];
    }
    if (settings?.foreground && !settings.foreground.startsWith("#") && colorEnum[settings.foreground]) {
      settings.foreground = colorEnum[settings.foreground];
    }
    if (variableTypeOf(scope) === TypeEnum.string) {
      rules.push({ token: scope as string, ...settings });
    } else if (variableTypeOf(scope) === TypeEnum.array) {
      (scope as string[]).forEach(scope => rules.push({ token: scope, ...settings }));
    }
  });
  return rules;
}

/**
 * 注册Monaco编辑器主题
 */
const registerTheme = (monaco: typeof MonacoApi) => {
  // 定义IDEA黑暗主题
  monaco.editor.defineTheme(themeEnum.IdeaDracula, {
    base: "vs-dark",
    inherit: true,
    rules: [
      ...getRules(ideaDraculaTheme),
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
  // 定义IDEA高亮主题
  monaco.editor.defineTheme(themeEnum.IdeaLight, {
    base: "vs",
    inherit: true,
    rules: [
      ...getRules(ideaLightTheme as any),
    ],
    colors: {
      ...ideaLightTheme.colors,
    },
    encodedTokensColors: [],
  });
};

/**
 * 初始化Monaco编辑器
 */
const initMonaco = (monaco: typeof MonacoApi): Promise<void> => {
  // 设置sql提示
  monaco.languages.registerCompletionItemProvider(languageEnum.sql, {
    triggerCharacters: ' $.:{}=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    provideCompletionItems(
      model: MonacoApi.editor.ITextModel,
      position: MonacoApi.Position,
      context: MonacoApi.languages.CompletionContext,
      token: MonacoApi.CancellationToken): MonacoApi.languages.ProviderResult<MonacoApi.languages.CompletionList> {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };
      return {
        suggestions: [
          {
            label: 'select',
            kind: monaco.languages.CompletionItemKind.Keyword,
            documentation: "Describe your library here",
            insertText: 'select',
            // insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range
          },
          {
            label: {
              name: 'f001',
              qualifier: "t001.f001",
              type: "字段",
            },
            kind: monaco.languages.CompletionItemKind.Field,
            documentation: "字段含义",
            insertText: 'f001',
            // insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range
          }
        ],
      };
    }
  });

  // 设置js/ts语法检测
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: false,
  });
  // 编译设置
  const defJsCompilerOptions = monaco.languages.typescript.javascriptDefaults.getCompilerOptions();
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    ...defJsCompilerOptions,
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    noLib: false,
    lib: ["es5", "es2015", "es2016", "es2017", "es2018", "es2019", "es2020", "es2021", "esnext"],
  });
  const defTsCompilerOptions = monaco.languages.typescript.typescriptDefaults.getCompilerOptions();
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    ...defTsCompilerOptions,
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    noLib: false,
    lib: ["es5", "es2015", "es2016", "es2017", "es2018", "es2019", "es2020", "es2021", "esnext"],
    allowJs: true,
    checkJs: false,
    strict: true,
    declaration: true,
    skipLibCheck: true,
    sourceMap: true,
    inlineSourceMap: false,
    inlineSources: true,
    allowSyntheticDefaultImports: true,
    forceConsistentCasingInFileNames: true,
    noImplicitReturns: true,
    noUnusedLocals: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
  });
  // 加载扩展lib定义
  return request.get(FastApi.ExtendFileManage.getExtendFileList)
    .then((extList: Array<FileResource>) => extList.forEach(ext => {
      if (ext.isFile !== 1 || !ext.content) return;
      // monaco.languages.typescript.javascriptDefaults.addExtraLib(ext.content, ext.path + ext.name);
      monaco.languages.typescript.typescriptDefaults.addExtraLib(ext.content, ext.path + ext.name);
      // const uri = monaco.Uri.parse(ext.path + ext.name);
      // let extModel = monaco.editor.getModel(uri);
      // if (!extModel) {
      //   extModel = monaco.editor.createModel(ext.content, languageEnum.typescript, uri);
      // } else {
      //   console.log("# uri ", uri, " extModel ", extModel);
      // }
      // monaco.editor.setModelLanguage(extModel, languageEnum.javascript);
    })).finally();
};

/**
 * 初始化快捷键
 */
const initKeyBinding = (editor: MonacoApi.editor.IStandaloneCodeEditor, monaco: typeof MonacoApi) => {
  // Alt + / --> 智能提示
  editor.addCommand(
    monaco.KeyMod.Alt | monaco.KeyCode.US_SLASH,
    () => editor.trigger(null, "editor.action.triggerSuggest", {}),
    "!findWidgetVisible && !inReferenceSearchEditor && !editorHasSelection"
  );
  // Ctrl + Shift + U --> 选中内容转大写
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_U,
    () => editor.trigger(null, "editor.action.transformToUppercase", {}),
  );
  // Ctrl + Shift + I --> 选中内容转小写
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_I,
    () => editor.trigger(null, "editor.action.transformToLowercase", {}),
  );
  // Ctrl + Alt + L --> 代码格式化
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KEY_L,
    () => editor.trigger(null, "editor.action.formatDocument", {}),
    "editorHasDocumentFormattingProvider && editorTextFocus && !editorReadonly"
  );
  // Ctrl + Alt + L --> 选中代码格式化
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KEY_L,
    () => editor.trigger(null, "editor.action.formatSelection", {}),
    "editorHasDocumentFormattingProvider && editorHasSelection && editorTextFocus && !editorReadonly"
  );
  // Ctrl + Alt + O --> 优化导入语句
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KEY_O,
    () => editor.trigger(null, "editor.action.organizeImports", {}),
    "editorTextFocus && !editorReadonly && supportedCodeAction =~ /(\\s|^)source\\.organizeImports\\b/"
  );
  // Shift + Enter 在下面插入一行
  editor.addCommand(
    monaco.KeyMod.Shift | monaco.KeyCode.Enter,
    () => editor.trigger(null, "editor.action.insertLineAfter", {}),
    "editorTextFocus && !editorReadonly"
  );
  // Ctrl + Shift + Enter 在上面插入一行
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
    () => editor.trigger(null, "editor.action.insertLineBefore", {}),
    "editorTextFocus && !editorReadonly"
  );
  // Ctrl + D 向下复制一行
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_D,
    () => editor.trigger(null, "editor.action.copyLinesDownAction", {}),
    "editorTextFocus && !editorReadonly"
  );
  // Ctrl + Y 删除行
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_Y,
    () => editor.trigger(null, "editor.action.deleteLines", {}),
    "editorTextFocus && !editorReadonly"
  );
  // Ctrl + P 触发参数提示
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_P,
    () => editor.trigger(null, "editor.action.triggerParameterHints", {}),
    "editorHasSignatureHelpProvider && editorTextFocus"
  );
  // Ctrl + Shift + UP 向上移动行
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.UpArrow,
    () => editor.trigger(null, "editor.action.moveLinesUpAction", {}),
    "editorTextFocus && !editorReadonly"
  );
  // Ctrl + Shift + Down 向下移动行
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.DownArrow,
    () => editor.trigger(null, "editor.action.moveLinesDownAction", {}),
    "editorTextFocus && !editorReadonly"
  );
  // Ctrl + Q 显示悬停
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_Q,
    () => editor.trigger(null, "editor.action.showHover", {}),
    "editorTextFocus"
  );
};

/**
 * 初始化编辑器实例
 */
const initEditorConfig = (editor: MonacoApi.editor.IStandaloneCodeEditor) => {
  editor.getModel()?.setEOL(MonacoApi.editor.EndOfLineSequence.LF);
}

const getLanguage = (filename?: string): string => {
  if (!filename) return languageEnum.javascript;
  const position = filename.lastIndexOf(".");
  if (position < 0) return languageEnum.javascript;
  const ext = filename.substr(position).toLowerCase();
  switch (ext) {
    case ".ts":
    case ".d.ts":
    case ".js":
      return languageEnum.typescript;
    // case ".js":
    //   return languageEnum.javascript;
    case ".json":
      return languageEnum.json;
    case ".xml":
      return languageEnum.xml;
    case ".yml":
    case ".yaml":
      return languageEnum.yaml;
    case ".sql":
      return languageEnum.sql;
  }
  return languageEnum.javascript
}

// AppContext.initEditorViewState = editorInstance.saveViewState();
// editorInstance.onDidChangeModelContent(lodash.debounce(AppContext.fileContentChange, 100, { maxWait: 350 }));

export { themeEnum, languageEnum, editorDefOptions, registerTheme, initMonaco, initKeyBinding, initEditorConfig, getLanguage };
