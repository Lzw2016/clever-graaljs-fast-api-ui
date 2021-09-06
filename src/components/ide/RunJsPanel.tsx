// noinspection DuplicatedCode

import React from "react";
import cls from "classnames";
import SimpleBar from "simplebar-react";
import { LogViewer } from "@/components/LogViewer";
import styles from "./RunJsPanel.module.less";
import { FastApi } from "@/apis";

interface RunJsPanelProps {
  onEndRunJs?: () => void;
}

interface RunJsPanelState {
}

class RunJsPanel extends React.Component<RunJsPanelProps, RunJsPanelState> {
  /** 显示日志组件 */
  private simpleBar: HTMLDivElement | null = null;
  /** 显示日志组件 */
  private logViewer = React.createRef<LogViewer>();
  /** 获取日志的WebSocket */
  private logsWebSocket: WebSocket | undefined;
  private logsLastIndex = -1;

  public startRunJs(fileResourceId: string) {
    const { onEndRunJs } = this.props;
    if (this.logsWebSocket != null) {
      return;
    }
    // 清除历史执行数据
    this.logsLastIndex = -1;
    this.logViewer.current?.clear();
    // 开始执行脚本
    this.logsWebSocket = new WebSocket(FastApi.WS.runJs)
    this.logsWebSocket.onopen = () => {
      this.logsWebSocket?.send(JSON.stringify({ fileResourceId }));
    };
    this.logsWebSocket.onclose = () => {
      this.logsWebSocket = undefined;
      if (onEndRunJs) onEndRunJs();
    };
    this.logsWebSocket.onmessage = ev => {
      const logViewer = this.logViewer.current;
      if (!logViewer) {
        // console.log("server logs ->", ev.data)
        return;
      }
      const data = JSON.parse(ev.data);
      if (data.errorStackTrace) {
        logViewer.addLogLine("服务端异常：");
        logViewer.addLogLine(data.errorStackTrace);
      } else {
        const logs: RingBuffer = data;
        if (this.logsLastIndex >= logs.lastIndex) {
          return;
        }
        if (this.logsLastIndex >= 0 && logs.firstIndex > 0 && logs.firstIndex > (this.logsLastIndex + 1)) {
          logViewer.addLogLine("......由于服务器输出日志速度过快，部分日志丢失......");
        }
        logs.content.forEach(log => {
          logViewer.addLogLine(log);
        });
        this.logsLastIndex = logs.lastIndex;
      }
      if (this.simpleBar) {
        this.simpleBar.scrollTop = this.simpleBar.scrollHeight;
      }
    };
  }

  render() {
    return (
      <SimpleBar
        scrollableNodeProps={{
          ref: (ref: any) => {
            this.simpleBar = ref;
          }
        }}
        style={{ height: "100%", width: "100%" }}
        className={cls(styles.panel)}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <LogViewer
          ref={this.logViewer}
          maxLine={1000}
          follow={true}
          linkify={true}
        />
      </SimpleBar>
    );
  }
}

export type { RunJsPanelProps, RunJsPanelState };
export { RunJsPanel };
