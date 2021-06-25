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
import { Folder, getFileIcon } from "@/utils/IdeaIconUtils";
import styles from "./HttpApiResourcePane.module.less";

const getDataApi = FastApi.HttpApiManage.getHttpApiTree;

interface HttpApiResourcePaneProps {
//  onSelectChange
//  onOpenFile
//
}

interface HttpApiResourcePaneState {
  loading: boolean;
  treeData: Array<TreeNodeInfo<ApiFileResourceRes>>;
}

class HttpApiResourcePane extends React.Component<HttpApiResourcePaneProps, HttpApiResourcePaneState> {
  static defaultState: HttpApiResourcePaneState = {
    loading: true,
    treeData: [],
  }

  constructor(props: HttpApiResourcePaneProps) {
    super(props);
    this.state = { ...HttpApiResourcePane.defaultState };
  }

  public componentDidMount() {
    this.reLoadTreeData();
  }

  public reLoadTreeData() {
    request.get(getDataApi)
      .then(treeData => {
        treeData = getTreeData(treeData);
        this.setState({ treeData });
      })
      .finally(() => this.setState({ loading: false }));
  }

  render() {
    const { loading, treeData } = this.state;
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
              node.isExpanded = true;
              setSingleSelected(treeData, node.id, true);
              this.forceUpdate();
            }}
            onNodeCollapse={node => {
              if (node.childNodes && node.childNodes.length <= 0) return;
              collapseAllChildNodes(node);
              setSingleSelected(treeData, node.id, true);
              this.forceUpdate();
            }}
            onNodeDoubleClick={node => {
              node.isExpanded = !node.isExpanded;
              if (node.nodeData?.isFile === 0) {
                // TODO 打开文件
              }
              this.forceUpdate();
            }}
            onNodeClick={node => {
              setSingleSelected(treeData, node.id, true);
              this.forceUpdate();
            }}
            // onNodeContextMenu
          />
        </SimpleBar>
      </div>
    );
  }
}

const collapseAllChildNodes = (rootNode: TreeNodeInfo<ApiFileResourceRes>): void => {
  rootNode.isExpanded = false;
  if (rootNode.childNodes && rootNode.childNodes.length > 0) {
    rootNode.childNodes.forEach(childNode => collapseAllChildNodes(childNode));
  }
}

const setSingleSelected = (tree: Array<TreeNodeInfo<ApiFileResourceRes>>, id: any, isSelected: boolean): void => {
  const setSelected = (node: TreeNodeInfo<ApiFileResourceRes>) => {
    if (node.id === id) {
      node.isSelected = isSelected;
    } else {
      node.isSelected = !isSelected;
    }
    if (node.childNodes && node.childNodes.length > 0) {
      node.childNodes.forEach(childNode => setSelected(childNode));
    }
  }
  tree.forEach(node => setSelected(node));
}

const getTreeData = (rawData: Array<SimpleTreeNode<ApiFileResourceRes>>): Array<TreeNodeInfo<ApiFileResourceRes>> => {
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
      isExpanded: false, // TODO 保存状态
      isSelected: false, // TODO 保存状态
    };
    if (!isFile && rawNode.children && rawNode.children.length > 0) {
      node.childNodes = [];
      rawNode.children.forEach(childRawNode => {
        node.childNodes?.push(transformNode(childRawNode));
      });
    }
    return node;
  };
  rawData.forEach(rawNode => treeData.push(transformNode(rawNode)));
  return treeData;
};

export type { HttpApiResourcePaneProps, HttpApiResourcePaneState };
export { HttpApiResourcePane };
