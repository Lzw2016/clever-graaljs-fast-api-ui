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
import { AddFile, AddFolder, CollapseAll, Copy, EditSource, ExpandAll, Find, Folder, getFileIcon, Locate, Refresh, Remove } from "@/utils/IdeaIconUtils";
import styles from "./HttpApiResourcePanel.module.less";

interface AddHttpApiForm {
  path: string;
  name: string;
  requestMapping: string;
  requestMethod: RequestMethod;
}

interface AddDirForm {
  path: string;
}

interface RenameForm {
  id: string;
  path: string;
  newName: string;
}

interface HttpApiResourcePanelProps {
  /** 自定义样式 */
  className?: string;
  /** 当前打开的文件ID */
  openFileId?: string;
  /** 选择节点变化事件 */
  onSelectChange?: (node: TreeNodeInfo<ApiFileResourceRes>) => void;
  /** 打开文件事件 */
  onOpenFile?: (apiFileResource: ApiFileResourceRes) => void;
  /** 当前组件点击最小化事件 */
  onHidePanel?: () => void;
  /** 新增接口成功 */
  onAddHttpApi?: (httpApi: HttpApi, file: FileResource) => void;
  /** 删除接口成功 */
  onDelHttpApi?: (files: Array<FileResource>) => void;
}

interface HttpApiResourcePanelState {
  /** 数据加载状态 */
  loading: boolean;
  /** 树数据 */
  treeData: Array<TreeNodeInfo<ApiFileResourceRes>>;
  /** 已展开的节点ID */
  expandedIds: Set<TreeNodeInfo["id"]>;
  /** 当前选择的节点ID */
  selectedId: TreeNodeInfo["id"];
  /** 右键菜单选中的Tree节点 */
  contextMenuSelectNode?: TreeNodeInfo<ApiFileResourceRes>;
  /** 节点名称排序规则 */
  nodeNameSort: "ASC" | "DESC";
  /** 显示新增接口对话框 */
  showAddHttpApiDialog: boolean;
  /** 新增接口表单数据 */
  addHttpApiForm: AddHttpApiForm;
  /** addHttpApi requestMethod 值用户是否自定义输入 */
  addHttpApiRequestMappingChanged: boolean;
  /** 新增接口Loading */
  addHttpApiLoading: boolean;
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
  deleteApiLoading: boolean;
}

// 组件状态默认值
const defaultState: HttpApiResourcePanelState = {
  loading: true,
  treeData: [],
  expandedIds: new Set(),
  selectedId: "",
  nodeNameSort: "ASC",
  showAddHttpApiDialog: false,
  addHttpApiForm: { path: "/", name: "", requestMapping: "", requestMethod: "GET" },
  addHttpApiRequestMappingChanged: false,
  addHttpApiLoading: false,
  showAddDirDialog: false,
  addDirForm: { path: "/" },
  addDirLoading: false,
  showRenameDialog: false,
  renameForm: { id: "", path: "", newName: "" },
  renameLoading: false,
  showDeleteDialog: false,
  deleteApiLoading: false,
}

class HttpApiResourcePanel extends React.Component<HttpApiResourcePanelProps, HttpApiResourcePanelState> {
  /** 执行组件状态的全局锁 */
  private saveStateLock: boolean = false;
  /** 保存组件的状态 */
  private saveComponentState = lodash.debounce(() => this.saveState().finally(), 1_000, { maxWait: 3_000 });

