import React from "react";
import lodash from "lodash";
import cls from "classnames";
import Anser, { AnserJsonEntry } from "anser";
import { escapeCarriageReturn } from "escape-carriage";
import styles from "./LogViewer.module.less";

interface LogViewerProps {
  /** 自定义样式 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义行样式 */
  lineClassName?: string;
  /** 自定义行样式 */
  lineStyle?: React.CSSProperties;
  /** 自定义行号样式 */
  lineNoClassName?: string;
  /** 自定义行号样式 */
  lineNoStyle?: React.CSSProperties;
  /** 自定义行内容样式 */
  lineTextClassName?: string;
  /** 自定义行内容样式 */
  lineTextStyle?: React.CSSProperties;
  /** 保留的最大示行 */
  maxLine?: number;
  /** 跟随滚动 */
  follow?: boolean;
  /** 使用class渲染颜色 */
  useClasses?: boolean;
  /** 连接是否可以点击 */
  linkify?: boolean;
}

interface LogViewerState {
}

class LogViewer extends React.Component<LogViewerProps, LogViewerState> {
  private logsDiv: HTMLDivElement | null = null;
  private lineNo = 0;

  public addLogLine(logs?: string) {
    const { maxLine, useClasses, linkify } = this.props;
    const logArray = logs?.split("\n") ?? [];
    if (logArray[logArray.length - 1] === "") logArray.pop();
    logArray.forEach(log => {
      if (maxLine && this.logsDiv?.children && this.logsDiv?.children.length > maxLine) {
        this.logsDiv.children[0].remove();
      }
      this.lineNo++;
      const content = ansiToJSON(log ?? "", useClasses ?? false)
        .map(convertBundleIntoReact.bind(null, linkify ?? false, useClasses ?? false));
      const lineText = this.createLineText(content);
      const lineNo = this.createLineNo(this.lineNo);
      const line = this.createLine(lineNo, lineText);
      this.logsDiv?.append(line);
    });
  }

  public clear(lineNo: number = 0) {
    if (this.logsDiv) this.logsDiv.innerHTML = "";
    this.lineNo = lineNo;
  }

  private createLine(lineNo: Node, lineText: Node): Node {
    const { lineClassName, lineStyle } = this.props;
    const logLine = document.createElement("div");
    logLine.append(lineNo);
    logLine.append(lineText);
    logLine.className = cls(styles.logLine, lineClassName);
    if (lineStyle) {
      lodash.forEach(lineStyle, (value: any, key: any) => {
        logLine.style[key] = value;
      })
    }
    return logLine;
  }

  private createLineNo(lineNo: number): Node {
    const { lineNoClassName, lineNoStyle } = this.props;
    const logLineNo = document.createElement("span");
    logLineNo.innerHTML = `${lineNo}`;
    logLineNo.className = cls(styles.logLineNo, lineNoClassName);
    if (lineNoStyle) {
      lodash.forEach(lineNoStyle, (value: any, key: any) => {
        logLineNo.style[key] = value;
      })
    }
    return logLineNo;
  }

  private createLineText(content: Node[]): Node {
    const { lineTextClassName, lineTextStyle } = this.props;
    const logLineText = document.createElement("span");
    content.forEach(value => logLineText.append(value));
    logLineText.className = cls(styles.logText, lineTextClassName);
    if (lineTextStyle) {
      lodash.forEach(lineTextStyle, (value: any, key: any) => {
        logLineText.style[key] = value;
      })
    }
    return logLineText;
  }

  render() {
    const { className, style } = this.props;
    return (
      <div
        ref={logsDiv => {
          this.logsDiv = logsDiv;
        }}
        className={cls(styles.code, className)} style={style}
      />
    );
  }
}

/**
 * Create a class string.
 * @name createClass
 * @function
 * @param {AnserJsonEntry} bundle
 * @return {String} class name(s)
 */
