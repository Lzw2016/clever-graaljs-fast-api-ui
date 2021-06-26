import React from "react";
import cls from "classnames";
import Icon, {
  AimOutlined,
  ColumnHeightOutlined,
  MinusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  VerticalAlignMiddleOutlined
} from "@ant-design/icons";
import SimpleBar from "simplebar-react";
import { Classes, Intent, Spinner, SpinnerSize, Tree, TreeNodeInfo } from "@blueprintjs/core";
import { FastApi } from "@/apis";
import { request } from "@/utils/request";
import { componentStateKey, fastApiStore } from "@/utils/storage";
import { Folder, getFileIcon } from "@/utils/IdeaIconUtils";
import styles from "./HttpApiResourcePane.module.less";

const getDataApi = FastApi.HttpApiManage.getHttpApiTree;


interface HttpApiResourcePaneProps {
//  onSelectChange
//  onOpenFile
//
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
    request.get(getDataApi)
      .then(treeData => {
        treeData = transformTreeData(treeData);
        this.setState({ treeData });
      })
      .finally(() => this.setState({ loading: false }));
  }

  /** 保存组件状态 */
  public saveState(): void {
    const { loading, treeData, expandedIds, ...other } = this.state;
    treeData.forEach(node => forEachTreeNode(node, n => {
      if (!expandedIds.has(n.id)) expandedIds.delete(n.id);
    }));
    fastApiStore.setItem(
      componentStateKey.HttpApiResourcePaneState,
      { expandedIds, ...other },
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

  render() {
    const { loading, treeData, expandedIds } = this.state;
    this.fillTreeState(treeData);
    return (
      <div className={cls(Classes.DARK, styles.pane)}>
        <div className={cls(styles.flexColumn, styles.head)}>
          <select className={cls(styles.flexItemColumn, styles.viewSelect)}>
            <option value="fileView">文件视图</option>
            <option value="apiView">接口视图</option>
          </select>
          <div className={cls(styles.flexItemColumnWidthFull)}/>
          <AimOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
          <ColumnHeightOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
          <VerticalAlignMiddleOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
          <SortAscendingOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
          <SortDescendingOutlined className={cls(styles.flexItemColumn, styles.icon, styles.iconDisable)}/>
          <SearchOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
          <ReloadOutlined
            className={cls(styles.flexItemColumn, styles.icon)}
            style={{ fontSize: 14, padding: 3 }}
            onClick={() => this.reLoadTreeData()}
          />
          <MinusOutlined className={cls(styles.flexItemColumn, styles.icon)}/>
          <div className={cls(styles.flexItemColumn)} style={{ marginRight: 2 }}/>
        </div>
        {loading && <Spinner className={cls(styles.loading)} intent={Intent.PRIMARY} size={SpinnerSize.SMALL}/>}
        <SimpleBar
          className={cls(styles.center, { [styles.hide]: loading })}
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
            onNodeClick={node => {
              this.setState({ selectedId: node.id });
              this.forceUpdate();
            }}
            // onNodeContextMenu
          />
        </SimpleBar>
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
