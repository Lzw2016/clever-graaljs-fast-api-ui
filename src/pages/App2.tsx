import React from "react";
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";
import "react-reflex/styles.css";

interface ReflexAdvancedDemoProps {
}

interface ReflexAdvancedDemoState {
}

class ReflexAdvancedDemo extends React.Component<ReflexAdvancedDemoProps, ReflexAdvancedDemoState> {

  constructor(props: Readonly<ReflexAdvancedDemoProps>) {
    super(props);
  }

  resizeProps = {
    onStopResize: this.onStopResize.bind(this),
    onResize: this.onResize.bind(this)
  }

  onResize(e: any) {
    if (e.domElement) {
      e.domElement.classList.add('resizing')
    }
  }

  onStopResize(e: any) {
    if (e.domElement) {
      e.domElement.classList.remove('resizing')
    }
  }

  render() {
    return (
      <ReflexContainer orientation="horizontal">
        <ReflexElement className="header" flex={0.1}>
          <div className="pane-content">
            <label>
              Header (fixed)
            </label>
          </div>
        </ReflexElement>
        <ReflexElement>
          <ReflexContainer orientation="vertical">
            <ReflexElement {...this.resizeProps}>
              <ReflexContainer orientation="horizontal">
                <ReflexElement {...this.resizeProps}>
                  <div className="pane-content">
                    <div style={{ height: '30%' }}/>
                    <label style={{ height: '0%' }}>
                      Left Pane <br/> Top
                      <br/>
                      (splitter propagation)
                    </label>
                  </div>
                </ReflexElement>
                <ReflexSplitter propagate={true} {...this.resizeProps}/>
                <ReflexElement {...this.resizeProps}>
                  <div className="pane-content">
                    <div style={{ height: '30%' }}/>
                    <label style={{ height: '0%' }}>
                      Left Pane <br/> Middle
                      <br/>
                      (splitter propagation)
                    </label>
                  </div>
                </ReflexElement>
                <ReflexSplitter propagate={true} {...this.resizeProps}/>
                <ReflexElement {...this.resizeProps}>
                  <div className="pane-content">
                    <div style={{ height: '30%' }}/>
                    <label style={{ height: '0%' }}>
                      Left Pane <br/> Bottom
                      <br/>
                      (splitter propagation)
                    </label>
                  </div>
                </ReflexElement>
              </ReflexContainer>
            </ReflexElement>
            <ReflexSplitter {...this.resizeProps}/>
            <ReflexElement flex={0.5} {...this.resizeProps}>
              <div className="pane-content">
                <label>
                  Middle Pane
                </label>
              </div>
            </ReflexElement>
            <ReflexSplitter{...this.resizeProps}/>
            <ReflexElement {...this.resizeProps}>
              <ReflexContainer orientation="horizontal">
                <ReflexElement {...this.resizeProps}>
                  <div>
                    <ReflexContainer orientation="vertical">
                      <ReflexElement {...this.resizeProps}>
                        <div className="pane-content">
                          <label>
                            Right Pane <br/> Upper-Left
                          </label>
                        </div>
                      </ReflexElement>
                      <ReflexSplitter/>
                      <ReflexElement {...this.resizeProps}>
                        <div className="pane-content">
                          <label>
                            Right Pane <br/> Upper-Right
                          </label>
                        </div>
                      </ReflexElement>
                    </ReflexContainer>
                  </div>
                </ReflexElement>
                <ReflexSplitter {...this.resizeProps}/>
                <ReflexElement {...this.resizeProps}>
                  <div className="pane-content">
                    <label>
                      Right Pane <br/> Bottom
                    </label>
                  </div>
                </ReflexElement>
              </ReflexContainer>
            </ReflexElement>
          </ReflexContainer>
        </ReflexElement>
        <ReflexElement className="footer" flex={0.1}>
          <div className="pane-content">
            <label>
              Footer (fixed)
            </label>
          </div>
        </ReflexElement>
      </ReflexContainer>
    )
  }
}

export default ReflexAdvancedDemo;
