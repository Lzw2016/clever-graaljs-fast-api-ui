// noinspection DuplicatedCode

import React from "react";
import cls from "classnames";
import lodash from "lodash";
import Icon, { MinusOutlined, SortAscendingOutlined, SortDescendingOutlined } from "@ant-design/icons";
import { Classes, TreeNodeInfo } from "@blueprintjs/core";
import { noValue } from "@/utils/utils";
import { componentStateKey, storeGetData, storeSaveData } from "@/utils/storage";
import { CollapseAll, ExpandAll, Find, Folder, getFileIcon, Locate, Refresh } from "@/utils/IdeaIconUtils";
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

  render() {
    // openFileId, onSelectChange, onOpenFile
    const { className, } = this.props;
    return (
      <div className={cls(Classes.DARK, styles.panel, className)}>
        <div className={cls(styles.flexColumn, styles.head)}>
          {this.getHead()}
        </div>
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
