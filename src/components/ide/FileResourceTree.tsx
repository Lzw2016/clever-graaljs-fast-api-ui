import React from "react";
import cls from "classnames";
import { Classes, Tree } from "@blueprintjs/core";
import "./FileResourceTree.module.less";

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
      <>
        <Tree
          contents={[
            {
              id: "01", label: "test01", childNodes: [
                { id: "0101", label: "test0101" },
                { id: "0102", label: "test0102" },
              ],
            },
            {
              id: "02", label: "test02", childNodes: [
                { id: "0201", label: "test0201" },
                { id: "0202", label: "test0202" },
              ],
            },
          ]}
          className={cls(Classes.DARK)}
        />
      </>
    );
  }
}

export type { FileResourceTreeProps, FileResourceTreeState };
export { FileResourceTree };
