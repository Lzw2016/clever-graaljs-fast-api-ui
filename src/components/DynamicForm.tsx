import React from "react";
import cls from "classnames";
import Icon from "@ant-design/icons";
import { CloseDarkGrey } from "@/utils/IdeaIconUtils";
import styles from "./DynamicForm.module.less";

interface ItemData {
  key: string;
  value: string;
  description: string;
  selected: boolean;
}

interface ItemDataState extends ItemData {
  /** 是否是种子数据 */
  addRow: boolean;
}

interface DynamicFormProps {
  /** 自定义样式 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 数据 */
  data?: Array<ItemData>;
}

interface DynamicFormState {
  dataMap: Map<number, ItemDataState>;
}

const defaultState: DynamicFormState = {
  dataMap: new Map<number, ItemDataState>(),
}

class DynamicForm extends React.Component<DynamicFormProps, DynamicFormState> {
  constructor(props: DynamicFormProps) {
    super(props);
    this.state = { ...defaultState, dataMap: transformDataMap(props.data) };
    // 加入种子数据
    this.addSeedItemData();
  }

  private addSeedItemData() {
    const { dataMap } = this.state;
    dataMap.set(dataMap.size + 1, { key: "", value: "", description: "", selected: false, addRow: true });
  }

  private getInputRow(item: ItemDataState, index: number): React.ReactNode {
    return (
      <div key={index} className={cls(styles.row)}>
        <span key={`checked-${index}`} className={cls(styles.input, styles.inputCheckbox)}>
          <input
            type={"checkbox"}
            style={{ visibility: item.addRow ? "hidden" : "visible" }}
            checked={item.selected}
            onChange={e => {
              item.selected = e.target.checked;
              if (item.addRow) {
                item.addRow = false;
                item.selected = true;
                this.addSeedItemData();
              }
              this.forceUpdate();
            }}
          />
        </span>
        <input
          key={`key-${index}`}
          className={cls(styles.input, styles.inputKey)}
          placeholder={"key"}
          value={item.key}
          onChange={e => {
            item.key = e.target.value;
            if (item.addRow) {
              item.addRow = false;
              item.selected = true;
              this.addSeedItemData();
            }
            this.forceUpdate();
          }}
        />
        <input
          key={`value-${index}`}
          className={cls(styles.input, styles.inputValue)}
          placeholder={"value"}
          value={item.value}
          onChange={e => {
            item.value = e.target.value;
            if (item.addRow) {
              item.addRow = false;
              item.selected = true;
              this.addSeedItemData();
            }
            this.forceUpdate();
          }}
        />
        <input
          key={`description-${index}`}
          className={cls(styles.input, styles.inputDescription)}
          placeholder={"description"}
          value={item.description}
          onChange={e => {
            item.description = e.target.value;
            if (item.addRow) {
              item.addRow = false;
              item.selected = true;
              this.addSeedItemData();
            }
            this.forceUpdate();
          }}
        />
        <Icon className={cls(styles.editIcon)} component={CloseDarkGrey}/>
      </div>
    );
  }

  render() {
    const { className, style, data } = this.props;
    let { dataMap } = this.state;
    if (data) dataMap = transformDataMap(data);
    const inputArray: React.ReactNode[] = [];
    dataMap.forEach((item, index) => inputArray.push(this.getInputRow(item, index)));
    return (
      <div className={cls(styles.panel, className)} style={style}>
        <div style={{ height: 8 }}/>
        <div key={"label"} className={cls(styles.row, styles.rowTitle)}>
          <div key={"label-checked"} className={cls(styles.input, styles.inputCheckboxTitle)}>&nbsp;</div>
          <div key={"label-key"} className={cls(styles.input, styles.inputKey, styles.rowTitleItem)}>Key</div>
          <div key={"label-value"} className={cls(styles.input, styles.inputValue, styles.rowTitleItem)}>Value</div>
          <div key={"label-description"} className={cls(styles.input, styles.inputDescription, styles.rowTitleItem)}>Description</div>
        </div>
        {inputArray}
        <div style={{ height: 8 }}/>
      </div>
    );
  }
}

const transformDataMap = (data?: Array<ItemData>): Map<number, ItemDataState> => {
  const dataMap = new Map<number, ItemDataState>();
  let index = 0;
  data?.forEach(item => {
    index++;
    dataMap.set(index, { ...item, addRow: false });
  });
  return dataMap;
}

export type { DynamicFormProps, DynamicFormState };
export { DynamicForm } ;
