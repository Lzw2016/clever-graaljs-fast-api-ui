import React from "react";
import cls from "classnames";
import { Classes, Tab, Tabs } from "@blueprintjs/core";
import styles from "./GlobalConfigPanel.module.less";

enum RequestTabEnum {
  Params = "Params",
  Headers = "Headers",
  Cookies = "Cookies",
}

interface GlobalConfigPanelProps {
}

interface GlobalConfigPanelState {
  /** 请求叶签 */
  requestTab: RequestTabEnum;
}

const defaultState: GlobalConfigPanelState = {
  requestTab: RequestTabEnum.Params,
}

class GlobalConfigPanel extends React.Component<GlobalConfigPanelProps, GlobalConfigPanelState> {
  constructor(props: GlobalConfigPanelProps) {
    super(props);
    this.state = { ...defaultState };
  }

  private getParamsPanel() {
    return (<div/>);
  }

  private getHeadersPanel() {
    return (<div/>);
  }

  private getCookiesPanel() {
    return (<div/>);
  }

  render() {
    const { requestTab } = this.state;
    return (
      <Tabs
        className={cls(styles.panel, Classes.DARK)}
        id={"GlobalConfigPanel"}
        animate={false}
        renderActiveTabPanelOnly={false}
        vertical={false}
        selectedTabId={requestTab}
        onChange={newTabId => this.setState({ requestTab: (newTabId as any) })}
      >
        <Tab id={RequestTabEnum.Params} title="Params" panel={this.getParamsPanel()}/>
        <Tab id={RequestTabEnum.Headers} title="Headers" panel={this.getHeadersPanel()}/>
        <Tab id={RequestTabEnum.Cookies} title="Cookies" panel={this.getCookiesPanel()}/>
      </Tabs>
    );
  }
}

export type { GlobalConfigPanelProps, GlobalConfigPanelState };
export { GlobalConfigPanel } ;
