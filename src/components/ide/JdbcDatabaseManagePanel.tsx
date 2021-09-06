import React from "react";
import cls from "classnames";
import SimpleBar from "simplebar-react";
import { Classes, Intent, Spinner, SpinnerSize } from "@blueprintjs/core";
import Icon from "@ant-design/icons";
import { Add, Refresh, Remove2 } from "@/utils/IdeaIconUtils";
import { noValue } from "@/utils/utils";
import { request } from "@/utils/request";
import { FastApi } from "@/apis";
import IconFont from "@/components/IconFont";
import styles from "./JdbcDatabaseManagePanel.module.less";

interface JdbcDatabaseManagePanelProps {
}

interface JdbcDatabaseManagePanelState {
  loading: boolean,
  jdbcInfoResList: Array<JdbcInfoRes>
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
  /** 选中JDBC名称 */
  selectJdbcName?: string;
}

const defaultState: JdbcDatabaseManagePanelState = {
  loading: false,
  jdbcInfoResList: [],
  showAddDialog: false,
  addLoading: false,
  showDeleteDialog: false,
  deleteLoading: false,
  showUpdateDialog: false,
  updateLoading: false,
};

class JdbcDatabaseManagePanel extends React.Component<JdbcDatabaseManagePanelProps, JdbcDatabaseManagePanelState> {
  constructor(props: JdbcDatabaseManagePanelProps) {
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
    request.get(FastApi.JdbcDatabaseManage.getAll)
      .then((jdbcInfoResList: Array<JdbcInfoRes>) => this.setState({
        jdbcInfoResList,
      })).finally(() => {
      if (spin) this.setState({ loading: false });
    });
  }

  render() {
    const { loading, jdbcInfoResList, selectJdbcName } = this.state;
    const delDisable = noValue(selectJdbcName) || true;
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
            jdbcInfoResList.map(jdbcInfo => (
              <div
                key={jdbcInfo.name}
                className={cls(
                  styles.flexColumn, styles.leftPanelListItem,
                  { [styles.leftPanelListItemSelected]: jdbcInfo.name === selectJdbcName },
                )}
              >
                <IconFont type={getJdbcIcon(jdbcInfo.jdbcInfo.dbType)} className={cls(styles.flexItemColumn, styles.leftPanelListItemIcon)}/>
                <div
                  className={cls(styles.flexItemColumnWidthFull, styles.leftPanelListItemText)}
                  onClick={() => this.setState({ selectJdbcName: jdbcInfo.name })}
                  title={`总数:${jdbcInfo.status.totalConnections} | 空闲:${jdbcInfo.status.idleConnections} | 等待:${jdbcInfo.status.threadsAwaitingConnection}`}
                >
                  {jdbcInfo.name}
                </div>
              </div>
            ))
          }
        </SimpleBar>
      </div>
    );
  }
}

const getJdbcIcon = (dbType: string): string => {
  switch (dbType) {
    case "MARIADB":
      return "icon-MariaDB";
    case "MYSQL":
      return "icon-mysql1";
    case "ORACLE":
    case "ORACLE_12C":
      return "icon-connection-Oracle";
    case "SQLITE":
      return "icon-sqlite";
    case "POSTGRE_SQL":
      return "icon-postgresql";
    case "SQL_SERVER2005":
    case "SQL_SERVER":
      return "icon-sql-server";
    default:
      return "icon-database";
  }
}

export type { JdbcDatabaseManagePanelProps, JdbcDatabaseManagePanelState };
export { JdbcDatabaseManagePanel };
