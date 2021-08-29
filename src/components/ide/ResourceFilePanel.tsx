// noinspection DuplicatedCode

import React from "react";
import cls from "classnames";
import lodash from "lodash";
import Icon, { MinusOutlined, SortAscendingOutlined, SortDescendingOutlined } from "@ant-design/icons";
import copyToClipboard from "copy-to-clipboard";
import SimpleBar from "simplebar-react";
import { Classes, Intent, Menu, MenuDivider, MenuItem, Spinner, SpinnerSize, Tree, TreeNodeInfo } from "@blueprintjs/core";
import { ContextMenu2 } from "@blueprintjs/popover2";
import { noValue } from "@/utils/utils";
import { componentStateKey, storeGetData, storeSaveData } from "@/utils/storage";
import { AddFile, AddFolder, CollapseAll, Copy, EditSource, ExpandAll, Find, Folder, getFileIcon, Locate, Refresh, Remove } from "@/utils/IdeaIconUtils";
import styles from "./ResourceFilePanel.module.less";

interface AddResourceFileForm {
  path: string;
  name: string;
}

interface AddDirForm {
  path: string;
}

interface RenameForm {
  id: string;
  path: string;
  newName: string;
}

interface ResourceFilePanelProps {
  /** 自定义样式 */
  className?: string;
  /** 当前打开的文件ID */
  openFileId?: string;
  /** 选择节点变化事件 */
  onSelectChange?: (node: TreeNodeInfo<FileResource>) => void;
  /** 打开文件事件 */
  onOpenFile?: (fileResource: FileResource) => void;
  /** 当前组件点击最小化事件 */
  onHidePanel?: () => void;
  /** 新增资源文件成功 */
  onAddResourceFile?: (file: FileResource) => void;
  /** 删除资源文件成功 */
  onDelResourceFile?: (files: Array<FileResource>) => void;
}

interface ResourceFilePanelState {
  /** 数据加载状态 */
  loading: boolean;
  /** 树数据 */
  treeData: Array<TreeNodeInfo<FileResource>>;
  /** 已展开的节点ID */
  expandedIds: Set<TreeNodeInfo["id"]>;
  /** 当前选择的节点ID */
  selectedId: TreeNodeInfo["id"];
  /** 右键菜单选中的Tree节点 */
  contextMenuSelectNode?: TreeNodeInfo<FileResource>;
  /** 节点名称排序规则 */
  nodeNameSort: "ASC" | "DESC";
  /** 显示新增资源文件对话框 */
  showAddResourceFileDialog: boolean;
  /** 新增资源文件表单数据 */
  addResourceFileForm: AddResourceFileForm;
  /** 新增资源文件Loading */
  addResourceFileLoading: boolean;
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
const defaultState: ResourceFilePanelState = {
  loading: true,
  treeData: [],
  expandedIds: new Set(),
  selectedId: "",
  nodeNameSort: "ASC",
  showAddResourceFileDialog: false,
  addResourceFileForm: { path: "/", name: "" },
  addResourceFileLoading: false,
  showAddDirDialog: false,
  addDirForm: { path: "/" },
  addDirLoading: false,
  showRenameDialog: false,
  renameForm: { id: "", path: "", newName: "" },
  renameLoading: false,
  showDeleteDialog: false,
  deleteApiLoading: false,
}

class ResourceFilePanel extends React.Component<ResourceFilePanelProps, ResourceFilePanelState> {
  /** 执行组件状态的全局锁 */
  private saveStateLock: boolean = false;
  /** 保存组件的状态 */
  private saveComponentState = lodash.debounce(() => this.saveState().finally(), 1_000, { maxWait: 3_000 });

  constructor(props: ResourceFilePanelProps) {
    super(props);
    this.state = { ...defaultState, ...storeGetData(componentStateKey.ResourceFilePanelState) };
  }

  // 组件挂载后
  public componentDidMount() {
    // this.reLoadTreeData(true, false);
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
      componentStateKey.ResourceFilePanelState,
      { expandedIds, selectedId, nodeNameSort },
    ).finally(() => {
      this.saveStateLock = false;
    });
  }

  /** 填充TreeData(选中状态、展开状态、排序) */
  private fillTreeState(treeData: Array<TreeNodeInfo<FileResource>>): Array<TreeNodeInfo<FileResource>> {
    const { expandedIds, selectedId, nodeNameSort } = this.state;
    const fillTreeNodeState = (node: TreeNodeInfo<FileResource>) => {
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
          // onClick={() => {
          //   if (noValue(openFileId)) return;
          //   if (selectedId === openFileId) return;
          //   let selectNode: TreeNodeInfo<FileResource> | undefined;
          //   treeData.forEach(node => forEachTreeNode(node, n => {
          //     if (n.nodeData?.fileResourceId === openFileId) selectNode = n;
          //   }));
          //   if (selectNode) {
          //     if (onSelectChange) onSelectChange(selectNode);
          //     this.setState({ selectedId: openFileId! });
          //   }
          // }}
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
          // onClick={() => this.reLoadTreeData()}
        />
        <Icon
          className={cls(styles.flexItemColumn, styles.icon)}
          component={ExpandAll}
          // onClick={() => {
          //   treeData.forEach(node => forEachTreeNode(node, n => {
          //     if (n.nodeData?.isFile === 0) expandedIds.add(n.id);
          //   }));
          //   this.forceUpdate();
          // }}
        />
        <Icon
          className={cls(styles.flexItemColumn, styles.icon)}
          component={CollapseAll}
          // onClick={() => {
          //   expandedIds.clear();
          //   this.forceUpdate();
          // }}
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
          text="新增文件"
          // onClick={() => {
          //   const addFileForm: AddHttpApiForm = { path: "/", name: "", requestMapping: "", requestMethod: "GET" };
          //   const nodeData = contextMenuSelectNode?.nodeData;
          //   if (nodeData) addFileForm.path = nodeData.isFile === 1 ? nodeData.path : (nodeData.path + nodeData.name);
          //   if (!addFileForm.path.endsWith("/")) addFileForm.path += "/";
          //   this.setState({ showAddHttpApiDialog: true, addHttpApiForm: addFileForm, addHttpApiRequestMappingChanged: false });
          // }}
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
              renameForm.id = nodeData.id;
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
          // onClick={() => this.reLoadTreeData()}
        />
      </Menu>
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
      </div>
    );
  }
}

const transformTreeData = (rawData: Array<SimpleTreeNode<FileResource>>): Array<TreeNodeInfo<FileResource>> => {
  const treeData: Array<TreeNodeInfo<FileResource>> = [];
  const transformNode = (rawNode: SimpleTreeNode<FileResource>): TreeNodeInfo<FileResource> => {
    const attributes = rawNode.attributes;
    const isFile = attributes.isFile === 1;
    const node: TreeNodeInfo<FileResource> = {
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

const forEachTreeNode = (node: TreeNodeInfo<FileResource>, callBack: (n: TreeNodeInfo<FileResource>) => void): void => {
  if (!callBack) return;
  callBack(node);
  if (node.childNodes && node.childNodes.length > 0) {
    node.childNodes.forEach(child => forEachTreeNode(child, callBack));
  }
};

export type { ResourceFilePanelProps, ResourceFilePanelState };
export { ResourceFilePanel };
