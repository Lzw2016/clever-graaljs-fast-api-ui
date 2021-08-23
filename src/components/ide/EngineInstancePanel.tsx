import React from "react";
import cls from "classnames";
import { request } from "@/utils/request";
import { FastApi } from "@/apis";
import styles from "./EngineInstancePanel.module.less";

interface EngineInstancePanelProps {
  /** 自定义样式 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

interface EngineInstancePanelState {
  /** 引擎实例状态 */
  engineInstanceStatus?: ScriptEngineInstanceStatus;
}

class EngineInstancePanel extends React.Component<EngineInstancePanelProps, EngineInstancePanelState> {
  /** 组件挂载状态 */
  private mounted: boolean = false;
  /** 获取引擎状态定时任务 */
  private getEngineInstanceStatusTask: NodeJS.Timeout | undefined;

  constructor(props: Readonly<EngineInstancePanelProps>) {
    super(props);
    this.state = {};
  }

  // 组件挂载后
  public componentDidMount() {
    this.mounted = true;
    // 定时获取引擎状态
    this.getEngineInstanceStatusTask = setInterval(() => {
      request.get(FastApi.Global.getStatus)
        .then((status: ScriptEngineInstanceStatus) => {
          if (this.mounted) this.setState({ engineInstanceStatus: status });
        }).catch(() => this.setState({ engineInstanceStatus: undefined })).finally();
    }, 3000)
  }

  // 组件将要被卸载
  public componentWillUnmount() {
    this.mounted = false;
    if (this.getEngineInstanceStatusTask) clearInterval(this.getEngineInstanceStatusTask);
  }

  render() {
    const { className, style } = this.props;
    const { engineInstanceStatus } = this.state;
    if (!engineInstanceStatus) return <div className={cls(className)} style={style}/>;
    return (
      <div className={cls(className, styles.engineInstanceStatus)} style={style}>
        <div
          className={cls(styles.engineInstanceStatusPercentage)}
          style={{ width: `${engineInstanceStatus.numActive * 100 / engineInstanceStatus.maxTotal}%` }}
        />
        <div className={cls(styles.engineInstanceStatusText)}>
          引擎状态: {engineInstanceStatus.numActive} / {engineInstanceStatus.maxTotal}
        </div>
      </div>
    );
  }
}

export type { EngineInstancePanelProps, EngineInstancePanelState };
export { EngineInstancePanel };
