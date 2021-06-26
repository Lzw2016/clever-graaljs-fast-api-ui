import React from "react";
import cls from "classnames";
import Icon, {
  AimOutlined,
  ColumnHeightOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  FolderAddOutlined,
  MinusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  VerticalAlignMiddleOutlined
} from "@ant-design/icons";
import copyToClipboard from "copy-to-clipboard";
import SimpleBar from "simplebar-react";
import { Classes, Intent, Menu, MenuDivider, MenuItem, Spinner, SpinnerSize, Tree, TreeNodeInfo } from "@blueprintjs/core";
import { ContextMenu2 } from "@blueprintjs/popover2";
import { FastApi } from "@/apis";
import { request } from "@/utils/request";
import { componentStateKey, fastApiStore } from "@/utils/storage";
import { Folder, getFileIcon } from "@/utils/IdeaIconUtils";
import styles from "./HttpApiResourcePane.module.less";

const getDataApi = FastApi.HttpApiManage.getHttpApiTree;

interface HttpApiResourcePaneProps {
//  onSelectChange
//  onOpenFile
//  openFileId
//  onExpandedPanel

}

interface HttpApiResourcePaneState {
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
}

// 读取组件状态
const storageState: Partial<HttpApiResourcePaneState> = await fastApiStore.getItem(componentStateKey.HttpApiResourcePaneState) ?? {};
// 组件状态默认值
const defaultState: HttpApiResourcePaneState = {
  loading: true,
  treeData: [],
  expandedIds: new Set(),
  selectedId: "",
  ...storageState,
}

