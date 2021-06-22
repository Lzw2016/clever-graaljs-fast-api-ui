import React from "react";
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";
import "react-reflex/styles.css";

interface ReflexAdvancedDemoProps {
}

interface ReflexAdvancedDemoState {
  size: number;
  show: boolean;
}

class ReflexAdvancedDemo extends React.Component<ReflexAdvancedDemoProps, ReflexAdvancedDemoState> {

  constructor(props: Readonly<ReflexAdvancedDemoProps>) {
    super(props);
    this.state = { size: 200, show: true };
  }

  render() {
    console.log("state -> ", JSON.stringify(this.state))
    const { size, show } = this.state;
    return (
      <ReflexContainer orientation="horizontal">
        <ReflexElement style={{ backgroundColor: "#222" }} direction={[-1, 1]}>
          <button onClick={() => this.setState({ show: true })}>折叠</button>
        </ReflexElement>
        <ReflexSplitter style={{ height: 30, display: show ? "unset" : "none", backgroundColor: "#777" }}>
          <button onClick={() => this.setState({ show: !show })}>折叠</button>
        </ReflexSplitter>
        <ReflexElement
          style={{ backgroundColor: "#bbb" }}
          size={show ? size : 0}
          direction={-1}
          onStopResize={e => this.setState({ size: (e.domElement as any)?.offsetHeight })}
        >
        </ReflexElement>
      </ReflexContainer>
    )
  }
}

export default ReflexAdvancedDemo;
