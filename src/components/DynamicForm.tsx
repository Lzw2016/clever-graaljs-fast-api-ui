import React from "react";
import cls from "classnames";
import Icon from "@ant-design/icons";
import { CloseDarkGrey } from "@/utils/IdeaIconUtils";
import styles from "./DynamicForm.module.less";
import { noValue } from "@/utils/utils";

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
  /** 是否可以删除 */
  canDeleted?: boolean;
  /** 是否没有Checkbox */
  noCheckbox?: boolean;
  /** 是否没有Description */
  noDescription?: boolean;
  /** 是否强制更新组件 */
  forceUpdate?: boolean;
  /** 修改事件 */
  onChange?: (dataMap: Map<number, ItemDataState>) => void;
  /** 删除事件 */
  onDelete?: (item: ItemDataState, dataMap: Map<number, ItemDataState>) => void;
}

interface DynamicFormState {
  dataMap: Map<number, ItemDataState>;
}

const defaultState = (): DynamicFormState => ({
  dataMap: new Map<number, ItemDataState>(),
});

class DynamicForm extends React.Component<DynamicFormProps, DynamicFormState> {
  constructor(props: DynamicFormProps) {
    super(props);
    this.state = { ...defaultState() };
  }

  private updateData() {
    const { onChange } = this.props;
    if (onChange) {
      const { dataMap } = this.state;
      onChange(dataMap);
    }
    this.forceUpdate();
  }

  private transformDataMap(data?: Array<RequestItemData>): Map<number, ItemDataState> {
    const dataMap = new Map<number, ItemDataState>();
    data?.forEach((item, index) => {
      const itemDataState: ItemDataState = (item as ItemDataState);
      if (noValue(itemDataState.addRow)) itemDataState.addRow = false;
      dataMap.set(index, itemDataState);
    });
    return dataMap;
  }

  // 加入种子数据
  private addSeedItemData(dataMap: Map<number, ItemDataState>) {
    const { readOnly } = this.props;
    if (readOnly) return;
    let hasAddRow = false;
    dataMap.forEach(item => {
      if (hasAddRow) return;
      hasAddRow = item.addRow;
    });
    if (hasAddRow) return;
    const itemDataState: ItemDataState = { key: "", value: "", description: "", selected: false, addRow: true };
    dataMap.set(dataMap.size, itemDataState);
  }

  private static addDataItem(item: ItemDataState, data?: RequestItemData[]) {
    if (!data || data.indexOf(item) !== -1) return;
    data.push(item);
  }

  private getInputRow(dataMap: Map<number, ItemDataState>, item: ItemDataState, index: number): React.ReactNode {
    const { data, readOnly, canDeleted, noCheckbox, noDescription, onDelete } = this.props;
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
                  DynamicForm.addDataItem(item, data);
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
              DynamicForm.addDataItem(item, data);
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
              DynamicForm.addDataItem(item, data);
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
                DynamicForm.addDataItem(item, data);
              }
              this.updateData();
            }}
          />
        }
        {
          (!readOnly || canDeleted) &&
          <Icon
            className={cls(styles.editIcon, { [styles.hide]: (item.addRow) })}
            component={CloseDarkGrey}
            onClick={() => {
              if (item.addRow) return;
              dataMap.delete(index);
              if (data) {
                data.length = 0;
                dataMap.forEach(item => {
                  if (item.addRow) return;
                  data.push(item);
                });
              }
              if (onDelete) onDelete(item, dataMap);
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
    if (data) dataMap = this.transformDataMap(data);
    this.addSeedItemData(dataMap);
    const inputArray: React.ReactNode[] = [];
    dataMap.forEach((item, index) => inputArray.push(this.getInputRow(dataMap, item, index)));
    return (
      <div className={cls(styles.panel, className)} style={style}>
        <div style={{ height: 8 }}/>
        <div key={"label"} className={cls(styles.row, styles.rowTitle)}>
          {
            !noCheckbox &&
            <div key={"label-checked"} className={cls(styles.input, styles.inputCheckboxTitle)} style={{ overflow: "hidden" }}>
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

export type { DynamicFormProps, DynamicFormState };
export { DynamicForm };
