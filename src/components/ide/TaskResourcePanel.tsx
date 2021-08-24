// noinspection DuplicatedCode

import React from "react";
import cls from "classnames";
import lodash from "lodash";
import Icon, { MinusOutlined, SortAscendingOutlined, SortDescendingOutlined } from "@ant-design/icons";
import copyToClipboard from "copy-to-clipboard";
import SimpleBar from "simplebar-react";
import { Alert, Button, Classes, Dialog, FormGroup, InputGroup, Intent, Menu, MenuDivider, MenuItem, Spinner, SpinnerSize, Tree, TreeNodeInfo } from "@blueprintjs/core";
import { ContextMenu2 } from "@blueprintjs/popover2";
import { FastApi } from "@/apis";
import { hasValue, noValue } from "@/utils/utils";
import { request } from "@/utils/request";
import { componentStateKey, storeGetData, storeSaveData } from "@/utils/storage";
import {
  AddFile,
  AddFolder,
  CollapseAll,
  Copy,
  EditSource,
  Execute,
  ExpandAll,
  Find,
  Folder,
  getFileIcon,
  Locate,
  Refresh,
  Remove,
  StartTimer,
  StopTimer,
  TimedTask
} from "@/utils/IdeaIconUtils";
import styles from "./TaskResourcePanel.module.less";

interface AddJsJobForm {
  name: string;
  filePath: string;
  fileName: string;
  /** 最大重入执行数量(对于单个节点当前任务未执行完成就触发了下一次执行导致任务重入执行)，小于等于0：表示禁止重入执行 */
  maxReentry?: number;
  /** 执行失败时的最大重试次数 */
  maxRetryCount?: number;
  /** 是否更新任务数据，0：不更新，1：更新 */
  isUpdateData?: number;
  /** 是否禁用：0-启用，1-禁用 */
  disable?: number;
  /** 描述 */
  description?: string;
  /** cron表达式 */
  cron: string;
  /** 触发开始时间 */
  startTime?: string;
  /** 触发结束时间 */
  endTime?: string;
  /** 错过触发策略，1：忽略，2：立即补偿触发一次 */
  misfireStrategy?: number;
  /** 是否禁用：0-启用，1-禁用 */
  triggerDisable?: number;
}

interface AddDirForm {
  path: string;
}

interface RenameForm {
  id: string;
  path: string;
  newName: string;
}

interface TaskResourcePanelProps {
  /** 自定义样式 */
  className?: string;
  /** 当前打开的文件ID */
  openFileId?: string;
  // /** 选择节点变化事件 */
  onSelectChange?: (node: TreeNodeInfo<JobFileResourceRes>) => void;
  /** 打开文件事件 */
  onOpenFile?: (jobFileResourceRes: JobFileResourceRes) => void;
  /** 当前组件点击最小化事件 */
  onHidePanel?: () => void;
  /** 新增任务成功 */
  onAddJsJob?: (job: Job, jobTrigger: JobTrigger, file: FileResource) => void;
  /** 删除任务成功 */
  onDelJsJob?: (files: Array<FileResource>) => void;
}

interface TaskResourcePanelState {
  /** 数据加载状态 */
  loading: boolean;
  /** 树数据 */
  treeData: Array<TreeNodeInfo<JobFileResourceRes>>;
  /** 已展开的节点ID */
  expandedIds: Set<TreeNodeInfo["id"]>;
  /** 当前选择的节点ID */
  selectedId: TreeNodeInfo["id"];
  /** 右键菜单选中的Tree节点 */
  contextMenuSelectNode?: TreeNodeInfo<JobFileResourceRes>;
  /** 节点名称排序规则 */
  nodeNameSort: "ASC" | "DESC";
  /** 显示新增任务对话框 */
  showAddJsJobDialog: boolean;
  /** 新增任务表单数据 */
  addJsJobForm: AddJsJobForm;
  /** 新增任务Loading */
  addJsJobLoading: boolean;
  /** 显示新增目录对话框 */
  showAddDirDialog: boolean;
  /** 新增目录表单数据 */
  addDirForm: AddDirForm;
  /** 新增目录Loading: */
  addDirLoading: boolean;
  /** 重命名对话框 */
  showRenameDialog: boolean;
  /** 重命名表单数据 */
  renameForm: RenameForm;
  /** 重命名Loading: */
  renameLoading: boolean;
  /** 删除数据对话框 */
  showDeleteDialog: boolean;
  /** 删除数据Loading */
  deleteJobLoading: boolean;
  showEnableDialog: boolean;
  enableLoading: boolean;
  showDisableDialog: boolean;
  disableLoading: boolean;
  showExecJobDialog: boolean;
  execJobLoading: boolean;
}


