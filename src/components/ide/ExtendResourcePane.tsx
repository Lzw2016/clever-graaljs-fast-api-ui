// noinspection DuplicatedCode

import React from "react";
import cls from "classnames";
import lodash from "lodash";
import Icon, { MinusOutlined, SortAscendingOutlined, SortDescendingOutlined } from "@ant-design/icons";
import copyToClipboard from "copy-to-clipboard";
import SimpleBar from "simplebar-react";
import { Classes, Intent, Menu, MenuDivider, MenuItem, Spinner, SpinnerSize, Tree, TreeNodeInfo } from "@blueprintjs/core";
import { ContextMenu2 } from "@blueprintjs/popover2";
import { FastApi } from "@/apis";
import { noValue } from "@/utils/utils";
import { request } from "@/utils/request";
import { componentStateKey, fastApiStore } from "@/utils/storage";
import { AddFile, AddFolder, CollapseAll, Copy, EditSource, ExpandAll, Find, Folder, getFileIcon, Locate, Refresh, Remove } from "@/utils/IdeaIconUtils";
import styles from "./ExtendResourcePane.module.less";

interface ExtendResourcePaneProps {
  /** 自定义样式 */
  className?: string;
  /** 当前打开的文件ID */
  openFileId?: string;
  /** 选择节点变化事件 */
  onSelectChange?: (node: TreeNodeInfo<FileResourceTreeNodeRes>) => void;
  /** 打开文件事件 */
  onOpenFile?: (resource: FileResourceTreeNodeRes) => void;
  /** 当前组件点击最小化事件 */
  onHidePanel?: () => void;
}

interface ExtendResourcePaneState {
  /** 数据加载状态 */
  loading: boolean;
  /** 树数据 */
  treeData: Array<TreeNodeInfo<FileResourceTreeNodeRes>>;
  /** 已展开的节点ID */
  expandedIds: Set<TreeNodeInfo["id"]>;
  /** 当前选择的节点ID */
  selectedId: TreeNodeInfo["id"];
  /** 右键菜单选中的Tree节点 */
  contextMenuSelectNode?: TreeNodeInfo<FileResourceTreeNodeRes>;
  /** 节点名称排序规则 */
  nodeNameSort: "ASC" | "DESC";
}

// 读取组件状态
const storageState: Partial<FileResourceTreeNodeRes> = await fastApiStore.getItem(componentStateKey.ExtendResourcePaneState) ?? {};
// 组件状态默认值
const defaultState: ExtendResourcePaneState = {
  loading: true,
  treeData: [],
  expandedIds: new Set(),
  selectedId: "",
  nodeNameSort: "ASC",
  ...storageState,
}

class ExtendResourcePane extends React.Component<ExtendResourcePaneProps, ExtendResourcePaneState> {
  constructor(props: ExtendResourcePaneProps) {
    super(props);
    this.state = { ...defaultState };
  }

  // 组件挂载后
  public componentDidMount() {
    this.reLoadTreeData();
  }

  // 组件将要被卸载
  public componentWillUnmount() {
    this.saveState();
  }

  /** 重新加载数据 */
  public reLoadTreeData() {
    this.setState({ loading: true }, () => {
      request.get(FastApi.ExtendFileManage.getExtendTree)
        .then(treeData => {
          treeData = transformTreeData(treeData);
          const { onSelectChange } = this.props;
          if (onSelectChange) {
            const { selectedId } = this.state;
            let selectNode: TreeNodeInfo<FileResourceTreeNodeRes> | undefined;
            (treeData as Array<TreeNodeInfo<FileResourceTreeNodeRes>>).forEach(node => forEachTreeNode(node, n => {
              if (n.nodeData?.id === selectedId) selectNode = n;
            }));
            if (selectNode) onSelectChange(selectNode);
          }
          this.setState({ treeData });
        })
        .finally(() => this.setState({ loading: false }));
    });
  }

  /** 保存组件状态 */
  public saveState(): void {
    const { treeData, expandedIds, selectedId, nodeNameSort } = this.state;
    const allIds = new Set();
    treeData.forEach(node => forEachTreeNode(node, n => allIds.add(n.id)));
    expandedIds.forEach(id => {
      if (!allIds.has(id)) expandedIds.delete(id);
    });
    fastApiStore
      .setItem(componentStateKey.ExtendResourcePaneState, { expandedIds, selectedId, nodeNameSort })
      .finally();
  }

  private fillTreeState(treeData: Array<TreeNodeInfo<FileResourceTreeNodeRes>>): Array<TreeNodeInfo<FileResourceTreeNodeRes>> {
    const { expandedIds, selectedId, nodeNameSort } = this.state;
    const fillTreeNodeState = (node: TreeNodeInfo<FileResourceTreeNodeRes>) => {
      node.isSelected = selectedId === node.id;
      node.isExpanded = expandedIds.has(node.id);
      if (node.childNodes && node.childNodes.length > 0) {
        node.childNodes = lodash.sortBy(node.childNodes, node => node.label);
        if (nodeNameSort === "DESC") node.childNodes = node.childNodes.reverse();
        node.childNodes.forEach(childNode => fillTreeNodeState(childNode));
      }
    };
    treeData = lodash.sortBy(treeData, node => node.label);
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
            let selectNode: TreeNodeInfo<FileResourceTreeNodeRes> | undefined;
            treeData.forEach(node => forEachTreeNode(node, n => {
              if (n.nodeData?.id === openFileId) selectNode = n;
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
          text="新增文件"
          onClick={() => {
          }}
        />
        <MenuItem
          icon={<Icon component={AddFolder} className={cls(styles.menuIcon)}/>}
          text="新增文件夹"
          onClick={() => {
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
          onClick={() => {
          }}
        />
        <MenuItem
          icon={<Icon component={EditSource} className={cls(styles.menuIcon)}/>}
          text="重命名"
          disabled={!contextMenuSelectNode}
          onClick={() => {
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

  render() {
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
            if ((e?.target as any)?.className === "simplebar-content-wrapper") {
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
                if (node.nodeData?.isFile === 1 && onOpenFile && openFileId !== node.nodeData?.id) {
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
          </SimpleBar>
        </ContextMenu2>
      </div>
    );
  }
}

const transformTreeData = (rawData: Array<SimpleTreeNode<FileResourceTreeNodeRes>>): Array<TreeNodeInfo<FileResourceTreeNodeRes>> => {
  const treeData: Array<TreeNodeInfo<FileResourceTreeNodeRes>> = [];
  const transformNode = (rawNode: SimpleTreeNode<FileResourceTreeNodeRes>): TreeNodeInfo<FileResourceTreeNodeRes> => {
    const attributes = rawNode.attributes;
    const isFile = attributes.isFile === 1;
    const node: TreeNodeInfo<FileResourceTreeNodeRes> = {
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

const forEachTreeNode = (node: TreeNodeInfo<FileResourceTreeNodeRes>, callBack: (n: TreeNodeInfo<FileResourceTreeNodeRes>) => void): void => {
  if (!callBack) return;
  callBack(node);
  if (node.childNodes && node.childNodes.length > 0) {
    node.childNodes.forEach(child => forEachTreeNode(child, callBack));
  }
};

export type { ExtendResourcePaneProps, ExtendResourcePaneState };
export default ExtendResourcePane;