class HttpApiResourcePane extends React.Component<HttpApiResourcePaneProps, HttpApiResourcePaneState> {
  constructor(props: HttpApiResourcePaneProps) {
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
      request.get(getDataApi)
        .then(treeData => {
          treeData = transformTreeData(treeData);
          this.setState({ treeData });
        })
        .finally(() => this.setState({ loading: false }));
    });
  }

  /** 保存组件状态 */
  public saveState(): void {
    const { treeData, expandedIds, selectedId } = this.state;
    const allIds = new Set();
    treeData.forEach(node => forEachTreeNode(node, n => allIds.add(n.id)));
    expandedIds.forEach(id => {
      if (!allIds.has(id)) expandedIds.delete(id);
    });
    fastApiStore.setItem(
      componentStateKey.HttpApiResourcePaneState,
      { expandedIds, selectedId },
    ).finally();
  }

  private fillTreeState(treeData: Array<TreeNodeInfo<ApiFileResourceRes>>): void {
    const { expandedIds, selectedId } = this.state;
    const fillTreeNodeState = (node: TreeNodeInfo<ApiFileResourceRes>) => {
      node.isSelected = selectedId === node.id;
      node.isExpanded = expandedIds.has(node.id);
      if (node.childNodes && node.childNodes.length > 0) {
        node.childNodes.forEach(childNode => fillTreeNodeState(childNode));
      }
    };
    treeData.forEach(node => fillTreeNodeState(node));
  }

  private getHead() {
    const { expandedIds, treeData } = this.state;
    return (
      <>
        <select className={cls(styles.flexItemColumn, styles.viewSelect)}>
          <option value="fileView">文件视图</option>
          <option value="apiView">接口视图</option>
        </select>
        <div className={cls(styles.flexItemColumnWidthFull)}/>
        <AimOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
        <ColumnHeightOutlined
          className={cls(styles.flexItemColumn, styles.icon)}
          onClick={() => {
            treeData.forEach(node => forEachTreeNode(node, n => {
              if (n.nodeData?.isFile === 0) expandedIds.add(n.id);
            }));
            this.forceUpdate();
          }}
        />
        <VerticalAlignMiddleOutlined
          className={cls(styles.flexItemColumn, styles.icon)}
          onClick={() => {
            expandedIds.clear();
            this.forceUpdate();
          }}
        />
        <SortAscendingOutlined
          className={cls(styles.flexItemColumn, styles.icon)}
        />
        <SortDescendingOutlined
          className={cls(styles.flexItemColumn, styles.icon, styles.iconDisable)}
        />
        <SearchOutlined
          className={cls(styles.flexItemColumn, styles.icon)}
        />
        <ReloadOutlined
          className={cls(styles.flexItemColumn, styles.icon)}
          style={{ fontSize: 14, padding: 3 }}
          onClick={() => this.reLoadTreeData()}
        />
        <MinusOutlined
          className={cls(styles.flexItemColumn, styles.icon)}
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
          icon={<FileAddOutlined className={cls(styles.menuIcon)}/>}
          text="新增文件"
          onClick={() => {
          }}
        />
        <MenuItem
          icon={<FolderAddOutlined className={cls(styles.menuIcon)}/>}
          text="新增文件夹"
          onClick={() => {
          }}
        />
        <MenuDivider/>
        <MenuItem
          icon={<CopyOutlined className={cls(styles.menuIcon)}/>}
          text="复制名称"
          disabled={!contextMenuSelectNode || !contextMenuSelectNode.nodeData}
          onClick={() => {
            const nodeData = contextMenuSelectNode?.nodeData;
            if (nodeData) copyToClipboard(nodeData.name);
          }}
        />
        <MenuItem
          icon={<CopyOutlined className={cls(styles.menuIcon)}/>}
          text="复制文件路径"
          disabled={!contextMenuSelectNode || !contextMenuSelectNode.nodeData}
          onClick={() => {
            const nodeData = contextMenuSelectNode?.nodeData;
            if (nodeData) copyToClipboard(nodeData.path + nodeData.name);
          }}
        />
        <MenuItem
          icon={<CopyOutlined className={cls(styles.menuIcon)}/>}
          text="复制接口路径"
          disabled={!contextMenuSelectNode || !contextMenuSelectNode.nodeData || !contextMenuSelectNode.nodeData.requestMapping}
          onClick={() => {
            const nodeData = contextMenuSelectNode?.nodeData;
            if (nodeData && nodeData.requestMapping) copyToClipboard(nodeData.requestMapping!);
          }}
        />
        <MenuDivider/>
        <MenuItem
          icon={<DeleteOutlined className={cls(styles.menuIcon)}/>}
          text="删除"
          disabled={!contextMenuSelectNode}
          onClick={() => {
          }}
        />
        <MenuItem
          icon={<EditOutlined className={cls(styles.menuIcon)}/>}
          text="重命名"
          disabled={!contextMenuSelectNode}
          onClick={() => {
          }}
        />
        <MenuDivider/>
        <MenuItem
          icon={<ColumnHeightOutlined className={cls(styles.menuIcon)}/>}
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
          icon={<ReloadOutlined className={cls(styles.menuIcon)}/>}
          text="刷新"
          onClick={() => this.reLoadTreeData()}
        />
      </Menu>
    );
  }

  render() {
    const { loading, treeData, expandedIds } = this.state;
    this.fillTreeState(treeData);
    return (
      <div className={cls(Classes.DARK, styles.panel)}>
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
                this.setState({ selectedId: node.id });
              }}
              onNodeCollapse={node => {
                if (node.childNodes && node.childNodes.length <= 0) return;
                forEachTreeNode(node, n => expandedIds.delete(n.id));
                this.setState({ selectedId: node.id });
              }}
              onNodeDoubleClick={node => {
                if (node.isExpanded) {
                  forEachTreeNode(node, n => expandedIds.delete(n.id));
                } else {
                  expandedIds.add(node.id);
                }
                if (node.nodeData?.isFile === 0) {
                  // TODO 打开文件
                }
                this.setState({ selectedId: node.id });
              }}
              onNodeClick={node => this.setState({ selectedId: node.id })}
              onNodeContextMenu={node => this.setState({ selectedId: node.id, contextMenuSelectNode: node })}
            />
          </SimpleBar>
        </ContextMenu2>
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
    node.childNodes.forEach(callBack);
  }
};

export type { HttpApiResourcePaneProps, HttpApiResourcePaneState };
export { HttpApiResourcePane };