// 组件状态默认值
const defaultState: TaskResourcePanelState = {
  loading: true,
  treeData: [],
  expandedIds: new Set(),
  selectedId: "",
  nodeNameSort: "ASC",
  showAddJsJobDialog: false,
  addJsJobForm: { name: "", filePath: "", fileName: "", cron: "" },
  addJsJobLoading: false,
  showAddDirDialog: false,
  addDirForm: { path: "/" },
  addDirLoading: false,
  showRenameDialog: false,
  renameForm: { id: "", path: "", newName: "" },
  renameLoading: false,
  showDeleteDialog: false,
  deleteJobLoading: false,
  showEnableDialog: false,
  enableLoading: false,
  showDisableDialog: false,
  disableLoading: false,
  showExecJobDialog: false,
  execJobLoading: false,
}

class TaskResourcePanel extends React.Component<TaskResourcePanelProps, TaskResourcePanelState> {
  /** 执行组件状态的全局锁 */
  private saveStateLock: boolean = false;
  /** 保存组件的状态 */
  private saveComponentState = lodash.debounce(() => this.saveState().finally(), 1_000, { maxWait: 3_000 });

  constructor(props: TaskResourcePanelProps) {
    super(props);
    this.state = { ...defaultState, ...storeGetData(componentStateKey.TaskResourcePanelState) };
  }

  // 组件挂载后
  public componentDidMount() {
    this.reLoadTreeData(true, false);
  }

  // 组件将要被卸载
  public componentWillUnmount() {
    this.saveState().finally();
  }

  /** 保存组件状态 */
  public async saveState(): Promise<void> {
    if (this.saveStateLock) return;
    const { treeData, expandedIds, selectedId, nodeNameSort } = this.state;
    const allIds = new Set();
    treeData.forEach(node => forEachTreeNode(node, n => allIds.add(n.id)));
    expandedIds.forEach(id => {
      if (!allIds.has(id)) expandedIds.delete(id);
    });
    await storeSaveData(
      componentStateKey.TaskResourcePanelState,
      { expandedIds, selectedId, nodeNameSort },
    ).finally(() => {
      this.saveStateLock = false;
    });
  }

  /** 重新加载数据 */
  public reLoadTreeData(spin: boolean = true, triggerOnSelectChange: boolean = true) {
    if (spin) this.setState({ loading: true });
    request.get(FastApi.TaskManage.getJsJobTree)
      .then(treeData => {
        treeData = transformTreeData(treeData);
        const { onSelectChange } = this.props;
        if (triggerOnSelectChange && onSelectChange) {
          const { selectedId } = this.state;
          let selectNode: TreeNodeInfo<JobFileResourceRes> | undefined;
          (treeData as Array<TreeNodeInfo<JobFileResourceRes>>).forEach(node => forEachTreeNode(node, n => {
            if (n.nodeData?.fileResourceId === selectedId) selectNode = n;
          }));
          if (selectNode) onSelectChange(selectNode);
        }
        this.setState({ treeData });
      }).finally(() => {
      if (spin) this.setState({ loading: false });
    });
  }

  /** 新增任务 */
  private addJsJob() {
    const { onAddJsJob } = this.props;
    const { expandedIds, addJsJobForm } = this.state;
    this.setState({ addJsJobLoading: true });
    request.post(FastApi.TaskManage.addJsJob, { ...addJsJobForm, triggerDisable: 1 })
      .then((res: AddJsJobRes) => {
        res?.fileList?.forEach(item => {
          if (item.isFile === 0) {
            expandedIds.add(item.id);
            return
          }
          if (onAddJsJob) onAddJsJob(res.job, res.jobTrigger, item);
          this.setState({ selectedId: item.id });
        });
        this.setState({ showAddJsJobDialog: false });
        this.reLoadTreeData(false);
      }).finally(() => this.setState({ addJsJobLoading: false }));
  }

