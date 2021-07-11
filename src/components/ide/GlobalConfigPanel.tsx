import React from "react";
import cls from "classnames";
import lodash from "lodash";
import Split from "react-split";
import SimpleBar from "simplebar-react";
import { Alert, Button, Classes, Dialog, FormGroup, InputGroup, Intent, Spinner, SpinnerSize, Tab, Tabs } from "@blueprintjs/core";
import { DynamicForm } from "@/components/DynamicForm";
import { componentStateKey, fastApiStore } from "@/utils/storage";
import { hasValue, noValue } from "@/utils/utils";
import Icon, { ArrowRightOutlined } from "@ant-design/icons";
import { Add, AddFile, ConfigFile, MenuSaveAll, Refresh, Remove2 } from "@/utils/IdeaIconUtils";
import { request } from "@/utils/request";
import { FastApi } from "@/apis";
import styles from "./GlobalConfigPanel.module.less";
import { globalDebugRequestData } from "@/utils/debug-request";

enum RequestTabEnum {
  Params = "Params",
  Headers = "Headers",
  Cookies = "Cookies",
}

interface AddGlobalConfigForm {
  /** 标题 */
  title: string;
}

interface GlobalConfigPanelProps {
}

interface GlobalConfigPanelState {
  /** 左中容器Size */
  hSplitSize: [number, number];
  /** 请求叶签 */
  requestTab: RequestTabEnum;
  /** 全局请求数据 */
  globalRequestDataArray: Array<GlobalRequestData>;
  /** 当前使用的数据ID */
  globalRequestDataId: string;
  /** 数据加载状态 */
  listLoading: boolean;
  /** 需要更新 */
  needUpdate: boolean;
  /** 显示新增对话框 */
  showAddDialog: boolean;
  /** 新增表单数据 */
  addForm: AddGlobalConfigForm;
  /** 新增Loading: */
  addLoading: boolean;
  /** 删除数据对话框 */
  showDeleteDialog: boolean;
  /** 删除数据Loading */
  deleteLoading: boolean;
  /** 显示更新输入框 */
  showUpdateDialog: boolean;
  /** 更新数据Loading */
  updateLoading: boolean;
}

// 读取组件状态
const storageState: Partial<GlobalConfigPanelState> = await fastApiStore.getItem(componentStateKey.GlobalConfigPanelState) ?? {};
const defaultState: GlobalConfigPanelState = {
  hSplitSize: [15, 85],
  requestTab: RequestTabEnum.Params,
  globalRequestDataArray: [],
  globalRequestDataId: "",
  listLoading: false,
  needUpdate: false,
  showAddDialog: false,
  addForm: { title: "" },
  addLoading: false,
  showDeleteDialog: false,
  deleteLoading: false,
  showUpdateDialog: false,
  updateLoading: false,
  ...storageState,
}

class GlobalConfigPanel extends React.Component<GlobalConfigPanelProps, GlobalConfigPanelState> {
  /** 执行组件状态的全局锁 */
  private saveStateLock: boolean = false;
  /** 保存组件的状态 */
  private saveComponentState = lodash.debounce(() => this.saveState().finally(), 1_000, { maxWait: 3_000 });
  /** 设置需要更新标识 */
  private setNeedUpdate = lodash.debounce(() => this.setState({ needUpdate: true }), 50, { maxWait: 500 });

  constructor(props: GlobalConfigPanelProps) {
    super(props);
    this.state = { ...defaultState };
  }

  // 组件挂载后
  public componentDidMount() {
    this.reLoadData();
  }

  // 组件将要被卸载
  public componentWillUnmount() {
    this.saveState().finally();
  }

  /** 保存组件状态 */
  public async saveState(): Promise<void> {
    if (this.saveStateLock) return;
    const { hSplitSize, requestTab, globalRequestDataId } = this.state;
    await fastApiStore.setItem(
      componentStateKey.GlobalConfigPanelState,
      { hSplitSize, requestTab, globalRequestDataId },
    ).finally(() => {
      this.saveStateLock = false;
    });
  }

  /** 重新加载数据 */
  public reLoadData(spin: boolean = true) {
    if (spin) this.setState({ listLoading: true });
    request.get(FastApi.HttpGlobalRequestDataManage.getAll)
      .then((data: Array<GlobalRequestData>) => {
        this.setState({ globalRequestDataArray: data });
      }).finally(() => {
      if (spin) this.setState({ listLoading: false });
    });
  }

  // 删除
  private delGlobalRequestData() {
    const { globalRequestDataArray, globalRequestDataId } = this.state;
    this.setState({ deleteLoading: true });
    request.delete(FastApi.HttpGlobalRequestDataManage.delete, { params: { id: globalRequestDataId } })
      .then((data: any) => {
        if (!data?.result) return;
        const array = globalRequestDataArray.filter(item => item.id !== globalRequestDataId);
        this.setState(
          { showDeleteDialog: false, globalRequestDataArray: array, globalRequestDataId: "", },
          () => this.reLoadData(false)
        );
      }).finally(() => this.setState({ deleteLoading: false }));
  }

