import React from "react";
import { HttpApiResourcePane } from "@/components/ide";

interface AppProps {
}

interface AppState {
}

class App extends React.Component<AppProps, AppState> {
  render() {
    return (
      <HttpApiResourcePane show={true}/>
    );
  }
}

export default App;
