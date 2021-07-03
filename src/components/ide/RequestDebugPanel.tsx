import React from "react";
import cls from "classnames";
import Split from "react-split";
import { Tab, Tabs } from "@blueprintjs/core";
import { componentStateKey, fastApiStore } from "@/utils/storage";
import styles from "./RequestDebugPanel.module.less";
import lodash from "lodash";

enum HttpRequestResponseEnum {
  Params = "Params",
  Headers = "Headers",
  Cookies = "Cookies",
  JsonBody = "JsonBody",
  FormBody = "FormBody",
}

interface RequestDebugPanelProps {
}

interface RequestDebugPanelState {
  /** 左中右容器Size */
  hSplitSize: [number, number, number];
}

// 读取组件状态
const storageState: Partial<RequestDebugPanelState> = await fastApiStore.getItem(componentStateKey.RequestDebugPanelState) ?? {};
// 组件状态默认值
const defaultState: RequestDebugPanelState = {
  hSplitSize: [15, 40, 45],
  ...storageState,
}

class RequestDebugPanel extends React.Component<RequestDebugPanelProps, RequestDebugPanelState> {
  /** 执行组件状态的全局锁 */
  private saveStateLock: boolean = false;
  /** 保存组件的状态 */
  private saveComponentState = lodash.debounce(() => this.saveState().finally(), 1_000, { maxWait: 3_000 });

  constructor(props: RequestDebugPanelProps) {
    super(props);
    this.state = { ...defaultState };
  }

  // 组件挂载后
  public componentDidMount() {
  }

  // 组件将要被卸载
  public componentWillUnmount() {
    this.saveState().finally();
  }

  /** 保存组件状态 */
  public async saveState(): Promise<void> {
    if (this.saveStateLock) return;
    const { hSplitSize } = this.state;
    await fastApiStore.setItem(
      componentStateKey.RequestDebugPanelState,
      { hSplitSize },
    ).finally(() => {
      this.saveStateLock = false;
    });
  }

  private getParamsPanel() {

  }

  render() {
    this.saveComponentState();
    const { hSplitSize } = this.state;
    return (
      <Split
        className={cls(styles.panel, styles.horizontalSplit)}
        direction={"horizontal"}
        sizes={hSplitSize}
        minSize={[128, 256, 256]}
        maxSize={[450, Infinity, Infinity]}
        snapOffset={20}
        dragInterval={1}
        gutterSize={0}
        cursor={"ew-resize"}
        elementStyle={(_, elementSize) => {
          return { width: `${elementSize}%` };
        }}
        onDragEnd={sizes => this.setState({ hSplitSize: sizes as any })}
        gutter={_ => {
          const element = document.createElement("div");
          element.className = cls(styles.horizontalSplitGutter, "gutter gutter-horizontal");
          return element;
        }}
      >
        <div className={cls(styles.leftPanel)}>左</div>
        <div className={cls(styles.centerPanel)}>
          <Tabs
            animate={false}
            renderActiveTabPanelOnly={false}
            vertical={false}
          >
            <Tab
              id={HttpRequestResponseEnum.Params}
              title="Params"
              panel={
                <>
                  111
                </>
              }
            />
            <Tab
              id={HttpRequestResponseEnum.Headers}
              title="Headers"
              panel={
                <>
                  222
                </>
              }
            />
            <Tab
              id={HttpRequestResponseEnum.JsonBody}
              title="JsonBody"
              panel={
                <>
                  333
                </>
              }
            />
            {/*<Tabs.Expander/>*/}
            {/*<InputGroup className={Classes.FILL} type="text" placeholder="Search..."/>*/}
          </Tabs>
        </div>
        <div className={cls(styles.rightPanel)}>右</div>
      </Split>
    );
  }
}

export type { RequestDebugPanelProps, RequestDebugPanelState };
export { RequestDebugPanel } ;