  /** 删除任务 */
  private delJsJob() {
    const { onDelJsJob } = this.props;
    const { expandedIds, contextMenuSelectNode } = this.state;
    const nodeData = contextMenuSelectNode?.nodeData;
    if (!nodeData) {
      this.setState({ showDeleteDialog: false });
      return;
    }
    this.setState({ deleteJobLoading: true });
    request.delete(FastApi.TaskManage.delJsJob, { params: { fileResourceId: nodeData.fileResourceId } })
      .then((res: DelJsJobRes) => {
        const files: Array<FileResource> = [];
        if (res) res.fileList?.forEach(file => {
          if (file.isFile === 1) files.push(file);
          expandedIds.delete(file.id);
        });
        if (onDelJsJob) onDelJsJob(files);
        this.setState({ showDeleteDialog: false });
        this.reLoadTreeData(false);
      }).finally(() => this.setState({ deleteJobLoading: false }));
  }

  /** 新增目录 */
  private addDir() {
    const { expandedIds, addDirForm: { path } } = this.state;
    this.setState({ addDirLoading: true });
    request.post(FastApi.FileResourceManage.addDir, { module: 4, fullPath: path })
      .then((list: Array<FileResource>) => {
        list.forEach(item => expandedIds.add(item.id));
        this.setState({ showAddDirDialog: false });
        this.reLoadTreeData(false);
      }).finally(() => this.setState({ addDirLoading: false }));
  }

  /** 重命名文件 */
  private renameFile() {
    const { contextMenuSelectNode, renameForm } = this.state;
    const nodeData = contextMenuSelectNode?.nodeData;
    if (!nodeData || nodeData.name === renameForm.newName) {
      this.setState({ showRenameDialog: false });
      return;
    }
    this.setState({ renameLoading: true });
    request.post(FastApi.FileResourceManage.rename, { ...renameForm })
      .then((res: Array<FileResource>) => {
        this.setState({ showRenameDialog: false });
        if (res && res.length > 0) this.reLoadTreeData(false);
      }).finally(() => this.setState({ renameLoading: false }));
  }

  private enableJob() {
    const { contextMenuSelectNode } = this.state;
    this.setState({ enableLoading: true });
    request.post(
      FastApi.TaskManage.enable,
      {},
      { params: { jobId: contextMenuSelectNode?.nodeData?.jobId } }
    ).then(() => {
      this.setState({ showEnableDialog: false });
      this.reLoadTreeData(false, true);
    }).finally(() => this.setState({ enableLoading: false }));
  }

  private disableJob() {
    const { contextMenuSelectNode } = this.state;
    this.setState({ disableLoading: true });
    request.post(
      FastApi.TaskManage.disable,
      {},
      { params: { jobId: contextMenuSelectNode?.nodeData?.jobId } }
    ).then(() => {
      this.setState({ showDisableDialog: false });
      this.reLoadTreeData(false, true);
    }).finally(() => this.setState({ disableLoading: false }));
  }

  private execJob() {
    const { contextMenuSelectNode } = this.state;
    this.setState({ execJobLoading: true });
    request.post(
      FastApi.TaskManage.execJob,
      {},
      { params: { jobId: contextMenuSelectNode?.nodeData?.jobId } }
    ).then(() => {
      this.setState({ showExecJobDialog: false });
    }).finally(() => this.setState({ execJobLoading: false }));
  }

  /** 填充TreeData(选中状态、展开状态、排序) */
  private fillTreeState(treeData: Array<TreeNodeInfo<JobFileResourceRes>>): Array<TreeNodeInfo<JobFileResourceRes>> {
    const { expandedIds, selectedId, nodeNameSort } = this.state;
    const fillTreeNodeState = (node: TreeNodeInfo<JobFileResourceRes>) => {
      node.isSelected = selectedId === node.id;
      node.isExpanded = expandedIds.has(node.id);
      if (node.childNodes && node.childNodes.length > 0) {
        node.childNodes = lodash.sortBy(node.childNodes, node => {
          if (!node.nodeData) return node.label;
          else if (node.nodeData.isFile === 1) return "b" + node.label;
          return "a" + node.label;
        });
        if (nodeNameSort === "DESC") node.childNodes = node.childNodes.reverse();
        node.childNodes.forEach(childNode => fillTreeNodeState(childNode));
      }
    };
    treeData = lodash.sortBy(treeData, node => {
      if (!node.nodeData) return node.label;
      else if (node.nodeData.isFile === 1) return "b" + node.label;
      return "a" + node.label;
    });
    if (nodeNameSort === "DESC") treeData = treeData.reverse();
    treeData.forEach(node => fillTreeNodeState(node));
    return treeData;
  }

