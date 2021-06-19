import React from "react";
import cls from "classnames";
import SplitPane from "react-split-pane";
import styles from "./Workbench.module.less";

interface WorkbenchProps {
}

interface WorkbenchState {
}

class Workbench extends React.Component<WorkbenchProps, WorkbenchState> {

  private getLayout() {
    return (
      <div className={styles.flexRow}>
        {/*顶部菜单栏*/}
        <div className={cls(styles.flexItemRow, styles.topMenu)}>
        </div>
        {/*顶部工具栏*/}
        <div className={cls(styles.flexItemRow, styles.topStatus)}>
        </div>
        {/*外层中间区域*/}
        <div className={cls(styles.flexItemRowHeightFull, styles.flexColumn)}>
          {/*左边多叶签栏*/}
          <div className={cls(styles.flexItemColumn, styles.leftTabs)}>
          </div>
          {/*内层中间区域(上-下)*/}
          <SplitPane
            className={styles.topBottomSplit}
            split="horizontal"
            primary="second"
            defaultSize={256}
            minSize={64}
            resizerClassName={styles.topBottomSplitResizerStyle}
          >
            {/*(左-中)*/}
            <SplitPane
              split="vertical"
              primary="first"
              defaultSize={256}
              minSize={64}
              resizerClassName={styles.leftRightSplitResizerStyle}
            >
              {/*编辑器左侧区域*/}
              <div className={cls(styles.leftResources)}>
              </div>
              {/*(中-右)*/}
              <SplitPane
                split="vertical"
                primary="second"
                defaultSize={256}
                minSize={64}
                resizerClassName={styles.leftRightSplitResizerStyle}
              >
                {/*编辑器区域*/}
                <div>
                </div>
                {/*编辑器右侧区域*/}
                <div>
                </div>
              </SplitPane>
            </SplitPane>
            {/*编辑器底部区域*/}
            <div>
            </div>
          </SplitPane>
          {/*右边多叶签栏*/}
          <div className={cls(styles.flexItemColumn, styles.rightTabs)}>
          </div>
        </div>
        {/*底部多叶签栏*/}
        <div className={cls(styles.flexItemRow, styles.bottomTabs)}>
        </div>
        {/*底部状态栏*/}
        <div className={cls(styles.flexItemRow, styles.bottomStatus)}>
        </div>
      </div>
    );
  }

  public render() {
    return this.getLayout();
  }
}

export default Workbench;