  constructor(props: HttpApiResourcePanelProps) {
    super(props);
    this.state = { ...defaultState, ...storeGetData(componentStateKey.HttpApiResourcePanelState) };
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
      componentStateKey.HttpApiResourcePanelState,
      { expandedIds, selectedId, nodeNameSort },
    ).finally(() => {
      this.saveStateLock = false;
    });
  }

  /** 重新加载数据 */
  public reLoadTreeData(spin: boolean = true, triggerOnSelectChange: boolean = true) {
    if (spin) this.setState({ loading: true });
    request.get(FastApi.HttpApiManage.getHttpApiTree)
      .then(treeData => {
        treeData = transformTreeData(treeData);
        const { onSelectChange } = this.props;
        if (triggerOnSelectChange && onSelectChange) {
          const { selectedId } = this.state;
          let selectNode: TreeNodeInfo<ApiFileResourceRes> | undefined;
          (treeData as Array<TreeNodeInfo<ApiFileResourceRes>>).forEach(node => forEachTreeNode(node, n => {
            if (n.nodeData?.fileResourceId === selectedId) selectNode = n;
          }));
          if (selectNode) onSelectChange(selectNode);
        }
        this.setState({ treeData });
      }).finally(() => {
      if (spin) this.setState({ loading: false });
    });
  }

  /** 新增接口 */
  private addHttpApi() {
    const { onAddHttpApi } = this.props;
    const { expandedIds, addHttpApiForm } = this.state;
    this.setState({ addHttpApiLoading: true });
    request.post(FastApi.HttpApiManage.addHttpApi, { ...addHttpApiForm })
      .then((res: AddHttpApiRes) => {
        res?.fileList?.forEach(item => {
          if (item.isFile === 0) {
            expandedIds.add(item.id);
            return
          }
          if (onAddHttpApi) onAddHttpApi(res.httpApi, item);
          this.setState({ selectedId: item.id });
        });
        this.setState({ showAddHttpApiDialog: false });
        this.reLoadTreeData(false);
      }).finally(() => this.setState({ addHttpApiLoading: false }));
  }

  /** 新增目录 */
  private addDir() {
    const { expandedIds, addDirForm: { path } } = this.state;
    this.setState({ addDirLoading: true });
    request.post(FastApi.FileResourceManage.addDir, { module: 3, fullPath: path })
      .then((list: Array<FileResource>) => {
        list.forEach(item => expandedIds.add(item.id));
        this.setState({ showAddDirDialog: false });
        this.reLoadTreeData(false);
      }).finally(() => this.setState({ addDirLoading: false }));
  }

  /** 删除HttpApi */
  private delHttpApi() {
    const { onDelHttpApi } = this.props;
    const { expandedIds, contextMenuSelectNode } = this.state;
    const nodeData = contextMenuSelectNode?.nodeData;
    if (!nodeData) {
      this.setState({ showDeleteDialog: false });
      return;
    }
    this.setState({ deleteApiLoading: true });
    request.delete(FastApi.HttpApiManage.delHttpApi, { params: { fileResourceId: nodeData.fileResourceId } })
      .then((res: DelHttpApiRes) => {
        const files: Array<FileResource> = [];
        if (res) res.fileList?.forEach(file => {
          if (file.isFile === 1) files.push(file);
          expandedIds.delete(file.id);
        });
        if (onDelHttpApi) onDelHttpApi(files);
        this.setState({ showDeleteDialog: false });
        this.reLoadTreeData(false);
      }).finally(() => this.setState({ deleteApiLoading: false }));
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

  /** 填充TreeData(选中状态、展开状态、排序) */
  private fillTreeState(treeData: Array<TreeNodeInfo<ApiFileResourceRes>>): Array<TreeNodeInfo<ApiFileResourceRes>> {
    const { expandedIds, selectedId, nodeNameSort } = this.state;
    const fillTreeNodeState = (node: TreeNodeInfo<ApiFileResourceRes>) => {
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
        <select className={cls(styles.flexItemColumn, styles.viewSelect)} disabled={true}>
          <option value="fileView">文件视图</option>
          <option value="apiView">接口视图</option>
        </select>
        <div className={cls(styles.flexItemColumnWidthFull)}/>
        <Icon
          className={cls(styles.flexItemColumn, styles.icon, { [styles.iconDisable]: noValue(openFileId) })}
          component={Locate}
          onClick={() => {
            if (noValue(openFileId)) return;
            if (selectedId === openFileId) return;
            let selectNode: TreeNodeInfo<ApiFileResourceRes> | undefined;
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
    return (
      <Menu className={cls(styles.menu)}>
        <MenuItem
          icon={<Icon component={AddFile} className={cls(styles.menuIcon)}/>}
          text="新增接口"
          onClick={() => {
            const addFileForm: AddHttpApiForm = { path: "/", name: "", requestMapping: "", requestMethod: "GET" };
            const nodeData = contextMenuSelectNode?.nodeData;
            if (nodeData) addFileForm.path = nodeData.isFile === 1 ? nodeData.path : (nodeData.path + nodeData.name);
            if (!addFileForm.path.endsWith("/")) addFileForm.path += "/";
            this.setState({ showAddHttpApiDialog: true, addHttpApiForm: addFileForm, addHttpApiRequestMappingChanged: false });
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
          icon={<Icon component={Copy} className={cls(styles.menuIcon)}/>}
          text="复制名称"
          disabled={!contextMenuSelectNode || !contextMenuSelectNode.nodeData}
          onClick={() => {
            const nodeData = contextMenuSelectNode?.nodeData;
            if (nodeData) copyToClipboard(nodeData.name);
          }}
        />
        <MenuItem
          icon={<Icon component={Copy} className={cls(styles.menuIcon)}/>}
          text="复制文件路径"
          disabled={!contextMenuSelectNode || !contextMenuSelectNode.nodeData}
          onClick={() => {
            const nodeData = contextMenuSelectNode?.nodeData;
            if (nodeData) copyToClipboard(nodeData.path + nodeData.name);
          }}
        />
        <MenuItem
          icon={<Icon component={Copy} className={cls(styles.menuIcon)}/>}
          text="复制接口路径"
          disabled={!contextMenuSelectNode || !contextMenuSelectNode.nodeData || !contextMenuSelectNode.nodeData.requestMapping}
          onClick={() => {
            const nodeData = contextMenuSelectNode?.nodeData;
            if (nodeData && nodeData.requestMapping) copyToClipboard(nodeData.requestMapping!);
          }}
        />
        <MenuDivider/>
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

  private getAddHttpApiDialog() {
    const { showAddHttpApiDialog, addHttpApiForm: { path, name, requestMapping, requestMethod } } = this.state;
    const { addHttpApiLoading, addHttpApiRequestMappingChanged } = this.state;
    let defRequestMapping = path + name;
    if (defRequestMapping.toLowerCase().endsWith(".js")) {
      defRequestMapping = defRequestMapping.substr(0, defRequestMapping.length - 3);
    }
    return (
      <Dialog
        className={cls(Classes.DARK, styles.dialog, styles.addHttpApiDialog)}
        style={{ width: 600 }}
        lazy={true}
        icon={<Icon component={AddFile} className={cls(styles.menuIcon)} style={{ marginRight: 8 }}/>}
        title={"新增接口"}
        transitionDuration={0.1}
        usePortal={true}
        isCloseButtonShown={!addHttpApiLoading}
        canEscapeKeyClose={!addHttpApiLoading}
        canOutsideClickClose={false}
        autoFocus={true}
        enforceFocus={true}
        isOpen={showAddHttpApiDialog}
        onClose={() => this.setState({ showAddHttpApiDialog: false })}
      >
        <FormGroup style={{ marginTop: 12 }} inline={true} label={"所属目录"}>
          <InputGroup
            type={"text"}
            placeholder={"输入所属目录"}
            disabled={addHttpApiLoading}
            value={path}
            onChange={e => this.setState({ addHttpApiForm: { path: e.target.value, name, requestMapping, requestMethod } })}
          />
        </FormGroup>
        <FormGroup style={{ marginBottom: 12 }} inline={true} label={"文件名称"}>
          <InputGroup
            type={"text"}
            placeholder={"输入文件名称"}
            disabled={addHttpApiLoading}
            autoFocus={true}
            value={name}
            onChange={e => this.setState({ addHttpApiForm: { path, name: e.target.value, requestMapping, requestMethod } })}
          />
        </FormGroup>
        <FormGroup style={{ marginBottom: 12 }} inline={true} label={"接口路径"}>
          <select
            disabled={addHttpApiLoading}
            value={requestMethod}
            onChange={e => this.setState({ addHttpApiForm: { path, name, requestMapping, requestMethod: (e?.target?.value as any) } })}
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
          <InputGroup
            type={"text"}
            placeholder={"输入接口路径"}
            disabled={addHttpApiLoading}
            value={addHttpApiRequestMappingChanged ? requestMapping : defRequestMapping}
            onChange={e => this.setState({ addHttpApiForm: { path, name, requestMapping: e.target.value, requestMethod }, addHttpApiRequestMappingChanged: true })}
          />
        </FormGroup>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={() => this.setState({ showAddHttpApiDialog: false })} disabled={addHttpApiLoading}>取消</Button>
            <Button intent={Intent.PRIMARY} onClick={() => this.addHttpApi()} loading={addHttpApiLoading}>确认</Button>
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
    const { contextMenuSelectNode, showDeleteDialog, deleteApiLoading } = this.state;
    const nodeData = contextMenuSelectNode?.nodeData;
    return (
      <Alert
        icon={"trash"}
        intent={Intent.DANGER}
        cancelButtonText={"取消"}
        confirmButtonText={"删除"}
        canEscapeKeyCancel={!deleteApiLoading}
        canOutsideClickCancel={!deleteApiLoading}
        transitionDuration={0.1}
        isOpen={showDeleteDialog && hasValue(nodeData)}
        loading={deleteApiLoading}
        onCancel={() => this.setState({ showDeleteDialog: false })}
        onConfirm={() => this.delHttpApi()}
      >
        {
          nodeData?.isFile === 1 &&
          <p>
            确认删除文件: <br/>
            {nodeData?.path + nodeData?.name}？
          </p>
        }
        {
          nodeData?.isFile === 0 &&
          <p>
            确认删除目录: {nodeData?.path + nodeData?.name}？<br/>
            <span>此操作会删除目录下的所有内容！</span>
          </p>
        }
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
        {this.getAddHttpApiDialog()}
        {this.getAddDirDialog()}
        {this.getRenameDialog()}
        {this.getDeleteDialog()}
      </div>
    );
  }
}

const transformTreeData = (rawData: Array<SimpleTreeNode<ApiFileResourceRes>>): Array<TreeNodeInfo<ApiFileResourceRes>> => {
  const treeData: Array<TreeNodeInfo<ApiFileResourceRes>> = [];
  const transformNode = (rawNode: SimpleTreeNode<ApiFileResourceRes>): TreeNodeInfo<ApiFileResourceRes> => {
    const attributes = rawNode.attributes;
    const isFile = attributes.isFile === 1;
    const node: TreeNodeInfo<ApiFileResourceRes> = {
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

const forEachTreeNode = (node: TreeNodeInfo<ApiFileResourceRes>, callBack: (n: TreeNodeInfo<ApiFileResourceRes>) => void): void => {
  if (!callBack) return;
  callBack(node);
  if (node.childNodes && node.childNodes.length > 0) {
    node.childNodes.forEach(child => forEachTreeNode(child, callBack));
  }
};

export type { HttpApiResourcePanelProps, HttpApiResourcePanelState };
export { HttpApiResourcePanel };