  private getHead() {
    const { openFileId, onHidePanel, onSelectChange } = this.props;
    const { expandedIds, treeData, selectedId, nodeNameSort } = this.state;
    return (
      <>
        <div className={cls(styles.flexItemColumnWidthFull)}/>
        <Icon
          className={cls(styles.flexItemColumn, styles.icon, { [styles.iconDisable]: noValue(openFileId) })}
          component={Locate}
          onClick={() => {
            if (noValue(openFileId)) return;
            if (selectedId === openFileId) return;
            let selectNode: TreeNodeInfo<JobFileResourceRes> | undefined;
            treeData.forEach(node => forEachTreeNode(node, n => {
              if (n.nodeData?.fileResourceId === openFileId) selectNode = n;
            }));
            if (selectNode) {
              if (onSelectChange) onSelectChange(selectNode);
              this.setState({ selectedId: openFileId! });
            }
          }}
        />
        <Icon
          className={cls(styles.flexItemColumn, styles.icon, styles.iconDisable)}
          component={Find}
        />
        {
          nodeNameSort === "ASC" &&
          <SortAscendingOutlined
            className={cls(styles.flexItemColumn, styles.icon)}
            onClick={() => this.setState({ nodeNameSort: "DESC" })}
          />
        }
        {
          nodeNameSort === "DESC" &&
          <SortDescendingOutlined
            className={cls(styles.flexItemColumn, styles.icon)}
            onClick={() => this.setState({ nodeNameSort: "ASC" })}
          />
        }
        <Icon
          className={cls(styles.flexItemColumn, styles.icon)}
          component={Refresh}
          style={{ fontSize: 14, padding: 5 }}
          onClick={() => this.reLoadTreeData()}
        />
        <Icon
          className={cls(styles.flexItemColumn, styles.icon)}
          component={ExpandAll}
          onClick={() => {
            treeData.forEach(node => forEachTreeNode(node, n => {
              if (n.nodeData?.isFile === 0) expandedIds.add(n.id);
            }));
            this.forceUpdate();
          }}
        />
        <Icon
          className={cls(styles.flexItemColumn, styles.icon)}
          component={CollapseAll}
          onClick={() => {
            expandedIds.clear();
            this.forceUpdate();
          }}
        />
        <MinusOutlined
          className={cls(styles.flexItemColumn, styles.icon, { [styles.iconDisable]: noValue(onHidePanel) })}
          onClick={() => {
            if (onHidePanel) onHidePanel();
          }}
        />
        <div className={cls(styles.flexItemColumn)} style={{ marginRight: 2 }}/>
      </>
    );
  }

