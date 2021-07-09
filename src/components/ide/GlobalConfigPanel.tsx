import React from "react";
import cls from "classnames";
import { Classes, Tab, Tabs } from "@blueprintjs/core";
import styles from "./GlobalConfigPanel.module.less";
import cookie from "cookie";
import lodash from "lodash";
import SimpleBar from "simplebar-react";
import { DynamicForm } from "@/components/DynamicForm";

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
  /** 全局请求参数 */
  params: Array<RequestItemData>;
  /** 全局请求头 */
  headers: Array<RequestItemData>;
  /** 需要更新 */
  needUpdate: boolean;
}

const defaultState: GlobalConfigPanelState = {
  requestTab: RequestTabEnum.Params,
  params: [],
  headers: [],
  needUpdate: false,
}

class GlobalConfigPanel extends React.Component<GlobalConfigPanelProps, GlobalConfigPanelState> {
  /** 设置需要更新标识 */
  private setNeedUpdate = lodash.debounce(() => this.setState({ needUpdate: true }), 50, { maxWait: 500 });

  constructor(props: GlobalConfigPanelProps) {
    super(props);
    this.state = { ...defaultState };
  }

  private getParamsPanel() {
    const { params } = this.state;
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <DynamicForm data={params} onChange={() => this.setNeedUpdate()}/>
      </SimpleBar>
    );
  }

  private getHeadersPanel() {
    const { headers } = this.state;
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <DynamicForm data={headers} onChange={() => this.setNeedUpdate()}/>
      </SimpleBar>
    );
  }

  private getCookiesPanel() {
    const cookies = cookie.parse(document.cookie);
    const data: Array<RequestItemData> = [];
    lodash(cookies).forEach((value: string, key: string) => data.push({ key, value }));
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <DynamicForm readOnly={true} noCheckbox={true} noDescription={true} data={data}/>
      </SimpleBar>
    );
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
        <Tabs.Expander/>
        <div>保存</div>
      </Tabs>
    );
  }
}

export type { GlobalConfigPanelProps, GlobalConfigPanelState };
export { GlobalConfigPanel } ;
