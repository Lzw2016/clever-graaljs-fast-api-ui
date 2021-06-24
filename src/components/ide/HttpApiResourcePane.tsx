import React from "react";
import cls from "classnames";
import SimpleBar from 'simplebar-react';
import { Classes, Intent, Spinner, SpinnerSize, Tree } from "@blueprintjs/core";
import { FastApi } from "@/apis";
import { request } from "@/utils/request";
import styles from "./HttpApiResourcePane.module.less";
import { TreeNodeInfo } from "@blueprintjs/core/src/components/tree/treeNode";

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
          <div className={cls(styles.flexItemColumn)}>111</div>
          <div className={cls(styles.flexItemColumnWidthFull)}/>
          <div className={cls(styles.flexItemColumn)}>222</div>
          <div className={cls(styles.flexItemColumn)}>333</div>
        </div>
        {loading && <Spinner className={cls(styles.flexItemRowHeightFull)} intent={Intent.PRIMARY} size={SpinnerSize.SMALL}/>}
        <SimpleBar
          className={cls(styles.center, { [styles.hide]: loading })}
          autoHide={false}
          scrollbarMinSize={48}
        >
          <Tree
            // className={cls( styles.center, { [styles.hide]: loading })}
            contents={treeData}
            onNodeExpand={node => {
              node.isExpanded = true;
              this.forceUpdate();
            }}
            onNodeCollapse={node => {
              node.isExpanded = false;
              this.forceUpdate();
            }}
            // onNodeDoubleClick
            // onNodeClick
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
      icon: isFile ? "document" : "folder-close",
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