  private getContextMenu() {
    const { expandedIds, contextMenuSelectNode } = this.state;
    const triggerDisable = contextMenuSelectNode?.nodeData?.triggerDisable === 1;
    const hasSelectNode = contextMenuSelectNode && contextMenuSelectNode.nodeData;
    const hasSelectJob = contextMenuSelectNode && contextMenuSelectNode.nodeData && contextMenuSelectNode.nodeData.jobName;
    return (
      <Menu className={cls(styles.menu)}>
        <MenuItem
          icon={<Icon component={AddFile} className={cls(styles.menuIcon)}/>}
          text="新增定时任务"
          onClick={() => {
            const addJsJobForm: AddJsJobForm = { name: "", filePath: "/", fileName: "", cron: "" };
            const nodeData = contextMenuSelectNode?.nodeData;
            if (nodeData) addJsJobForm.filePath = nodeData.isFile === 1 ? nodeData.path : (nodeData.path + nodeData.name);
            if (!addJsJobForm.filePath.endsWith("/")) addJsJobForm.filePath += "/";
            this.setState({ showAddJsJobDialog: true, addJsJobForm: addJsJobForm });
          }}
        />
        <MenuItem
          icon={<Icon component={AddFolder} className={cls(styles.menuIcon)}/>}
          text="新增目录"
          onClick={() => {
            const addDirForm: AddDirForm = { path: "/" };
            const nodeData = contextMenuSelectNode?.nodeData;
            if (nodeData) addDirForm.path = nodeData.isFile === 1 ? nodeData.path : (nodeData.path + nodeData.name);
            if (!addDirForm.path.endsWith("/")) addDirForm.path += "/";
            this.setState({ showAddDirDialog: true, addDirForm });
          }}
        />
        <MenuDivider/>
        <MenuItem
          icon={<Icon component={TimedTask} className={cls(styles.menuIcon, { [styles.iconDisable]: true })}/>}
          text="任务执行明细"
          disabled={true}
        />
        <MenuItem
          icon={<Icon component={Execute} className={cls(styles.menuIcon, { [styles.iconDisable]: !hasSelectJob })}/>}
          text="立即执行"
          disabled={!hasSelectJob}
          onClick={() => this.setState({ showExecJobDialog: true })}
        />
        <MenuItem
          icon={<Icon component={Copy} className={cls(styles.menuIcon)}/>}
          text="复制名称"
          disabled={!hasSelectNode}
          onClick={() => {
            const nodeData = contextMenuSelectNode?.nodeData;
            if (nodeData) copyToClipboard(nodeData.name);
          }}
        />
        <MenuItem
          icon={<Icon component={Copy} className={cls(styles.menuIcon)}/>}
          text="复制文件路径"
          disabled={!hasSelectNode}
          onClick={() => {
            const nodeData = contextMenuSelectNode?.nodeData;
            if (nodeData) copyToClipboard(nodeData.path + nodeData.name);
          }}
        />
        <MenuDivider/>
        <MenuItem
          icon={<Icon component={triggerDisable ? StartTimer : StopTimer} className={cls(styles.menuIcon, { [styles.iconDisable]: !hasSelectJob })}/>}
          text={triggerDisable ? "启用任务" : "禁用任务"}
          disabled={!hasSelectJob}
          onClick={() => {
            if (triggerDisable) {
              this.setState({ showEnableDialog: true });
            } else {
              this.setState({ showDisableDialog: true });
            }
          }}
        />
        <MenuItem
          icon={<Icon component={Remove} className={cls(styles.menuIcon)}/>}
          text="删除"
          disabled={!contextMenuSelectNode}
          onClick={() => this.setState({ showDeleteDialog: true })}
        />
        <MenuItem
          icon={<Icon component={EditSource} className={cls(styles.menuIcon)}/>}
          text="重命名"
          disabled={!contextMenuSelectNode}
          onClick={() => {
            const renameForm: RenameForm = { id: "", path: "/", newName: "" };
            const nodeData = contextMenuSelectNode?.nodeData;
            if (nodeData) {
              renameForm.id = nodeData.fileResourceId;
              renameForm.path = nodeData.path;
              renameForm.newName = nodeData.name;
            }
            if (!renameForm.path.endsWith("/")) renameForm.path += "/";
            this.setState({ showRenameDialog: true, renameForm });
          }}
        />
        <MenuDivider/>
        <MenuItem
          icon={<Icon component={ExpandAll} className={cls(styles.menuIcon)}/>}
          text="展开子节点"
          disabled={!contextMenuSelectNode || !contextMenuSelectNode.childNodes || contextMenuSelectNode.childNodes.length <= 0}
          onClick={() => {
            if (contextMenuSelectNode) {
              forEachTreeNode(contextMenuSelectNode, n => {
                if (n.nodeData?.isFile === 0) expandedIds.add(n.id);
              });
              this.forceUpdate();
            }
          }}
        />
        <MenuItem
          icon={<Icon component={Refresh} className={cls(styles.menuIcon)}/>}
          text="刷新"
          onClick={() => this.reLoadTreeData()}
        />
      </Menu>
    );
  }

  private getAddJsJobDialog() {
    const { showAddJsJobDialog, addJsJobForm, addJsJobLoading } = this.state;
    const { name, filePath, fileName, maxReentry, maxRetryCount, isUpdateData, disable, description, cron, startTime, endTime, misfireStrategy } = addJsJobForm;
    return (
      <Dialog
        className={cls(Classes.DARK, styles.dialog)}
        style={{ width: 600 }}
        lazy={true}
        icon={<Icon component={AddFile} className={cls(styles.menuIcon)} style={{ marginRight: 8 }}/>}
        title={"新增定时任务"}
        transitionDuration={0.1}
        usePortal={true}
        isCloseButtonShown={!addJsJobLoading}
        canEscapeKeyClose={!addJsJobLoading}
        canOutsideClickClose={false}
        autoFocus={true}
        enforceFocus={true}
        isOpen={showAddJsJobDialog}
        onClose={() => this.setState({ showAddJsJobDialog: false })}
      >
        <FormGroup style={{ marginTop: 12 }} inline={true} label={"所属目录"}>
          <InputGroup
            type={"text"}
            placeholder={"输入所属目录"}
            disabled={addJsJobLoading}
            value={filePath}
            onChange={e => this.setState({ addJsJobForm: { ...addJsJobForm, filePath: e.target.value } })}
          />
        </FormGroup>
        <FormGroup style={{ marginBottom: 12 }} inline={true} label={"文件名称"}>
          <InputGroup
            type={"text"}
            placeholder={"输入文件名称"}
            disabled={addJsJobLoading}
            autoFocus={true}
            value={fileName}
            onChange={e => this.setState({ addJsJobForm: { ...addJsJobForm, fileName: e.target.value } })}
          />
        </FormGroup>
        <FormGroup style={{ marginBottom: 12 }} inline={true} label={"任务名称"}>
          <InputGroup
            type={"text"}
            placeholder={"输入任务名称"}
            disabled={addJsJobLoading}
            value={name}
            onChange={e => this.setState({ addJsJobForm: { ...addJsJobForm, name: e.target.value } })}
          />
        </FormGroup>
        <FormGroup style={{ marginBottom: 12 }} inline={true} label={"执行时间"}>
          <InputGroup
            type={"text"}
            placeholder={"输入cron表达式，如：0 0/5 * * * ? *"}
            disabled={addJsJobLoading}
            value={cron}
            onChange={e => this.setState({ addJsJobForm: { ...addJsJobForm, cron: e.target.value } })}
          />
        </FormGroup>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={() => this.setState({ showAddJsJobDialog: false })} disabled={addJsJobLoading}>取消</Button>
            <Button intent={Intent.PRIMARY} onClick={() => this.addJsJob()} loading={addJsJobLoading}>确认</Button>
          </div>
        </div>
      </Dialog>
    );
  }

