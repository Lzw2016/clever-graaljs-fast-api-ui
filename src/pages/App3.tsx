// import React from "react";
// import { Button, Modal } from 'antd';
// import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
//
// interface AppProps {
//
// }
//
// interface AppState {
//   visible: boolean;
//   disabled: boolean;
//   bounds: { left: number, top: number, bottom: number, right: number }
// }
//
// class App extends React.Component<AppProps, AppState> {
//   state = {
//     visible: false,
//     disabled: true,
//     bounds: { left: 0, top: 0, bottom: 0, right: 0 },
//   };
//
//   draggleRef: React.RefObject<HTMLDivElement> = React.createRef();
//
//   showModal = () => {
//     console.log("### -> ", this)
//     this.setState({ visible: true });
//   }
//
//   handleOk = () => {
//     this.setState({ visible: false });
//   }
//
//   handleCancel = () => {
//     this.setState({ visible: false });
//   }
//
//   onStart = (event: DraggableEvent, uiData: DraggableData) => {
//     const { clientWidth, clientHeight } = window?.document?.documentElement;
//     const targetRect = this.draggleRef?.current?.getBoundingClientRect();
//     if (!targetRect) {
//       return;
//     }
//     this.setState({
//       bounds: {
//         left: -targetRect?.left + uiData?.x,
//         right: clientWidth - (targetRect?.right - uiData?.x),
//         top: -targetRect?.top + uiData?.y,
//         bottom: clientHeight - (targetRect?.bottom - uiData?.y),
//       },
//     });
//   }
//
//   render() {
//     const { visible, disabled, bounds } = this.state;
//     return (
//       <>
//         <Button onClick={this.showModal}>Open Draggable Modal</Button>
//         <Modal
//           title={
//             <div
//               style={{ width: '100%', cursor: 'move' }}
//               onMouseOver={() => {
//                 if (disabled) {
//                   this.setState({ disabled: false });
//                 }
//               }}
//               onMouseOut={() => this.setState({ disabled: true })}
//             >
//               Draggable Modal
//             </div>
//           }
//           maskClosable={false}
//           visible={visible}
//           onOk={this.handleOk}
//           onCancel={this.handleCancel}
//           modalRender={modal => (
//             <Draggable
//               disabled={disabled}
//               bounds={bounds}
//               onStart={(event, uiData) => this.onStart(event, uiData)}
//             >
//               <div ref={this.draggleRef}>{modal}</div>
//             </Draggable>
//           )}
//         >
//           <p>
//             Just don&apos;t learn physics at school and your life will be full of magic and
//             miracles.
//           </p>
//           <br/>
//           <p>Day before yesterday I saw a rabbit, and yesterday a deer, and today, you.</p>
//         </Modal>
//       </>
//     );
//   }
// }
//
// export default App;
