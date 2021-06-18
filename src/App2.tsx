import React from "react";
import SplitPane from "react-split-pane";

interface AppProps {

}

interface AppState {
}

class App extends React.Component<AppProps, AppState> {
  render() {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
        }}
      >
        <div
          style={{
            width: "100%",
            height: 24,
            flexGrow: 0,
            flexShrink: 0,
            boxSizing: "border-box",
            borderTop: "1px solid #3C3F41",
          }}
        >
        </div>

        <div
          style={{
            width: "100%",
            height: 24,
            flexGrow: 0,
            flexShrink: 0,
            boxSizing: "border-box",
            borderTop: "1px solid #3C3F41",
          }}
        >
        </div>

        <div
          style={{
            flexGrow: 1,
            flexShrink: 1,
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            // boxSizing: "border-box",
            // border: "1px solid #3C3F41",
          }}
        >
          <div
            style={{
              width: 24,
              height: "100%",
              flexGrow: 0,
              flexShrink: 0,
              boxSizing: "border-box",
              borderTop: "1px solid #3C3F41",
              borderBottom: "1px solid #3C3F41",
            }}
          >
          </div>
          <SplitPane
            style={{
              height: "unset",
              minHeight: "unset",
              position: "unset",
              boxSizing: "border-box",
              border: "1px solid #3C3F41",
            }}
            split="horizontal"
            defaultSize={200}
            primary="second"
            resizerStyle={{
              height: 5,
              margin: "-2px 0",
              background: "#3C3F41",
              boxSizing: "border-box",
              backgroundClip: "padding-box",
              borderTop: "2px solid rgba(255,255,255,0)",
              borderBottom: "2px solid rgba(255,255,255,0)",
              cursor: "ns-resize",
              zIndex: 999,
            }}
          >
            <SplitPane
              split="vertical"
              defaultSize={200}
              primary="first"
              resizerStyle={{
                width: 5,
                margin: "0 -2px",
                background: "#3C3F41",
                boxSizing: "border-box",
                backgroundClip: "padding-box",
                borderLeft: "2px solid rgba(255,255,255,0)",
                borderRight: "2px solid rgba(255,255,255,0)",
                cursor: "ew-resize",
                zIndex: 999,
              }}
            >
              <div>

              </div>
              <div>

              </div>
            </SplitPane>
            <div>

            </div>
          </SplitPane>
          <div
            style={{
              width: 24,
              height: "100%",
              flexGrow: 0,
              flexShrink: 0,
              boxSizing: "border-box",
              borderTop: "1px solid #3C3F41",
              borderBottom: "1px solid #3C3F41",
            }}
          >
          </div>
        </div>
        <div
          style={{
            width: "100%",
            height: 24,
            flexGrow: 0,
            flexShrink: 0,
            boxSizing: "border-box",
            borderBottom: "1px solid #3C3F41",
          }}
        >

        </div>
        <div
          style={{
            width: "100%",
            height: 24,
            flexGrow: 0,
            flexShrink: 0,
            boxSizing: "border-box",
            borderBottom: "1px solid #3C3F41",
          }}
        >

        </div>
      </div>
    );
  }
}

export default App
