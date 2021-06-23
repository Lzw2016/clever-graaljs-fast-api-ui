import React from "react";
import { FileResourceTree } from "@/components/ide";

interface AppProps {
}

interface AppState {
}

class App extends React.Component<AppProps, AppState> {
  render() {
    return (
      <FileResourceTree/>
    );
  }
}

export default App;
