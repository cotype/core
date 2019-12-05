import React, { Component } from "react";
import Button from "../common/Button";
import ModalDialog from "../common/ModalDialog";
import { paths } from "../common/icons";
import middleString from "../utils/middleString";
import * as Cotype from "../../../typings";
import api from "../api";
import ScrollList, { RenderInfo } from "../common/ScrollList";
import Item from "../List/Item";
import styled, { css } from "styled-components/macro";

export const errorClass = "error-field-label";

type Props = {
  onSave: (positionString: string) => void;
  onClose: () => void;
  model: Cotype.Model;
  id?: string;
};
type State = {
  lastRequestedIndex: number;
  items: Cotype.Item[];
  total: number;
};

const modalDialogStyle = {
  width: "80vw",
  background: "#f5f5f5",
  maxWidth: 800
};
const StyledItem = styled(Item)`
  pointer-events: none;
  padding-right: 50px;
  padding-left: 50px;
`;
const Field = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  background: #fff;
  box-sizing: border-box;
  align-items: center;
  &:first-of-type {
    > a {
      border-top: 1px solid #f5f5f5;
    }
  }
`;
const StyledButton = styled(Button)`
  opacity: 0.2;
  transition: opacity 0.3s ease-in-out;
  pointer-events: none;
`;
const ButtonBar = styled("div")<{ bottom?: boolean }>`
  position: absolute;
  width: 100%;
  z-index: 9;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  ${p =>
    p.bottom
      ? css`
          bottom: 0;
          transform: translateY(+50%);
        `
      : css`
          top: 0;
          transform: translateY(-50%);
        `}
  &:hover {
    > button {
      opacity: 1;
    }
  }
`;
const StyledList = styled(ScrollList)<{ bottom?: boolean }>`
  background-color: #fff;
  outline: none;
  > div {
    overflow: visible !important;
  }
  padding-top: 12px;
  padding-bottom: 12px;
`;
class PositionModal extends Component<Props, State> {
  state: State = {
    lastRequestedIndex: 0,
    items: [],
    total: 0
  };
  startIndex = 0;
  componentDidMount() {
    this.fetchNextData();
  }

  refresh() {
    this.fetchData(this.startIndex, 50);
  }

  fetchNextData = () => {
    this.fetchData(this.state.lastRequestedIndex, 50);
  };

  fetchData = (offset: number, limit = 50) => {
    const { model } = this.props;
    const { items } = this.state;
    this.setState({ lastRequestedIndex: offset + limit });
    api.list(model, { offset, limit }).then(res => {
      this.setState({
        items: items.slice(0, offset).concat(res.items),
        total: res.total
      });
    });
  };
  onRowsRendered = ({ startIndex, overscanStopIndex }: RenderInfo) => {
    this.startIndex = startIndex;
    // Lazy-load next batch of items
    if (overscanStopIndex >= this.state.lastRequestedIndex)
      this.fetchNextData();
  };
  setPosition = (prev, post) => {
    if (this.props.model.order !== "asc") {
      [prev, post] = [post, prev];
    }

    this.props.onSave(middleString(prev, prev !== post ? post : undefined));
  };
  render() {
    let { items } = this.state;
    const { total } = this.state;
    const actions = [
      <Button icon={paths.Clear} onClick={this.props.onClose} light>
        Abbrechen
      </Button>
    ];
    // const sortOrder = this.props.model.order || "desc";
    if (this.props.id) {
      items = items.filter(el => String(el.id) !== this.props.id);
    }

    return (
      <ModalDialog
        onClose={this.props.onClose}
        title="set position"
        actionButtons={actions}
        icon={paths.Sort}
        style={modalDialogStyle}
      >
        <StyledList
          rowCount={total - 1}
          items={items}
          onRowsRendered={this.onRowsRendered}
          visibleRows={7}
          extraPadding={24}
          renderRow={({ key, index, style }) => {
            const item = items[index];
            if (!item) return <div style={style} />;
            return (
              <Field style={style}>
                {index === 0 && (
                  <ButtonBar
                    onClick={() => this.setPosition(undefined, item.orderValue)}
                  >
                    <StyledButton icon={paths.ArrowRight} light />
                    <StyledButton icon={paths.ArrowLeft} light />
                  </ButtonBar>
                )}
                <StyledItem
                  baseUrl={"/"}
                  {...item}
                  key={`${key}-${item.id}`}
                  index={index}
                  small
                />
                <ButtonBar
                  bottom
                  onClick={() =>
                    this.setPosition(
                      item.orderValue,
                      items[index + 1] && items[index + 1].orderValue
                    )
                  }
                >
                  <StyledButton icon={paths.ArrowRight} light />
                  <StyledButton icon={paths.ArrowLeft} light />
                </ButtonBar>
              </Field>
            );
          }}
        />
      </ModalDialog>
    );
  }
}

export default PositionModal;
