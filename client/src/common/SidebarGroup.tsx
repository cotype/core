import React, { Component } from "react";
import styled, { css } from "react-emotion";
import Icon from "../common/icons";
import { testable } from "../utils/helper";

const active = css`
  background-color: hsla(0, 0%, 100%, 0.1);
  cursor: pointer;
`;

const GroupHeader = styled("div")`
  display: block;
  color: #e8e8e8;
  text-decoration: none;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  padding-left: ${(p: P) => `${p.level * 20}px`};
  :hover {
    ${active};
  }
`;

type Icon = {
  expanded: boolean;
};
const iconClass = (p: Icon) => css`
  margin-left: -10px;
  margin-right: 2px;
  transform: ${p.expanded ? "rotate(90deg)" : "none"};
`;

type P = {
  level: number;
};

const GroupChildren = styled("div")`
  & > div > a {
    padding-left: ${(p: P) => `${p.level * 20}px`};
  }
`;

type Props = {
  children: any;
  level: number;
  initialOpen?: boolean;
};
type State = {
  open: boolean;
};
export default class SidebarGroup extends Component<Props, State> {
  state: State = {
    open: false
  };

  constructor(props) {
    super(props);

    this.state = {
      open: props.initialOpen
    };
  }

  toggleOpen = () => {
    this.setState(state => ({ open: !state.open }));
  };

  render() {
    const { level } = this.props;
    const [group, children] = this.props.children;
    const { open } = this.state;
    return (
      <div>
        <GroupHeader
          {...testable("sidebar-group")}
          onClick={this.toggleOpen}
          level={level}
        >
          <Icon.ChevronRight className={iconClass({ expanded: open })} />
          {group}
        </GroupHeader>
        {open && <GroupChildren level={level + 1}>{children}</GroupChildren>}
      </div>
    );
  }
}