  private getAddDirDialog() {
    const { showAddDirDialog, addDirForm: { path }, addDirLoading } = this.state;
    return (
      <Dialog
        className={cls(Classes.DARK, styles.dialog)}
        style={{ width: 460 }}
        lazy={true}
        icon={<Icon component={AddFolder} className={cls(styles.menuIcon)} style={{ marginRight: 8 }}/>}
        title={"新增目录"}
        transitionDuration={0.1}
        usePortal={true}
        isCloseButtonShown={!addDirLoading}
        canEscapeKeyClose={!addDirLoading}
        canOutsideClickClose={false}
        autoFocus={true}
        enforceFocus={true}
        isOpen={showAddDirDialog}
        onClose={() => this.setState({ showAddDirDialog: false })}
      >
        <FormGroup style={{ marginTop: 12, marginBottom: 12 }} inline={true} label={"目录全路径"} helperText={"输入目录全路径(汉字、字母、数字、以及'-'、'_'、'/')"}>
          <InputGroup
            type={"text"}
            placeholder={"输入目录路径"}
            disabled={addDirLoading}
            autoFocus={true}
            value={path}
            onChange={e => this.setState({ addDirForm: { path: e.target.value } })}
          />
        </FormGroup>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={() => this.setState({ showAddDirDialog: false })} disabled={addDirLoading}>取消</Button>
            <Button intent={Intent.PRIMARY} onClick={() => this.addDir()} loading={addDirLoading}>确认</Button>
          </div>
        </div>
      </Dialog>
    );
  }

  private getRenameDialog() {
    const { contextMenuSelectNode, showRenameDialog, renameForm: { id, path, newName }, renameLoading } = this.state;
    return (
      <Dialog
        className={cls(Classes.DARK, styles.dialog, styles.renameDialog)}
        style={{ width: 460 }}
        lazy={true}
        icon={<Icon component={EditSource} className={cls(styles.menuIcon)} style={{ marginRight: 8 }}/>}
        title={"重命名"}
        transitionDuration={0.1}
        usePortal={true}
        isCloseButtonShown={!renameLoading}
        canEscapeKeyClose={!renameLoading}
        canOutsideClickClose={false}
        autoFocus={true}
        enforceFocus={true}
        isOpen={showRenameDialog && hasValue(id)}
        onClose={() => this.setState({ showRenameDialog: false })}
      >
        <FormGroup style={{ marginTop: 12 }} inline={true} label={"所属目录"}>
          <InputGroup
            type={"text"}
            placeholder={"输入所属目录"}
            disabled={true}
            value={path}
          />
        </FormGroup>
        <FormGroup style={{ marginBottom: 12 }} inline={true} label={"名称"}>
          <InputGroup
            type={"text"}
            placeholder={"输入名称"}
            disabled={renameLoading}
            autoFocus={true}
            value={newName}
            onChange={e => this.setState({ renameForm: { id, path, newName: e.target.value } })}
          />
        </FormGroup>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={() => this.setState({ showRenameDialog: false })} disabled={renameLoading}>取消</Button>
            <Button
              intent={Intent.PRIMARY}
              loading={renameLoading}
              disabled={contextMenuSelectNode?.nodeData?.name === newName}
              onClick={() => this.renameFile()}
            >
              确认
            </Button>
          </div>
        </div>
      </Dialog>
    );
  }

