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
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <ReflexContainer orientation="horizontal">
          <ReflexElement style={{ backgroundColor: "#222" }} direction={[-1, 1]}>
            <ReflexContainer orientation="vertical">
              <ReflexElement style={{ backgroundColor: "#333" }}>
                <button onClick={() => this.setState({ show: true })}>折叠</button>
              </ReflexElement>
              <ReflexSplitter propagate={false}/>
              <ReflexElement style={{ backgroundColor: "#444" }}>
                222
              </ReflexElement>
              <ReflexSplitter propagate={false}/>
              <ReflexElement style={{ backgroundColor: "#555" }}>
                333
              </ReflexElement>
            </ReflexContainer>
          </ReflexElement>
          <ReflexSplitter propagate={false} style={{ height: 30, display: show ? "unset" : "none", backgroundColor: "#777" }}>
            <button onClick={() => this.setState({ show: !show })}>折叠</button>
          </ReflexSplitter>
          <ReflexElement
            style={{ backgroundColor: "#bbb" }}
            size={show ? size : 0}
            // minSize={show ? 64 : 0}
            direction={-1}
            onStopResize={e => this.setState({ size: (e.domElement as any)?.offsetHeight })}
          >
          </ReflexElement>
        </ReflexContainer>

        <div style={{ height: 64, flexShrink: 0, flexGrow: 0, display: "flex", flexDirection: "row" }}>

        </div>
      </div>
    )
  }
}

export default ReflexAdvancedDemo;
