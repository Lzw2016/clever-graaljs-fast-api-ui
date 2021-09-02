import React from "react";
import cls from "classnames";
import Icon from "@ant-design/icons";
import { Bottom, Download, GC, ScrollDown, Socket, Suspend, Top } from "@/utils/IdeaIconUtils";
import styles from "./ServerLogsPanel.module.less";

interface ServerLogsPanelProps {
}

interface ServerLogsPanelState {
}

class ServerLogsPanel extends React.Component<ServerLogsPanelProps, ServerLogsPanelState> {
  render() {
    return (
      <div className={cls(styles.panel, styles.flexColumn)}>
        <div className={cls(styles.flexItemColumn, styles.flexRow, styles.toolbar)}>
          <Icon component={Socket} className={cls(styles.flexItemRow, styles.icon)}/>
          <Icon component={Suspend} className={cls(styles.flexItemRow, styles.icon)}/>
          <Icon component={ScrollDown} className={cls(styles.flexItemRow, styles.icon)}/>
          <Icon component={Download} className={cls(styles.flexItemRow, styles.icon)}/>
          <Icon component={Top} className={cls(styles.flexItemRow, styles.icon)}/>
          <Icon component={Bottom} className={cls(styles.flexItemRow, styles.icon)}/>
          <Icon component={GC} className={cls(styles.flexItemRow, styles.icon)}/>
          <div className={cls(styles.flexItemRowHeightFull)}/>
        </div>
        <div className={cls(styles.flexItemColumnWidthFull)}>

        </div>
      </div>
    );
  }
}

export type { ServerLogsPanelProps, ServerLogsPanelState };
export { ServerLogsPanel };
