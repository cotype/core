import React, { Component, Children } from "react";
import styled from "styled-components/macro";

const Root = styled("div")`
  display: flex;
  height: 100%;
  width: 100%;
  flex: 1;
`;

type P = {
  flex?: boolean;
  active?: boolean;
};

const Pane = styled("div")(
  { overflow: "auto", minWidth: 100 },
  (p: P) => ({ flex: p.flex ? 1 : 0 }),
  (p: P) => p.active && { userSelect: "none", pointerEvents: "none" }
);

const Splitter = styled("div")`
  background: #f0f0f0;
  opacity: 0.2;
  box-sizing: border-box;
  background-clip: padding-box;
  width: 11px;
  margin: 0 -5px;
  cursor: col-resize;
  transition: all 0.25s;
  z-index: 3;
  border-left: 5px solid rgba(255, 255, 255, 0);
  border-right: 5px solid rgba(255, 255, 255, 0);
  :hover {
    border-left: 5px solid rgba(0, 0, 0, 0.5);
    border-right: 5px solid rgba(0, 0, 0, 0.5);
  }
`;

type Props = {
  width?: number;
  children: any;
  primary?: "left" | "right";
};

type State = {
  width: number;
  active?: boolean;
  startPos?: number;
  startWidth?: number;
  primaryLeft?: boolean;
};

export default class SplitPane extends Component<Props, State> {
  state: State = {
    width: this.props.width || 200,
    primaryLeft: this.props.primary !== "right"
  };

  splitterProps = {
    onMouseDown: (ev: any) => {
      this.start(ev.clientX);
    },
    onTouchStart: (ev: any) => {
      this.start(ev.touches[0].clientX);
    }
  };

  rootProps = {
    onMouseMove: (ev: any) => {
      this.move(ev.clientX);
    },
    onTouchMove: (ev: any) => {
      this.move(ev.touches[0].clientX);
    },
    onMouseUp: (ev: any) => {
      this.stop();
    }
  };

  start = (startPos: number) => {
    this.setState({
      active: true,
      startPos,
      startWidth: this.state.width
    });
  };

  move = (pos: number) => {
    const { active, startPos = 0, startWidth = 0, primaryLeft } = this.state;
    if (active) {
      let delta = pos - startPos;
      if (!primaryLeft) delta *= -1;
      const width = startWidth + delta;
      this.setState({ width });
    }
  };

  stop = () => {
    this.setState({
      active: false
    });
  };

  render() {
    const childArray = Children.toArray(this.props.children);
    const { width, active, primaryLeft } = this.state;
    return (
      <Root
        {...this.rootProps}
        style={!primaryLeft ? { flexDirection: "row-reverse" } : undefined}
      >
        {childArray.reduce((memo, children, i) => {
          if (memo.length) {
            memo.push(<Splitter key={`${i}-split`} {...this.splitterProps} />);
          }

          memo.push(
            <Pane
              {...{
                key: i,
                active,
                style: i < childArray.length - 1 ? { flexBasis: width } : null,
                flex: i >= childArray.length - 1
              }}
              key={i}
              active={active}
              style={{ flexBasis: width }}
            >
              {children}
            </Pane>
          );

          return memo;
        }, [])}
      </Root>
    );
  }
}