  // 新增
  private saveOrUpdateGlobalRequestData() {
    const { addForm } = this.state;
    this.setState({ addLoading: true });
    request.post(FastApi.HttpGlobalRequestDataManage.saveOrUpdate, { title: addForm.title, params: [], headers: [], cookies: [] })
      .then(() => this.setState({
          showAddDialog: false, needUpdate: false,
        }, () => this.reLoadData(false)
      )).finally(() => this.setState({ addLoading: false }));
  }

  // 更新
  private updateGlobalRequestData() {
    const { globalRequestDataArray, globalRequestDataId } = this.state;
    const globalRequestData = globalRequestDataArray.find(data => data.id === globalRequestDataId);
    if (!globalRequestData) return;
    this.setState({ updateLoading: true });
    request.post(FastApi.HttpGlobalRequestDataManage.saveOrUpdate, { ...globalRequestData })
      .then(() => this.setState({
          showUpdateDialog: false, needUpdate: false,
        }, () => this.reLoadData(false)
      )).finally(() => this.setState({ updateLoading: false }));
  }

  private getLeftPanel() {
    const { globalRequestDataArray, globalRequestDataId, listLoading } = this.state;
    const delDisable = noValue(globalRequestDataArray) || globalRequestDataArray.length <= 0;
    return (
      <>
        <div className={cls(styles.flexColumn, styles.leftPanelTools)}>
          <div className={cls(styles.flexItemColumnWidthFull)}/>
          <Icon
            component={Remove2}
            className={cls(styles.flexItemColumn, styles.icon, { [styles.iconDisable]: delDisable })}
            onClick={() => {
              if (delDisable) return;
              this.setState({ showDeleteDialog: true });
            }}
          />
          <Icon
            component={Add}
            className={cls(styles.flexItemColumn, styles.icon)}
            onClick={() => this.setState({ showAddDialog: true, addForm: { title: "" } })}
          />
          <Icon
            className={cls(styles.flexItemColumn, styles.icon)}
            component={Refresh}
            onClick={() => this.reLoadData(true)}
          />
        </div>
        <SimpleBar
          className={cls(styles.leftPanelList)}
          style={{ width: "100%" }}
          autoHide={false}
          scrollbarMinSize={48}
        >
          {listLoading && <Spinner className={cls(styles.loading)} intent={Intent.PRIMARY} size={SpinnerSize.SMALL}/>}
          {
            !listLoading &&
            globalRequestDataArray.map(globalRequestData => (
              <div
                key={globalRequestData.id}
                className={cls(
                  styles.flexColumn, styles.leftPanelListItem,
                  { [styles.leftPanelListItemSelected]: globalRequestData.id === globalRequestDataId },
                )}
              >
                <Icon component={ConfigFile} className={cls(styles.flexItemColumn, styles.leftPanelListItemIcon)}/>
                <div
                  className={cls(styles.flexItemColumnWidthFull, styles.leftPanelListItemText)}
                  onClick={() => this.setState({ globalRequestDataId: globalRequestData.id })}
                >
                  {globalRequestData.title}
                </div>
              </div>
            ))
          }
        </SimpleBar>
      </>
    );
  }

  private getCenterPanel() {
    const { requestTab, needUpdate, updateLoading, globalRequestDataArray, globalRequestDataId } = this.state;
    const globalRequestData = globalRequestDataArray.find(data => data.id === globalRequestDataId);
    if (!globalRequestData) {
      globalDebugRequestData.clear();
      return <div/>;
    }
    globalDebugRequestData.setValue(globalRequestData);
    return (
      <Tabs
        className={cls(styles.centerPanel)}
        id={"GlobalConfigPanel"}
        animate={false}
        renderActiveTabPanelOnly={false}
        vertical={false}
        selectedTabId={requestTab}
        onChange={newTabId => this.setState({ requestTab: (newTabId as any) })}
      >
        <div style={{ lineHeight: "30px", fontSize: 14, fontWeight: "bold" }}>
          <span className={cls({ [styles.titleTextNeedUpdate]: needUpdate })}>{globalRequestData.title}</span>
          <ArrowRightOutlined style={{ fontSize: 10, padding: "0 8px 0 8px" }}/>
        </div>
        <Tab id={RequestTabEnum.Params} title="Params" panel={this.getParamsPanel(globalRequestData)}/>
        <Tab id={RequestTabEnum.Headers} title="Headers" panel={this.getHeadersPanel(globalRequestData)}/>
        <Tab id={RequestTabEnum.Cookies} title="Cookies" panel={this.getCookiesPanel(globalRequestData)}/>
        <Tabs.Expander/>
        <Icon
          className={cls(styles.flexItemColumn, styles.icon, { [styles.iconDisable]: !needUpdate }, { [styles.iconActive]: updateLoading })}
          component={MenuSaveAll}
          onClick={() => {
            if (updateLoading || !needUpdate) return;
            this.updateGlobalRequestData();
          }}
        />
      </Tabs>
    );
  }

