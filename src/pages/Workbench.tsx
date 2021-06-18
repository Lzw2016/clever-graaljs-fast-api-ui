import React from "react";
import classnames from "classnames";
import SplitPane from "react-split-pane";
import styles from "./Workbench.module.css";

interface WorkbenchProps {

}

interface WorkbenchState {
}

class Workbench extends React.Component<WorkbenchProps, WorkbenchState> {


  private getLayout() {
    return (
      <div className={styles.flexRow}>
        <div className={classnames(styles.flexItemRow, styles.topMenu)}>
        </div>
        <div className={classnames(styles.flexItemRow, styles.topStatus)}>
        </div>

        <div className={classnames(styles.flexItemRowHeightFull, styles.flexColumn)}>
          <div className={classnames(styles.flexItemColumn, styles.leftTabs)}>
          </div>

          <SplitPane
            className={styles.editorConsoleSplit}
            split="horizontal"
            defaultSize={200}
            primary="second"
            resizerClassName={styles.editorConsoleSplitResizerStyle}
          >
            <SplitPane
              split="vertical"
              defaultSize={200}
              primary="first"
              resizerClassName={styles.resourcesEditorSplitResizerStyle}
            >
              <div>

              </div>
              <div>

              </div>
            </SplitPane>
            <div>
            </div>
          </SplitPane>

          <div className={classnames(styles.flexItemColumn, styles.rightTabs)}>
          </div>
        </div>

        <div className={classnames(styles.flexItemRow, styles.bottomTabs)}>
        </div>
        <div className={classnames(styles.flexItemRow, styles.bottomStatus)}>
        </div>
      </div>
    );
  }

  public render() {
    return this.getLayout();
  }
}

export default Workbench;
