// noinspection DuplicatedCode

import React from "react";
import cls from "classnames";
import copyToClipboard from "copy-to-clipboard";
import Icon, { AppstoreOutlined, ArrowRightOutlined, LockOutlined, SettingOutlined, UnlockOutlined } from "@ant-design/icons";
import { Alert, Intent } from "@blueprintjs/core";
import { EditorTabItem, TopStatusFileInfo } from "@/types/workbench-layout";
import IconFont from "@/components/IconFont";
import { Copy, Execute, Find, History, MenuSaveAll, Rollback, StartTimer, StopTimer } from "@/utils/IdeaIconUtils";
import { hasValue } from "@/utils/utils";
import { FastApi } from "@/apis";
import { request } from "@/utils/request";
import styles from "./TopStatusPanel.module.less";

interface TopStatusPanelProps {
  /** 全局环境变量 */
  globalEnv: FastApiGlobalEnv;
  /** HttpApiTree当前选中的节点 */
  topStatusFileInfo?: TopStatusFileInfo;
  /** 当前文件 */
  currentFile?: EditorTabItem;
  /** 切换底部面板 */
  toggleBottomPanel: () => void;
  /** 重新加载定时任务资源树 */
  reLoadTaskResourceTree: () => void;
}

interface TopStatusPanelState {
  showEnableDialog: boolean;
  enableLoading: boolean;
  showDisableDialog: boolean;
  disableLoading: boolean;
}

const defaultState: TopStatusPanelState = {
  showEnableDialog: false,
  enableLoading: false,
  showDisableDialog: false,
  disableLoading: false,
}

class TopStatusPanel extends React.Component<TopStatusPanelProps, TopStatusPanelState> {

  constructor(props: TopStatusPanelProps) {
    super(props);
    this.state = { ...defaultState };
  }

  private enableJob() {
    const { topStatusFileInfo, reLoadTaskResourceTree } = this.props;
    this.setState({ enableLoading: true });
    request.post(
      FastApi.TaskManage.enable,
      {},
      { params: { jobId: topStatusFileInfo?.jobId } }
    ).then(() => {
      this.setState({ showEnableDialog: false });
      if (reLoadTaskResourceTree) reLoadTaskResourceTree();
    }).finally(() => this.setState({ enableLoading: false }));
  }

  private disableJob() {
    const { topStatusFileInfo, reLoadTaskResourceTree } = this.props;
    this.setState({ disableLoading: true });
    request.post(
      FastApi.TaskManage.disable,
      {},
      { params: { jobId: topStatusFileInfo?.jobId } }
    ).then(() => {
      this.setState({ showDisableDialog: false });
      if (reLoadTaskResourceTree) reLoadTaskResourceTree();
    }).finally(() => this.setState({ disableLoading: false }));
  }

  private getEnableDialog() {
    const { topStatusFileInfo } = this.props;
    const { showEnableDialog, enableLoading } = this.state;
    return (
      <Alert
        icon={(<Icon component={StartTimer} className={cls(styles.flexItemColumn, styles.alertIcon)}/>)}
        intent={Intent.PRIMARY}
        cancelButtonText={"取消"}
        confirmButtonText={"启用"}
        canEscapeKeyCancel={!enableLoading}
        canOutsideClickCancel={!enableLoading}
        transitionDuration={0.1}
        isOpen={showEnableDialog && hasValue(topStatusFileInfo?.jobName)}
        loading={enableLoading}
        onCancel={() => this.setState({ showEnableDialog: false })}
        onConfirm={() => this.enableJob()}
      >
        <p>
          确认启用定时任务？<br/>
          <span>{topStatusFileInfo?.jobName}</span>
        </p>
      </Alert>
    );
  }

  private getDisableDialog() {
    const { topStatusFileInfo } = this.props;
    const { showDisableDialog, disableLoading } = this.state;
    return (
      <Alert
        icon={(<Icon component={StopTimer} className={cls(styles.flexItemColumn, styles.alertIcon)}/>)}
        intent={Intent.DANGER}
        cancelButtonText={"取消"}
        confirmButtonText={"禁用"}
        canEscapeKeyCancel={!disableLoading}
        canOutsideClickCancel={!disableLoading}
        transitionDuration={0.1}
        isOpen={showDisableDialog && hasValue(topStatusFileInfo?.jobName)}
        loading={disableLoading}
        onCancel={() => this.setState({ showDisableDialog: false })}
        onConfirm={() => this.disableJob()}
      >
        <p>
          确认禁用定时任务？<br/>
          <span>{topStatusFileInfo?.jobName}</span>
        </p>
      </Alert>
    );
  }

