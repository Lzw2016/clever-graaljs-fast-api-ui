import React from "react";
import cls from "classnames";
import { Classes } from "@blueprintjs/core";
import { EditorTabItem } from "@/types/workbench-layout";
import Icon from "@ant-design/icons";
import { MenuSaveAll } from "@/utils/IdeaIconUtils";
import styles from "./InterfaceConfigPanel.module.less";
import { request } from "@/utils/request";
import { FastApi } from "@/apis";

interface InterfaceConfigPanelProps {
  openFile?: EditorTabItem;
  onSaved?: (res: HttpApiFileResourceRes) => void;
}

interface InterfaceConfigPanelState {
  updateApiLoading: boolean;
  requestMethod: string;
  requestMapping: string;
}

const defaultState: InterfaceConfigPanelState = {
  updateApiLoading: false,
  requestMethod: "GET",
  requestMapping: "",
};

class InterfaceConfigPanel extends React.Component<InterfaceConfigPanelProps, InterfaceConfigPanelState> {
  private httpApiId: string = "";

  constructor(props: InterfaceConfigPanelProps) {
    super(props);
    this.state = { ...defaultState };
  }

  // 组件更新成功
  public componentDidUpdate(prevProps: Readonly<InterfaceConfigPanelProps>, prevState: Readonly<InterfaceConfigPanelState>, snapshot?: any) {
    const { openFile } = this.props;
    if (openFile?.httpApi && (this.httpApiId !== openFile.httpApi.id || this.httpApiId === "")) {
      this.httpApiId = openFile.httpApi.id;
      this.setState({ requestMethod: openFile.httpApi.requestMethod, requestMapping: openFile.httpApi.requestMapping });
    }
  }

  private updateHttpApi() {
    const { onSaved } = this.props;
    const { requestMethod, requestMapping } = this.state;
    this.setState({ updateApiLoading: true });
    request.put(FastApi.HttpApiManage.updateHttpApi, { id: this.httpApiId, requestMapping, requestMethod })
      .then((res: HttpApiFileResourceRes) => {
        if (onSaved) onSaved(res);
      }).finally(() => this.setState({ updateApiLoading: false }));
  }

  render() {
    const { updateApiLoading, requestMethod, requestMapping } = this.state;
    const { openFile } = this.props;
    const hide = !openFile?.httpApi;
    let needUpdate = false;
    if (openFile?.httpApi?.requestMethod !== requestMethod || openFile?.httpApi?.requestMapping !== requestMapping) {
      needUpdate = true;
    }
    return (
      <div className={cls(Classes.DARK, styles.panel, { [styles.hide]: hide })}>
        <div className={cls(styles.info)}>
          文件路径:&nbsp;{openFile?.fileResource.path}{openFile?.fileResource.name}
        </div>
        <div className={cls(styles.info)} style={{ marginBottom: 16 }}>
          接口路径:&nbsp;
          <span className={cls({ [styles.infoNeedUpdate]: needUpdate })}>
            {openFile?.httpApi?.requestMapping}[{openFile?.httpApi?.requestMethod}]
          </span>
          <Icon
            className={cls(styles.flexItemColumn, styles.icon, { [styles.iconDisable]: !needUpdate }, { [styles.iconActive]: updateApiLoading })}
            component={MenuSaveAll}
            onClick={() => {
              if (updateApiLoading || !needUpdate) return;
              this.updateHttpApi();
            }}
          />
        </div>
        {/*请求表单*/}
        <div
          className={cls(styles.flexColumn, styles.updateForm)}
          onKeyDown={e => {
            let preventDefault = false;
            if (e.ctrlKey && e.key.toUpperCase() === "S") {
              preventDefault = true;
              if (needUpdate) this.updateHttpApi();
            }
            if (preventDefault) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
        >
          <div className={cls(styles.flexItemColumn, styles.label)}>请求Method&nbsp;</div>
          <select
            className={cls(styles.flexItemColumn, styles.input)}
            disabled={updateApiLoading}
            value={requestMethod}
            onChange={e => this.setState({ requestMethod: e?.target?.value })}
          >
            <option value={"ALL"}>ALL</option>
            <option value={"GET"}>GET</option>
            <option value={"POST"}>POST</option>
            <option value={"PUT"}>PUT</option>
            <option value={"DELETE"}>DELETE</option>
            <option value={"PATCH"}>PATCH</option>
            <option value={"OPTIONS"}>OPTIONS</option>
            <option value={"HEAD"}>HEAD</option>
            <option value={"CONNECT"}>CONNECT</option>
            <option value={"TRACE"}>TRACE</option>
          </select>
          <div className={cls(styles.flexItemColumn)} style={{ width: 16 }}/>
          <div className={cls(styles.flexItemColumn, styles.label)}>请求Path&nbsp;</div>
          <input
            className={cls(styles.flexItemColumnWidthFull, styles.input)}
            placeholder={"输入接口路径"}
            disabled={updateApiLoading}
            value={requestMapping}
            onChange={e => this.setState({ requestMapping: e.target.value })}
          />
        </div>

      </div>
    );
  }
}

export type { InterfaceConfigPanelProps, InterfaceConfigPanelState };
export { InterfaceConfigPanel } ;
