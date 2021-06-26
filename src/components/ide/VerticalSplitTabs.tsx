import React from "react";
import { hasValue } from "@/utils/utils";
import cls from "classnames";
import styles from "@/pages/Workbench.module.less";
import Icon, { CloseOutlined, MinusOutlined } from "@ant-design/icons";
import { ChevronDown, ChevronUp } from "@/utils/IdeaIconUtils";
import { BottomPanelEnum } from "@/types/workbench-layout";

interface VerticalSplitTabsProps {
  /** 底部容器显示的叶签 */
  bottomPanel?: BottomPanelEnum;
  /** 上下容器Size */
  vSplitSize: [number, number];
  /** 上下容器收缩Size */
  vSplitCollapsedSize: [number, number];
}

interface VerticalSplitTabsState {
}

class VerticalSplitTabs extends React.Component<VerticalSplitTabsProps, VerticalSplitTabsState> {
  render() {
    const { bottomPanel, vSplitSize, vSplitCollapsedSize } = this.props;
    const sizes = hasValue(bottomPanel) ? vSplitSize : vSplitCollapsedSize;
    const topSize = sizes[0];
    return (
      <>
        <div className={cls(styles.flexItemColumn, styles.verticalSplitTabsLabel)}>接口配置:</div>
        <div className={cls(styles.flexItemColumn, styles.verticalSplitTabsItem, styles.verticalSplitTabsItemActive)} onMouseDown={e => e.stopPropagation()}>
          <span className={cls(styles.verticalSplitTabsItemLabel)}>叶签1</span>
          <CloseOutlined className={cls(styles.verticalSplitTabsItemClose)}/>
        </div>
        <div className={cls(styles.flexItemColumn, styles.verticalSplitTabsItem)} onMouseDown={e => e.stopPropagation()}>
          <span className={cls(styles.verticalSplitTabsItemLabel)}>叶签2</span>
          <CloseOutlined className={cls(styles.verticalSplitTabsItemClose)}/>
        </div>
        <div className={cls(styles.flexItemColumn, styles.verticalSplitTabsItem)} onMouseDown={e => e.stopPropagation()}>
          <span className={cls(styles.verticalSplitTabsItemLabel)}>叶签3</span>
          <CloseOutlined className={cls(styles.verticalSplitTabsItemClose)}/>
        </div>
        <div className={cls(styles.flexItemColumnWidthFull)}/>
        {
          topSize > 20 &&
          <Icon
            component={ChevronUp}
            className={cls(styles.flexItemColumn, styles.icon, styles.bottomTabsIcon)}
            onMouseDown={e => e.stopPropagation()}
            onClick={() => {
              sizes[0] = 8;
              sizes[1] = 92;
              this.forceUpdate();
            }}
          />
        }
        {
          topSize <= 20 &&
          <Icon
            component={ChevronDown}
            className={cls(styles.flexItemColumn, styles.icon, styles.bottomTabsIcon)}
            onMouseDown={e => e.stopPropagation()}
            onClick={() => {
              sizes[0] = 92;
              sizes[1] = 8;
              this.forceUpdate();
            }}
          />
        }
        <MinusOutlined
          className={cls(styles.flexItemColumn, styles.icon, styles.bottomTabsIcon)}
          onMouseDown={e => e.stopPropagation()}
          // onClick={() => this.toggleBottomPanel()}
        />
        <div className={cls(styles.flexItemColumn)} style={{ width: 2 }}/>
      </>
    );
  }
}

export default VerticalSplitTabs;
