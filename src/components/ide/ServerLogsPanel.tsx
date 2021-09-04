// noinspection DuplicatedCode

import React from "react";
import cls from "classnames";
import Icon from "@ant-design/icons";
import SimpleBar from "simplebar-react";
import { Bottom, Download, GC, ScrollDown, Socket, Suspend, Top } from "@/utils/IdeaIconUtils";
import { LogViewer } from "@/components/LogViewer";
import { FastApi } from "@/apis";
import styles from "./ServerLogsPanel.module.less";

interface ServerLogsPanelProps {
}

interface ServerLogsPanelState {
}

class ServerLogsPanel extends React.Component<ServerLogsPanelProps, ServerLogsPanelState> {
  /** 显示日志组件 */
  private simpleBar: HTMLDivElement | null = null;
  /** 显示日志组件 */
  private logViewer = React.createRef<LogViewer>();
  /** 获取日志的WebSocket */
  private logsWebSocket: WebSocket | undefined;
  private logsLastIndex = -1;
  private followScroll = true;

  // 组件挂载后
  public componentDidMount() {
    // this.initLogsWebSocket();
  }

  // 组件将要被卸载
  public componentWillUnmount() {
    this.closeLogsWebSocket();
  }

  private initLogsWebSocket() {
    if (!this.logsWebSocket) {
      this.logsWebSocket = new WebSocket(FastApi.WS.serverLogs)
      this.logsWebSocket.onopen = () => {
        if (this.logsLastIndex >= 0) {
          this.logsWebSocket?.send("keepOn");
        } else {
          this.logsWebSocket?.send("all");
        }
      };
      this.logsWebSocket.onclose = () => {
        this.logsWebSocket = undefined;
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
        if (this.followScroll && this.simpleBar) {
          this.simpleBar.scrollTop = this.simpleBar.scrollHeight;
        }
      };
    }
  }

  private closeLogsWebSocket() {
    this.logsWebSocket?.close();
    this.logsWebSocket = undefined;
  }

  render() {
    return (
      <div className={cls(styles.panel, styles.flexColumn)}>
        <div className={cls(styles.flexItemColumn, styles.flexRow, styles.toolbar)}>
          {
            !this.logsWebSocket &&
            <Icon
              component={Socket}
              className={cls(styles.flexItemRow, styles.icon)}
              onClick={() => {
                this.initLogsWebSocket();
                this.forceUpdate();
              }}
            />
          }
          {
            this.logsWebSocket &&
            <Icon
              component={Suspend}
              className={cls(styles.flexItemRow, styles.icon)}
              onClick={() => {
                this.closeLogsWebSocket();
                this.forceUpdate();
              }}
            />
          }
          <Icon
            component={ScrollDown}
            className={cls(styles.flexItemRow, styles.icon, { [styles.iconScroll]: this.followScroll })}
            onClick={() => {
              this.followScroll = !this.followScroll;
              this.forceUpdate();
            }}
          />
          <Icon component={Download} className={cls(styles.flexItemRow, styles.icon, styles.hide)}/>
          <Icon component={Top} className={cls(styles.flexItemRow, styles.icon, styles.hide)}/>
          <Icon component={Bottom} className={cls(styles.flexItemRow, styles.icon, styles.hide)}/>
          <Icon
            component={GC}
            className={cls(styles.flexItemRow, styles.icon)}
            onClick={() => {
              this.logsLastIndex = -1;
              this.logViewer.current?.clear();
            }}
          />
          <div className={cls(styles.flexItemRowHeightFull)}/>
        </div>
        <div className={cls(styles.flexItemColumnWidthFull, styles.logs)}>
          <SimpleBar
            scrollableNodeProps={{
              ref: (ref: any) => {
                this.simpleBar = ref;
              }
            }}
            style={{ height: "100%", width: "100%" }}
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
        </div>
      </div>
    );
  }
}

export type { ServerLogsPanelProps, ServerLogsPanelState };
export { ServerLogsPanel };
