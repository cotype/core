import React, { Component } from "react";
import styled, { css } from "react-emotion";
import Downshift, { DownshiftProps } from "downshift";
import { inputClass } from "./styles";

type P = {
  isActive: boolean;
  isSelected: boolean;
};
const Item = styled("div")`
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  ${(p: P) =>
    p.isActive &&
    css`
      color: rgba(0, 0, 0, 0.95);
      background: var(--light-color);
    `};
  ${(p: P) =>
    p.isSelected &&
    css`
      font-weight: 700;
    `};
  &:hover {
    cursor: pointer;
  }
`;

const rootClass = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  position: relative;
  min-height: 42px;
`;

const ListWrapper = styled("div")`
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 1px;
  z-index: 1;
`;

const ScrollList = styled("div")`
  background: #fff;
  transition: opacity 0.1s ease;
  border: 1px solid #f0f0f0;
  border-top-width: 0;
  box-shadow: 0 12px 12px -12px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  max-height: 250px;
  overflow: hidden;
  overflow-y: scroll;
`;

const Button = styled("button")`
  background-color: transparent;
  border: none;
  width: 47px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  outline: none;
`;

function ArrowIcon({ isOpen }: { isOpen?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      preserveAspectRatio="none"
      width={16}
      fill="transparent"
      stroke="#666"
      strokeWidth="1.1px"
      transform={isOpen ? "rotate(180)" : undefined}
    >
      <path d="M1,6 L10,15 L19,6" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      preserveAspectRatio="none"
      width={12}
      fill="transparent"
      stroke="#666"
      strokeWidth="1.1px"
    >
      <path d="M1,1 L19,19" />
      <path d="M19,1 L1,19" />
    </svg>
  );
}

type Props = Partial<DownshiftProps<any>> & {
  toggleButton?: boolean;
  placeholder?: string;
  itemToString: (item: any) => string;
  renderItem: (item: any) => React.ReactNode;
  items: any[];
  inputClassName?: string;
  style?: any;
  name?: string;
};
export default class Autocomplete extends Component<Props> {
  wasOpen: boolean = false;
  setInput = (node: any) => {
    if (node && this.wasOpen) node.focus();
  };

  render() {
    const {
      toggleButton,
      placeholder,
      itemToString,
      renderItem = this.props.itemToString,
      items = [],
      inputClassName = inputClass,
      style,
      name,
      ...rest
    } = this.props;
    return (
      <Downshift itemToString={itemToString} itemCount={items.length} {...rest}>
        {({
          getInputProps,
          getToggleButtonProps,
          getItemProps,
          isOpen,
          toggleMenu,
          clearSelection,
          selectedItem,
          highlightedIndex
        }) => (
          <div className={rootClass} style={style}>
            {selectedItem ? (
              renderItem(selectedItem)
            ) : (
              <input
                {...getInputProps()}
                ref={this.setInput}
                className={inputClassName}
                placeholder={placeholder}
                name={name}
                onClick={() => {
                  if (!isOpen && !selectedItem) toggleMenu();
                }}
              />
            )}
            {toggleButton &&
              (selectedItem ? (
                <Button
                  type="button"
                  onClick={() => {
                    this.wasOpen = true;
                    clearSelection();
                  }}
                >
                  <XIcon />
                </Button>
              ) : (
                <Button {...getToggleButtonProps()}>
                  <ArrowIcon isOpen={isOpen} />
                </Button>
              ))}
            {!isOpen || !items.length ? null : (
              <ListWrapper>
                <ScrollList>
                  {items.map((item, index) => (
                    <Item
                      key={itemToString(item) + index}
                      {...getItemProps({
                        item,
                        index,
                        isSelected: selectedItem === items[index]
                      })}
                      isActive={highlightedIndex === index}
                    >
                      {renderItem(item)}
                    </Item>
                  ))}
                </ScrollList>
              </ListWrapper>
            )}
          </div>
        )}
      </Downshift>
    );
  }
}