  render() {
    const { globalEnv, topStatusFileInfo, currentFile } = this.props;
    const { toggleBottomPanel } = this.props;
    return (
      <>
        <div className={cls(styles.flexItemColumn)} style={{ width: 3 }}/>
        <div className={cls(styles.flexItemColumn, styles.topStatusFileResourcePath)} style={{ paddingTop: 6 }}>
          <AppstoreOutlined style={{ fontSize: 16 }}/>
        </div>
        <div className={cls(styles.flexItemColumn, styles.topStatusFileResourcePath)} style={{ margin: "0 8px 0 4px", fontWeight: "bold" }}>
          [{globalEnv.namespace}]
        </div>
        {/*文件信息*/}
        {
          topStatusFileInfo &&
          <div className={cls(styles.flexItemColumn, styles.topStatusFileResourcePath)}>
            {
              topStatusFileInfo.isFile === 1 ?
                (
                  <>
                    {topStatusFileInfo.path}
                    <span className={cls({ [styles.topStatusFileModify]: currentFile?.needSave })}>
                      {topStatusFileInfo.name}
                    </span>
                  </>
                ) :
                (topStatusFileInfo.path + topStatusFileInfo.name)
            }
          </div>
        }
        {
          (topStatusFileInfo?.httpApiId || topStatusFileInfo?.jobName) &&
          <div className={cls(styles.flexItemColumn, styles.topStatusFileResourcePath)}>
            <ArrowRightOutlined style={{ fontSize: 10, padding: "0 8px 0 8px" }}/>
          </div>
        }
        {/*http api信息*/}
        {
          topStatusFileInfo?.httpApiId &&
          <div className={cls(styles.flexItemColumn, styles.topStatusFileResourcePath)}>
            [{topStatusFileInfo.requestMethod}]&nbsp;{globalEnv.apiPrefix + topStatusFileInfo.requestMapping}
          </div>
        }
        {
          topStatusFileInfo?.httpApiId &&
          <Icon
            component={Copy}
            className={cls(styles.flexItemColumn, styles.icon, styles.copyIcon)}
            onClick={() => copyToClipboard(globalEnv.apiPrefix + topStatusFileInfo?.requestMapping!)}
          />
        }
        {
          topStatusFileInfo?.httpApiId &&
          <SettingOutlined
            className={cls(styles.flexItemColumn, styles.icon)}
            style={{ fontSize: 15, padding: "4px" }}
            onClick={toggleBottomPanel}
          />
        }
        {/*定时任务信息*/}
        {
          topStatusFileInfo?.jobName &&
          <div className={cls(styles.flexItemColumn, styles.topStatusFileResourcePath)}>
            {topStatusFileInfo.jobName}&nbsp;|&nbsp;{topStatusFileInfo.cron}&nbsp;|
            {/*&nbsp;下次:{topStatusFileInfo.nextFireTime ?? "-"}&nbsp;|&nbsp;上次:{topStatusFileInfo.lastFireTime ?? "-"}&nbsp;|*/}
          </div>
        }
        {
          topStatusFileInfo?.jobName && topStatusFileInfo?.triggerDisable === 1 &&
          <Icon
            component={StartTimer}
            className={cls(styles.flexItemColumn, styles.icon)}
            style={{ marginLeft: 8 }}
            onClick={() => this.setState({ showEnableDialog: true })}
          />
        }
        {
          topStatusFileInfo?.jobName && topStatusFileInfo?.triggerDisable === 0 &&
          <Icon
            component={StopTimer}
            className={cls(styles.flexItemColumn, styles.icon)}
            style={{ marginLeft: 8 }}
            onClick={() => this.setState({ showDisableDialog: true })}
          />
        }
        <div className={cls(styles.flexItemColumnWidthFull)}/>
        <Icon component={Execute} className={cls(styles.flexItemColumn, styles.icon, styles.iconDisable)}/>
        <Icon component={MenuSaveAll} className={cls(styles.flexItemColumn, styles.icon, styles.iconDisable)}/>
        <Icon component={Rollback} className={cls(styles.flexItemColumn, styles.icon, styles.iconDisable)}/>
        <LockOutlined className={cls(styles.flexItemColumn, styles.icon, styles.iconDisable)}/>
        <UnlockOutlined className={cls(styles.flexItemColumn, styles.icon, styles.iconDisable)}/>
        <Icon component={Find} className={cls(styles.flexItemColumn, styles.icon, styles.iconDisable)}/>
        <Icon component={History} className={cls(styles.flexItemColumn, styles.icon, styles.iconDisable)}/>
        <IconFont type="icon-keyboard" className={cls(styles.flexItemColumn, styles.icon, styles.iconDisable)} style={{ fontSize: 20, padding: "1px 2px" }}/>
        <div className={cls(styles.flexItemColumn)} style={{ marginRight: 16 }}/>
        {this.getEnableDialog()}
        {this.getDisableDialog()}
      </>
    );
  }
}

export type { TopStatusPanelProps, TopStatusPanelState };
export { TopStatusPanel };