  private getParamsPanel(globalRequestData: GlobalRequestData) {
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <DynamicForm data={globalRequestData.params} onChange={() => this.setNeedUpdate()}/>
      </SimpleBar>
    );
  }

  private getHeadersPanel(globalRequestData: GlobalRequestData) {
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <DynamicForm data={globalRequestData.headers} onChange={() => this.setNeedUpdate()}/>
      </SimpleBar>
    );
  }

  private getCookiesPanel(globalRequestData: GlobalRequestData) {
    return (
      <SimpleBar
        style={{ height: "100%", width: "100%" }}
        autoHide={false}
        scrollbarMinSize={48}
      >
        <DynamicForm data={globalRequestData.cookies} onChange={() => this.setNeedUpdate()}/>
      </SimpleBar>
    );
  }

  private getDeleteDialog() {
    const { globalRequestDataArray, globalRequestDataId, showDeleteDialog, deleteLoading } = this.state;
    const globalRequestData = globalRequestDataArray.find(data => data.id === globalRequestDataId);
    return (
      <Alert
        icon={"trash"}
        intent={Intent.DANGER}
        cancelButtonText={"取消"}
        confirmButtonText={"删除"}
        canEscapeKeyCancel={!deleteLoading}
        canOutsideClickCancel={!deleteLoading}
        transitionDuration={0.1}
        isOpen={showDeleteDialog && hasValue(globalRequestData?.id)}
        loading={deleteLoading}
        onCancel={() => this.setState({ showDeleteDialog: false })}
        onConfirm={() => this.delGlobalRequestData()}
      >
        <p>
          确认删除全局请求参数: <br/>
          {globalRequestData?.title}？
        </p>
      </Alert>
    );
  }

  private getAddDialog() {
    const { showAddDialog, addForm: { title }, addLoading } = this.state;
    return (
      <Dialog
        className={cls(Classes.DARK, styles.dialog, styles.addHttpApiDialog)}
        style={{ width: 350 }}
        lazy={true}
        icon={<Icon component={AddFile} className={cls(styles.menuIcon)} style={{ marginRight: 8 }}/>}
        title={"新增全局请求参数"}
        transitionDuration={0.1}
        usePortal={true}
        isCloseButtonShown={!addLoading}
        canEscapeKeyClose={!addLoading}
        canOutsideClickClose={false}
        autoFocus={true}
        enforceFocus={true}
        isOpen={showAddDialog}
        onClose={() => this.setState({ showAddDialog: false })}
      >
        <FormGroup style={{ marginTop: 12 }} inline={true} label={"名称"}>
          <InputGroup
            type={"text"}
            placeholder={"输入名称"}
            disabled={addLoading}
            autoFocus={true}
            value={title}
            onChange={e => this.setState({ addForm: { title: e.target.value } })}
          />
        </FormGroup>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={() => this.setState({ showAddDialog: false })} disabled={addLoading}>取消</Button>
            <Button intent={Intent.PRIMARY} onClick={() => this.saveOrUpdateGlobalRequestData()} loading={addLoading}>确认</Button>
          </div>
        </div>
      </Dialog>
    );
  }

  render() {
    this.saveComponentState();
    const { hSplitSize, needUpdate } = this.state;
    return (
      <Split
        className={cls(styles.panel, styles.horizontalSplit, Classes.DARK)}
        direction={"horizontal"}
        sizes={hSplitSize}
        minSize={[256, 512]}
        maxSize={[450, Infinity]}
        snapOffset={20}
        dragInterval={1}
        gutterSize={0}
        cursor={"ew-resize"}
        elementStyle={(_, elementSize) => {
          return { width: `${elementSize}%` };
        }}
        onDragEnd={sizes => this.setState({ hSplitSize: sizes as any })}
        gutter={_ => {
          const element = document.createElement("div");
          element.className = cls(styles.horizontalSplitGutter, "gutter gutter-horizontal");
          return element;
        }}
      >
        <div className={cls(styles.leftPanel)}>
          {this.getLeftPanel()}
        </div>
        <div
          className={cls(styles.centerPanel)}
          onKeyDown={e => {
            let preventDefault = false;
            if (e.ctrlKey && e.key.toUpperCase() === "S") {
              preventDefault = true;
              if (needUpdate) this.updateGlobalRequestData();
            }
            if (preventDefault) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
        >
          {this.getCenterPanel()}
        </div>
        {this.getDeleteDialog()}
        {this.getAddDialog()}
      </Split>
    );
  }
}

export type { GlobalConfigPanelProps, GlobalConfigPanelState };
export { GlobalConfigPanel } ;
