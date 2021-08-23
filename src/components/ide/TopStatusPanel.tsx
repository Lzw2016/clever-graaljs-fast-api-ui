import React from "react";
import cls from "classnames";
import copyToClipboard from "copy-to-clipboard";
import Icon, { AppstoreOutlined, ArrowRightOutlined, LockOutlined, SettingOutlined, UnlockOutlined } from "@ant-design/icons";
import { TopStatusFileInfo } from "@/types/workbench-layout";
import IconFont from "@/components/IconFont";
import { Copy, Execute, Find, History, MenuSaveAll, Rollback, StartTimer, StopTimer } from "@/utils/IdeaIconUtils";
import styles from "./TopStatusPanel.module.less";

interface TopStatusPanelProps {
  /** 全局环境变量 */
  globalEnv: FastApiGlobalEnv;
  /** HttpApiTree当前选中的节点 */
  topStatusFileInfo?: TopStatusFileInfo;
  /** 是否需要保存 */
  needSave: boolean;
  /** 切换底部面板 */
  toggleBottomPanel: () => void;
}

interface TopStatusPanelState {
}

class TopStatusPanel extends React.Component<TopStatusPanelProps, TopStatusPanelState> {
  render() {
    const { globalEnv, topStatusFileInfo, needSave } = this.props;
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
                    <span className={cls({ [styles.topStatusFileModify]: needSave })}>
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
          />
        }
        {
          topStatusFileInfo?.jobName && topStatusFileInfo?.triggerDisable === 0 &&
          <Icon
            component={StopTimer}
            className={cls(styles.flexItemColumn, styles.icon)}
            style={{ marginLeft: 8 }}
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
      </>
    );
  }
}

export type { TopStatusPanelProps, TopStatusPanelState };
export { TopStatusPanel } ;
