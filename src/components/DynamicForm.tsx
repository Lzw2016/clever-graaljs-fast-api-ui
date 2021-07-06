import React from "react";
import cls from "classnames";
import Icon from "@ant-design/icons";
import { CloseDarkGrey } from "@/utils/IdeaIconUtils";
import styles from "./DynamicForm.module.less";

interface ItemDataState extends RequestItemData {
  /** 是否是种子数据 */
  addRow: boolean;
}

interface DynamicFormProps {
  /** 自定义样式 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 数据 */
  data?: Array<RequestItemData>;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否没有Checkbox */
  noCheckbox?: boolean;
  /** 是否没有Description */
  noDescription?: boolean;
  /** 是否强制更新组件 */
  forceUpdate?: boolean;
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
  }

  private updateData() {
    this.forceUpdate();
  }

  private getInputRow(item: ItemDataState, index: number): React.ReactNode {
    const { dataMap } = this.state;
    const { readOnly, noCheckbox, noDescription } = this.props;
    return (
      <div key={index} className={cls(styles.row)}>
        {
          !noCheckbox &&
          <span key={`checked-${index}`} className={cls(styles.input, styles.inputCheckbox)}>
            <input
              type={"checkbox"}
              style={{ visibility: item.addRow ? "hidden" : "visible" }}
              checked={item.selected}
              readOnly={readOnly}
              onChange={e => {
                item.selected = e.target.checked;
                if (item.addRow) {
                  item.addRow = false;
                  item.selected = true;
                  addSeedItemData(dataMap);
                }
                this.updateData();
              }}
            />
          </span>
        }
        <input
          key={`key-${index}`}
          className={cls(styles.input, styles.inputKey)}
          placeholder={"key"}
          value={item.key}
          readOnly={readOnly}
          onChange={e => {
            item.key = e.target.value;
            if (item.addRow) {
              item.addRow = false;
              item.selected = true;
              addSeedItemData(dataMap);
            }
            this.updateData();
          }}
        />
        <input
          key={`value-${index}`}
          className={cls(
            styles.input, styles.inputValue,
            { [styles.inputValueNoDescription]: noDescription },
            { [styles.inputValueNoDescriptionNoCheckbox]: noCheckbox && noDescription },
          )}
          placeholder={"value"}
          value={item.value}
          readOnly={readOnly}
          onChange={e => {
            item.value = e.target.value;
            if (item.addRow) {
              item.addRow = false;
              item.selected = true;
              addSeedItemData(dataMap);
            }
            this.updateData();
          }}
        />
        {
          !noDescription &&
          <input
            key={`description-${index}`}
            className={cls(
              styles.input, styles.inputDescription,
              { [styles.inputDescriptionNoCheckbox]: noCheckbox },
            )}
            placeholder={"description"}
            value={item.description}
            readOnly={readOnly}
            onChange={e => {
              item.description = e.target.value;
              if (item.addRow) {
                item.addRow = false;
                item.selected = true;
                addSeedItemData(dataMap);
              }
              this.updateData();
            }}
          />
        }
        {
          !readOnly &&
          <Icon
            className={cls(styles.editIcon, { [styles.hide]: (item.addRow) })}
            component={CloseDarkGrey}
            onClick={() => {
              if (item.addRow) return;
              this.state.dataMap.delete(index);
              this.updateData();
            }}
          />
        }
      </div>
    );
  }

  render() {
    const { className, style, data, noCheckbox, noDescription } = this.props;
    let { dataMap } = this.state;
    if (data) dataMap = transformDataMap(data);
    let hasAddRow = false;
    dataMap.forEach(item => {
      if (hasAddRow) return;
      hasAddRow = item.addRow;
    });
    if (!hasAddRow) {
      addSeedItemData(this.state.dataMap);
    }
    const inputArray: React.ReactNode[] = [];
    dataMap.forEach((item, index) => inputArray.push(this.getInputRow(item, index)));
    return (
      <div className={cls(styles.panel, className)} style={style}>
        <div style={{ height: 8 }}/>
        <div key={"label"} className={cls(styles.row, styles.rowTitle)}>
          {
            !noCheckbox &&
            <div key={"label-checked"} className={cls(styles.input, styles.inputCheckboxTitle)}>
              &nbsp;
            </div>
          }
          <div key={"label-key"} className={cls(styles.input, styles.inputKey, styles.rowTitleItem)}>
            Key
          </div>
          <div
            key={"label-value"}
            className={cls(
              styles.input, styles.inputValue, styles.rowTitleItem,
              { [styles.inputValueNoDescription]: noDescription },
              { [styles.inputValueNoDescriptionNoCheckbox]: noCheckbox && noDescription },
            )}>
            Value
          </div>
          {
            !noDescription &&
            <div
              key={"label-description"}
              className={cls(
                styles.input, styles.inputDescription, styles.rowTitleItem,
                { [styles.inputDescriptionNoCheckbox]: noCheckbox },
              )}
            >
              Description
            </div>
          }
        </div>
        {inputArray}
        <div style={{ height: 8 }}/>
      </div>
    );
  }
}

// 加入种子数据
const addSeedItemData = (dataMap: Map<number, ItemDataState>) => {
  dataMap.set(dataMap.size + 1, { key: "", value: "", description: "", selected: false, addRow: true });
}

const transformDataMap = (data?: Array<RequestItemData>): Map<number, ItemDataState> => {
  const dataMap = new Map<number, ItemDataState>();
  let index = 0;
  data?.forEach(item => {
    index++;
    const itemDataState: ItemDataState = (item as ItemDataState);
    itemDataState.addRow = false;
    dataMap.set(index, itemDataState);
  });
  addSeedItemData(dataMap);
  return dataMap;
}

export type { DynamicFormProps, DynamicFormState };
export { DynamicForm } ;