function createClass(bundle: AnserJsonEntry): string | null {
  let classNames: string = "";
  if (bundle.bg) {
    classNames += `${bundle.bg}-bg `;
  }
  if (bundle.fg) {
    classNames += `${bundle.fg}-fg `;
  }
  if (bundle.decoration) {
    classNames += `ansi-${bundle.decoration} `;
  }
  if (classNames === "") {
    return null;
  }
  classNames = classNames.substring(0, classNames.length - 1);
  return classNames;
}

interface Colors {
  color?: string;
  backgroundColor?: string;
}

/**
 * Create the style attribute.
 * @name createStyle
 * @function
 * @param {AnserJsonEntry} bundle
 * @return {Object} returns the style object
 */
function createStyle(bundle: AnserJsonEntry): Colors {
  const style: Colors = {};
  if (bundle.bg) {
    style.backgroundColor = `rgb(${bundle.bg})`;
  }
  if (bundle.fg) {
    style.color = `rgb(${bundle.fg})`;
  }
  return style;
}

/**
 * Converts an Anser bundle into a React Node.
 * @param linkify whether links should be converting into clickable anchor tags.
 * @param useClasses should render the span with a class instead of style.
 * @param bundle Anser output.
 * @param key
 */
function convertBundleIntoReact(linkify: boolean, useClasses: boolean, bundle: AnserJsonEntry, key: number): Node {
  const style = useClasses ? null : createStyle(bundle);
  const className = useClasses ? createClass(bundle) : null;
  if (!linkify) {
    const pre = document.createElement("pre");
    pre.innerHTML = bundle.content;
    if (className) pre.className = className;
    if (style?.color) pre.style.color = style.color;
    if (style?.backgroundColor) pre.style.backgroundColor = style.backgroundColor;
    return pre;
  }
  const content: Node[] = [];
  const linkRegex = /(\s+|^)(https?:\/\/(?:www\.|(?!www))[^\s.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/g;
  let index = 0;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(bundle.content)) !== null) {
    const [, pre, url] = match;
    const startIndex = match.index + pre.length;
    if (startIndex > index) {
      content.push(bundle.content.substring(index, startIndex) as any);
    }
    // Make sure the href we generate from the link is fully qualified. We assume http
    // if it starts with a www because many sites don't support https
    // noinspection HttpUrlsUsage
    const href = url.startsWith("www.") ? `http://${url}` : url;
    const alink = document.createElement("a");
    alink.href = href;
    alink.target = "_blank";
    alink.innerHTML = url;
    content.push(alink);
    index = linkRegex.lastIndex;
  }
  if (index < bundle.content.length) {
    content.push(bundle.content.substring(index) as any);
  }
  const pre = document.createElement("pre");
  content.forEach(value => pre.append(value));
  if (className) pre.className = className;
  if (style?.color) pre.style.color = style.color;
  if (style?.backgroundColor) pre.style.backgroundColor = style.backgroundColor;
  return pre;
}

/**
 * Converts ANSI strings into JSON output.
 * @name ansiToJSON
 * @function
 * @param {String} input The input string.
 * @param {boolean} use_classes If `true`, HTML classes will be appended
 *                              to the HTML output.
 * @return {Array} The parsed input.
 */
function ansiToJSON(input: string, use_classes: boolean = false): AnserJsonEntry[] {
  input = escapeCarriageReturn(fixBackspace(input));
  return Anser.ansiToJson(input, { json: true, remove_empty: true, use_classes });
}

// This is copied from the Jupyter Classic source code
// notebook/static/base/js/utils.js to handle \b in a way
// that is **compatible with Jupyter classic**.   One can
// argue that this behavior is questionable:
//   https://stackoverflow.com/questions/55440152/multiple-b-doesnt-work-as-expected-in-jupyter#
function fixBackspace(txt: string) {
  let tmp = txt;
  do {
    txt = tmp;
    // Cancel out anything-but-newline followed by backspace
    tmp = txt.replace(/[^\n]\x08/gm, "");
  } while (tmp.length < txt.length);
  return txt;
}

export type { LogViewerProps, LogViewerState };
export { LogViewer };
