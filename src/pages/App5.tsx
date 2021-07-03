import React from "react";
import { HttpApiResourcePanel } from "@/components/ide";

interface AppProps {
}

interface AppState {
}

class App extends React.Component<AppProps, AppState> {
  render() {
    return (
      <HttpApiResourcePanel/>
    );
  }
}

export default App;
