import React from "react";
import cls from "classnames";
import lodash from "lodash";
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
import { noValue } from "@/utils/utils";
import { request } from "@/utils/request";
import { componentStateKey, fastApiStore } from "@/utils/storage";
import { Folder, getFileIcon } from "@/utils/IdeaIconUtils";
import styles from "./HttpApiResourcePane.module.less";

const getDataApi = FastApi.HttpApiManage.getHttpApiTree;

interface HttpApiResourcePaneProps {
  /** 当前打开的文件ID */
  openFileId?: string;
  /** 选择节点变化事件 */
  onSelectChange?: (node: TreeNodeInfo<ApiFileResourceRes>) => void;
  /** 打开文件事件 */
  onOpenFile?: (apiFileResource: ApiFileResourceRes) => void;
  /** 当前组件点击最小化事件 */
  onHidePanel?: () => void;
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
  /** 节点名称排序规则 */
  nodeNameSort: "ASC" | "DESC";
}

// 读取组件状态
const storageState: Partial<HttpApiResourcePaneState> = await fastApiStore.getItem(componentStateKey.HttpApiResourcePaneState) ?? {};
// 组件状态默认值
const defaultState: HttpApiResourcePaneState = {
  loading: true,
  treeData: [],
  expandedIds: new Set(),
  selectedId: "",
  nodeNameSort: "ASC",
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
          const { onSelectChange } = this.props;
          if (onSelectChange) {
            const { selectedId } = this.state;
            let selectNode: TreeNodeInfo<ApiFileResourceRes> | undefined;
            (treeData as Array<TreeNodeInfo<ApiFileResourceRes>>).forEach(node => forEachTreeNode(node, n => {
              if (n.nodeData?.fileResourceId === selectedId) selectNode = n;
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
    fastApiStore.setItem(
      componentStateKey.HttpApiResourcePaneState,
      { expandedIds, selectedId, nodeNameSort },
    ).finally();
  }

  private fillTreeState(treeData: Array<TreeNodeInfo<ApiFileResourceRes>>): Array<TreeNodeInfo<ApiFileResourceRes>> {
    const { expandedIds, selectedId, nodeNameSort } = this.state;
    const fillTreeNodeState = (node: TreeNodeInfo<ApiFileResourceRes>) => {
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
        <select className={cls(styles.flexItemColumn, styles.viewSelect)}>
          <option value="fileView">文件视图</option>
          <option value="apiView">接口视图</option>
        </select>
        <div className={cls(styles.flexItemColumnWidthFull)}/>
        <AimOutlined
          className={cls(styles.flexItemColumn, styles.icon, { [styles.iconDisable]: noValue(openFileId) })}
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
        <SearchOutlined
          className={cls(styles.flexItemColumn, styles.icon, styles.iconDisable)}
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
        <ReloadOutlined
          className={cls(styles.flexItemColumn, styles.icon)}
          style={{ fontSize: 14, padding: 5 }}
          onClick={() => this.reLoadTreeData()}
        />
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
    const { openFileId, onSelectChange, onOpenFile } = this.props;
    const { loading, expandedIds, selectedId } = this.state;
    let { treeData, } = this.state;
    treeData = this.fillTreeState(treeData);
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
                if (node.nodeData?.isFile === 1 && onOpenFile && openFileId !== node.nodeData?.fileResourceId) {
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
