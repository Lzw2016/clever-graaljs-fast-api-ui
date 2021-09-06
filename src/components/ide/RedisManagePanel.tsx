import React from "react";
import { request } from "@/utils/request";
import { FastApi } from "@/apis";
import { noValue } from "@/utils/utils";
import cls from "classnames";
import { Classes, Intent, Spinner, SpinnerSize } from "@blueprintjs/core";
import Icon from "@ant-design/icons";
import { Add, Refresh, Remove2 } from "@/utils/IdeaIconUtils";
import SimpleBar from "simplebar-react";
import IconFont from "@/components/IconFont";
import styles from "./RedisManagePanel.module.less";

interface RedisManagePanelProps {
}

interface RedisManagePanelState {
  loading: boolean,
  redisInfoResList: Array<RedisInfoRes>
  /** 显示新增对话框 */
  showAddDialog: boolean;
  /** 新增Loading: */
  addLoading: boolean;
  /** 删除数据对话框 */
  showDeleteDialog: boolean;
  /** 删除数据Loading */
  deleteLoading: boolean;
  /** 显示更新对话框 */
  showUpdateDialog: boolean;
  /** 更新数据Loading */
  updateLoading: boolean;
  /** 选中Redis名称 */
  selectRedisName?: string;
}

const defaultState: RedisManagePanelState = {
  loading: false,
  redisInfoResList: [],
  showAddDialog: false,
  addLoading: false,
  showDeleteDialog: false,
  deleteLoading: false,
  showUpdateDialog: false,
  updateLoading: false,
};

class RedisManagePanel extends React.Component<RedisManagePanelProps, RedisManagePanelState> {
  constructor(props: RedisManagePanelProps) {
    super(props);
    this.state = { ...defaultState };
  }

  // 组件挂载后
  public componentDidMount() {
    this.reLoadData();
  }

  /** 重新加载数据 */
  public reLoadData(spin: boolean = true) {
    if (spin) this.setState({ loading: true });
    request.get(FastApi.RedisManage.getAll)
      .then((redisInfoResList: Array<RedisInfoRes>) => this.setState({
        redisInfoResList,
      })).finally(() => {
      if (spin) this.setState({ loading: false });
    });
  }

  render() {
    const { loading, redisInfoResList, selectRedisName } = this.state;
    const delDisable = noValue(selectRedisName) || true;
    return (
      <div className={cls(Classes.DARK, styles.panel)}>
        <div className={cls(styles.flexColumn, styles.leftPanelTools)}>
          <Icon
            className={cls(styles.flexItemColumn, styles.icon)}
            component={Refresh}
            onClick={() => this.reLoadData()}
          />
          <Icon
            component={Add}
            className={cls(styles.flexItemColumn, styles.icon)}
            // onClick={() => {
            //   if (addDisable) return;
            //   this.setState({ showAddDialog: true, addForm: { title: "" } });
            // }}
          />
          <Icon
            component={Remove2}
            className={cls(styles.flexItemColumn, styles.icon, { [styles.iconDisable]: delDisable })}
            // onClick={() => {
            //   if (delDisable) return;
            //   this.setState({ showDeleteDialog: true });
            // }}
          />
          <div className={cls(styles.flexItemColumnWidthFull)}/>
        </div>
        <SimpleBar
          className={cls(styles.leftPanelList)}
          style={{ width: "100%" }}
          autoHide={false}
          scrollbarMinSize={48}
        >
          {loading && <Spinner className={cls(styles.loading)} intent={Intent.PRIMARY} size={SpinnerSize.SMALL}/>}
          {
            !loading &&
            redisInfoResList.map(redisInfo => (
              <div
                key={redisInfo.name}
                className={cls(
                  styles.flexColumn, styles.leftPanelListItem,
                  { [styles.leftPanelListItemSelected]: redisInfo.name === selectRedisName },
                )}
              >
                <IconFont type={"icon-redis1"} className={cls(styles.flexItemColumn, styles.leftPanelListItemIcon)}/>
                <div
                  className={cls(styles.flexItemColumnWidthFull, styles.leftPanelListItemText)}
                  onClick={() => this.setState({ selectRedisName: redisInfo.name })}
                  title={
                    redisInfo.status ?
                      `总数:${redisInfo.status.totalConnections} | 空闲:${redisInfo.status.idleConnections} | 等待:${redisInfo.status.threadsAwaitingConnection}` :
                      undefined
                  }
                >
                  {redisInfo.name}
                </div>
              </div>
            ))
          }
        </SimpleBar>
      </div>
    );
  }
}

export type { RedisManagePanelProps, RedisManagePanelState };
export { RedisManagePanel };