  private getDeleteDialog() {
    const { contextMenuSelectNode, showDeleteDialog, deleteJobLoading } = this.state;
    const nodeData = contextMenuSelectNode?.nodeData;
    return (
      <Alert
        icon={"trash"}
        intent={Intent.DANGER}
        cancelButtonText={"取消"}
        confirmButtonText={"删除"}
        canEscapeKeyCancel={!deleteJobLoading}
        canOutsideClickCancel={!deleteJobLoading}
        transitionDuration={0.1}
        isOpen={showDeleteDialog && hasValue(nodeData)}
        loading={deleteJobLoading}
        onCancel={() => this.setState({ showDeleteDialog: false })}
        onConfirm={() => this.delJsJob()}
      >
        {
          nodeData?.isFile === 1 &&
          <p>
            确认删除定时任务以及文件: <br/>
            {nodeData?.path + nodeData?.name}？
          </p>
        }
        {
          nodeData?.isFile === 0 &&
          <p>
            确认删除目录: {nodeData?.path + nodeData?.name}？<br/>
            <span>此操作会删除目录下的所有定时任务！</span>
          </p>
        }
      </Alert>
    );
  }

  private getEnableDialog() {
    const { contextMenuSelectNode, showEnableDialog, enableLoading } = this.state;
    return (
      <Alert
        icon={(<Icon component={StartTimer} className={cls(styles.flexItemColumn, styles.alertIcon)}/>)}
        intent={Intent.PRIMARY}
        cancelButtonText={"取消"}
        confirmButtonText={"启用"}
        canEscapeKeyCancel={!enableLoading}
        canOutsideClickCancel={!enableLoading}
        transitionDuration={0.1}
        isOpen={showEnableDialog && hasValue(contextMenuSelectNode?.nodeData?.jobId)}
        loading={enableLoading}
        onCancel={() => this.setState({ showEnableDialog: false })}
        onConfirm={() => this.enableJob()}
      >
        <p>
          确认启用定时任务？<br/>
          <span>{contextMenuSelectNode?.nodeData?.jobName}</span>
        </p>
      </Alert>
    );
  }

  private getDisableDialog() {
    const { contextMenuSelectNode, showDisableDialog, disableLoading } = this.state;
    return (
      <Alert
        icon={(<Icon component={StopTimer} className={cls(styles.flexItemColumn, styles.alertIcon)}/>)}
        intent={Intent.DANGER}
        cancelButtonText={"取消"}
        confirmButtonText={"禁用"}
        canEscapeKeyCancel={!disableLoading}
        canOutsideClickCancel={!disableLoading}
        transitionDuration={0.1}
        isOpen={showDisableDialog && hasValue(contextMenuSelectNode?.nodeData?.jobId)}
        loading={disableLoading}
        onCancel={() => this.setState({ showDisableDialog: false })}
        onConfirm={() => this.disableJob()}
      >
        <p>
          确认禁用定时任务？<br/>
          <span>{contextMenuSelectNode?.nodeData?.jobName}</span>
        </p>
      </Alert>
    );
  }

  private getExecJobDialog() {
    const { contextMenuSelectNode, showExecJobDialog, execJobLoading } = this.state;
    return (
      <Alert
        icon={(<Icon component={Execute} className={cls(styles.flexItemColumn, styles.alertIcon)}/>)}
        intent={Intent.PRIMARY}
        cancelButtonText={"取消"}
        confirmButtonText={"立即执行"}
        canEscapeKeyCancel={!execJobLoading}
        canOutsideClickCancel={!execJobLoading}
        transitionDuration={0.1}
        isOpen={showExecJobDialog && hasValue(contextMenuSelectNode?.nodeData?.jobId)}
        loading={execJobLoading}
        onCancel={() => this.setState({ showExecJobDialog: false })}
        onConfirm={() => this.execJob()}
      >
        <p>
          确认立即执行定时任务？<br/>
          <span>{contextMenuSelectNode?.nodeData?.jobName}</span>
        </p>
      </Alert>
    );
  }

