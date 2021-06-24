import React from "react";
import cls from "classnames";
import Icon, { AimOutlined, MinusOutlined } from "@ant-design/icons";
import SimpleBar from "simplebar-react";
import { Classes, Intent, Spinner, SpinnerSize, Tree, TreeNodeInfo } from "@blueprintjs/core";
import { FastApi } from "@/apis";
import { request } from "@/utils/request";
import { Folder, getFileIcon } from "@/utils/IdeaIconUtils";
import styles from "./HttpApiResourcePane.module.less";

const getDataApi = FastApi.HttpApiManage.getHttpApiTree;

interface HttpApiResourcePaneProps {
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
              this.forceUpdate();
            }}
            onNodeCollapse={node => {
              if (node.childNodes && node.childNodes.length <= 0) return;
              node.isExpanded = false;
              this.forceUpdate();
            }}
            onNodeDoubleClick={node => {
              node.isExpanded = !node.isExpanded;
              this.forceUpdate();
            }}
            onNodeClick={node => {
              node.isSelected = true;
              if (node.nodeData?.isFile === 0) {
                // TODO 打开文件
              }
              this.forceUpdate();
            }}
            // onNodeContextMenu
          />
        </SimpleBar>
      </div>
    );
  }
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
    if (!isFile && rawNode.children?.length > 0) {
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
