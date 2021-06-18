import React from "react";
// @ts-ignore
import Alert, { Container } from '@jetbrains/generator-ring-ui/react';

interface AppProps {

}

interface AppState {
}

class App extends React.Component<AppProps, AppState> {
  render() {
    return (
      <Container>
        <Alert
          key={"001"}
          type={Alert.Type.ERROR}
        >
          系统错误123
        </Alert>
      </Container>
    );
  }
}

export default App