  render() {
    this.saveComponentState();
    const { className, openFileId, onSelectChange, onOpenFile } = this.props;
    const { loading, expandedIds, selectedId } = this.state;
    let { treeData, } = this.state;
    treeData = this.fillTreeState(treeData);
    return (
      <div className={cls(Classes.DARK, styles.panel, className)}>
        <div className={cls(styles.flexColumn, styles.head)}>
          {this.getHead()}
        </div>
        {loading && <Spinner className={cls(styles.loading)} intent={Intent.PRIMARY} size={SpinnerSize.SMALL}/>}
        <ContextMenu2
          className={cls(styles.center, { [styles.hide]: loading })}
          content={this.getContextMenu()}
          onContextMenu={e => {
            const className = (e?.target as any)?.className;
            if (className === "simplebar-content-wrapper" || className === styles.emptyDiv) {
              this.setState({ contextMenuSelectNode: undefined });
            }
          }}
        >
          <SimpleBar
            style={{ height: "100%", width: "100%" }}
            autoHide={false}
            scrollbarMinSize={48}
          >
            <Tree
              className={cls(styles.fileTree)}
              contents={treeData}
              onNodeExpand={node => {
                if (node.childNodes && node.childNodes.length <= 0) return;
                expandedIds.add(node.id);
                if (onSelectChange && selectedId !== node.id) onSelectChange(node);
                this.setState({ selectedId: node.id });
              }}
              onNodeCollapse={node => {
                if (node.childNodes && node.childNodes.length <= 0) return;
                forEachTreeNode(node, n => expandedIds.delete(n.id));
                if (onSelectChange && selectedId !== node.id) onSelectChange(node);
                this.setState({ selectedId: node.id });
              }}
              onNodeDoubleClick={node => {
                if (node.childNodes && node.childNodes.length > 0) {
                  if (node.isExpanded) {
                    forEachTreeNode(node, n => expandedIds.delete(n.id));
                  } else {
                    expandedIds.add(node.id);
                  }
                }
                if (node.nodeData?.isFile === 1 && onOpenFile) {
                  onOpenFile(node.nodeData);
                }
                if (onSelectChange && selectedId !== node.id) onSelectChange(node);
                this.setState({ selectedId: node.id });
              }}
              onNodeClick={node => {
                if (onSelectChange && selectedId !== node.id) onSelectChange(node);
                this.setState({ selectedId: node.id });
              }}
              onNodeContextMenu={node => {
                if (onSelectChange && selectedId !== node.id) onSelectChange(node);
                this.setState({ selectedId: node.id, contextMenuSelectNode: node });
              }}
            />
            <div className={styles.emptyDiv}/>
          </SimpleBar>
        </ContextMenu2>
        {this.getAddJsJobDialog()}
        {this.getAddDirDialog()}
        {this.getRenameDialog()}
        {this.getDeleteDialog()}
        {this.getEnableDialog()}
        {this.getDisableDialog()}
        {this.getExecJobDialog()}
      </div>
    );
  }
}

const transformTreeData = (rawData: Array<SimpleTreeNode<JobFileResourceRes>>): Array<TreeNodeInfo<JobFileResourceRes>> => {
  const treeData: Array<TreeNodeInfo<JobFileResourceRes>> = [];
  const transformNode = (rawNode: SimpleTreeNode<JobFileResourceRes>): TreeNodeInfo<JobFileResourceRes> => {
    const attributes = rawNode.attributes;
    const isFile = attributes.isFile === 1;
    const node: TreeNodeInfo<JobFileResourceRes> = {
      id: rawNode.id,
      label: attributes.name,
      icon: (
        isFile ?
          <Icon component={getFileIcon(attributes.name)} className={cls(Classes.ICON, styles.folderIcon)}/> :
          <Icon component={Folder} className={cls(Classes.ICON, styles.folderIcon)}/>
      ),
      nodeData: attributes,
      isExpanded: false,
      isSelected: false,
    };
    if (!isFile && rawNode.children && rawNode.children.length > 0) {
      node.childNodes = [];
      rawNode.children.forEach(childRawNode => node.childNodes?.push(transformNode(childRawNode)));
    }
    return node;
  };
  rawData.forEach(rawNode => treeData.push(transformNode(rawNode)));
  return treeData;
};

const forEachTreeNode = (node: TreeNodeInfo<JobFileResourceRes>, callBack: (n: TreeNodeInfo<JobFileResourceRes>) => void): void => {
  if (!callBack) return;
  callBack(node);
  if (node.childNodes && node.childNodes.length > 0) {
    node.childNodes.forEach(child => forEachTreeNode(child, callBack));
  }
};

export type { TaskResourcePanelProps, TaskResourcePanelState };
export { TaskResourcePanel };
