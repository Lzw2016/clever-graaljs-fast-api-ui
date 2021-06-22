import React from "react";
import { Tree } from "antd";
import "./FileResourceTree.css";

interface FileResourceTreeProps {
}

interface FileResourceTreeState {
}

const treeData = [
  {
    title: 'parent 0',
    key: '0-0',
    children: [
      { title: 'leaf 0-0', key: '0-0-0', isLeaf: true },
      { title: 'leaf 0-1', key: '0-0-1', isLeaf: true },
    ],
  },
  {
    title: 'parent 1',
    key: '0-1',
    children: [
      { title: 'leaf 1-0', key: '0-1-0', isLeaf: true },
      { title: 'leaf 1-1', key: '0-1-1', isLeaf: true },
    ],
  },
];

class FileResourceTree extends React.Component<FileResourceTreeProps, FileResourceTreeState> {
  render() {
    return (
      <div>
        <Tree.DirectoryTree
          expandAction={"doubleClick"}
          defaultExpandAll
          // expandedKeys
          // filterTreeNode
          // icon
          // onDragEnd
          // onSelect={onSelect}
          // onExpand={onExpand}
          treeData={treeData}
        />
      </div>
    );
  }
}

export type { FileResourceTreeProps, FileResourceTreeState };
export { FileResourceTree };
