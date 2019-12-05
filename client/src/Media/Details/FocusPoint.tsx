import { Media } from "../../../../typings";
import React, { Component } from "react";
import Draggable from "react-draggable";
import Icon, { paths } from "../../common/icons";
import styled from "styled-components/macro";
import Button from "../../common/Button";
import { mediaBasePath } from "../../basePath";

const DEFAULT_PREVIEW_PATH = "/thumbs/preview/";

const Root = styled("div")`
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  border-radius: 4px;
`;
type EditBackground = {
  inEdit?: boolean;
};

const EditBackground = styled("div")`
  height: 100vh;
  width: 100vw;
  position: fixed;
  background-color: rgba(0, 0, 0, 0.65);
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: ${(p: EditRoot) => (p.inEdit ? "block" : "none")};
  opacity: ${(p: EditRoot) => (p.inEdit ? 1 : 0)};
  transition: all 0.3s ease;
`;

type ActionsBar = {
  bottom?: boolean;
};
const ActionsBar = styled("div")`
  position: absolute;
  top: ${({ bottom }: ActionsBar) => (bottom ? "100%" : 0)};
  right: ${({ bottom }: ActionsBar) => bottom && 0};
  left: ${({ bottom }: ActionsBar) => !bottom && "100%"};
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  box-sizing: border-box;
  white-space: nowrap;
`;

type EditRoot = {
  inEdit?: boolean;
};

const EditRoot = styled("div")`
  z-index: ${(p: EditRoot) => p.inEdit && 21};
  position: relative;
  max-width: 100%;
  max-height: 100%;
  height: 100%;
`;

type TargetWrapper = {
  width: number;
  height: number;
};
const TargetWrapper = styled("div")`
  max-height: 100%;
  max-width: 100%;
  width: ${({ width, height }: TargetWrapper) =>
    width > height && `${width}px`};
  height: ${({ width, height }: TargetWrapper) =>
    width < height && `${height}px`};
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
`;

type FocusTarget = {
  inEdit: boolean;
};
const FocusTarget = styled("div")`
  position: absolute;
  top: 0px;
  left: 0ox;
  display: flex;
  cursor: ${(p: FocusTarget) => p.inEdit && "move"};
  & > svg {
    color: #fff;
    filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.6));
    margin: -2px;
  }
`;

const MoreIcon = styled(Icon.More)`
  position: absolute;
  top: 7px;
  right: 7px;
  z-index: 1;
  color: var(--dark-color);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 100%;
  margin: 0 0 0 4px;
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.15);
  cursor: pointer;
`;

const Img = styled("img")`
  border-radius: 3px;
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  user-select: none;
`;

type Props = {
  initialX?: number;
  initialY?: number;
  data: Media;
  onPosistionChange: (x: number, y: number) => void;
};
type State = {
  positionX?: number;
  positionY?: number;
  ratio?: number;
  inEdit: boolean;
  displayWidth?: number;
  displayHeight?: number;
};

export default class ImageFocus extends Component<Props, State> {
  state: State = {
    inEdit: false
  };

  focusTarget: React.RefObject<any>;

  constructor(props) {
    super(props);
    this.focusTarget = React.createRef();
  }

  componentDidMount() {
    window.addEventListener("resize", this.getDimensions);
    setTimeout(() => {
      this.getDimensions();
    }, 100);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.getDimensions);
  }

  getDimensions = () => {
    const { data, initialX, initialY } = this.props;

    const displayWidth = this.focusTarget.current.clientWidth;
    const displayHeight = this.focusTarget.current.clientHeight;
    const ratio = displayWidth / data.width!;
    const positionX: number =
      initialX === undefined ? displayWidth / 2 : initialX * ratio;
    const positionY: number =
      initialY === undefined ? displayHeight / 2 : initialY * ratio;

    this.setState({ positionX, positionY, ratio, displayWidth, displayHeight });
  };

  onDragStop = (e, data: { x: number; y: number }) => {
    const { x, y } = data;
    this.setState({ positionX: x, positionY: y });
  };

  onSave = () => {
    const { ratio = 1, positionX = 0, positionY = 0 } = this.state;

    this.props.onPosistionChange(positionX / ratio, positionY / ratio);
    this.setState({ inEdit: false });
  };

  onCancel = () => {
    const { initialX, initialY } = this.props;
    const { ratio = 1 } = this.state;

    if (initialX && initialY) {
      this.setState({
        positionX: initialX * ratio,
        positionY: initialY * ratio
      });
    } else {
      this.getDimensions();
    }
    this.setState({ inEdit: false });
  };

  render() {
    const { positionX, positionY, inEdit, ratio, displayHeight } = this.state;
    const {
      data: { width, height, id }
    } = this.props;
    return (
      <Root>
        <EditRoot inEdit={inEdit}>
          {!inEdit && (
            <MoreIcon
              onClick={() => {
                if (!this.state.ratio) this.getDimensions();
                this.setState({ inEdit: true });
              }}
            />
          )}
          <TargetWrapper width={width!} height={height!}>
            {inEdit && (
              <ActionsBar
                bottom={
                  displayHeight !== undefined &&
                  (displayHeight >= height! || height! < width!)
                }
              >
                <Button icon={paths.Save} onClick={this.onSave} light>
                  Ok
                </Button>
                <Button icon={paths.Clear} onClick={this.onCancel} light>
                  Cancel
                </Button>
              </ActionsBar>
            )}
            <Img
              src={`${mediaBasePath}${DEFAULT_PREVIEW_PATH}${id}`}
              ref={this.focusTarget}
              style={{
                width: width! > height! ? width! : "unset",
                height: width! < height! ? height! : "unset"
              }}
              alt=""
            />
            <Draggable
              bounds="img"
              onStop={this.onDragStop}
              position={
                positionX && positionY
                  ? { x: positionX, y: positionY }
                  : undefined
              }
              disabled={!inEdit}
            >
              {ratio ? (
                <FocusTarget inEdit={inEdit}>
                  <Icon.Focus />
                </FocusTarget>
              ) : (
                <div />
              )}
            </Draggable>
          </TargetWrapper>
        </EditRoot>
        <EditBackground
          inEdit={inEdit}
          onClick={() => this.setState({ inEdit: false })}
        />
      </Root>
    );
  }
}
