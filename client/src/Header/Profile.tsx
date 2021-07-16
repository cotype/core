import { Principal, User, BaseUrls, ModelPaths } from "../../../typings";
import React, { Component } from "react";

import api from "../api";
import { withUser } from "../auth/UserContext";
import { testable } from "../utils/helper";
import { withModelPaths } from "../ModelPathsContext";
import {
  ImageCircle,
  PopoverMenu,
  PopoverMenuMenu as Menu,
  PopoverMenuItem as Item
} from "@cotype/ui";

type Props = {
  user: (Principal & User) | null;
  modelPaths: ModelPaths;
  baseUrls: BaseUrls;
};
class Profile extends Component<Props> {
  logout = () => {
    api.post("/logout", {}).then(() => {
      window.location.href = this.props.baseUrls.cms || "/";
    });
  };

  renderMenu = () => (
    <Menu>
      <Item onClick={this.logout}>Logout</Item>
    </Menu>
  );

  render() {
    const { user } = this.props;
    if (!user) return null;
    const src = user.picture && `/thumbs/square/${user.picture}`;
    const alt = user.name || user.email;
    return (
      <PopoverMenu renderMenu={this.renderMenu}>
        <ImageCircle
          {...testable("profile-image")}
          src={src}
          alt={alt}
          size={14}
        />
      </PopoverMenu>
    );
  }
}

export default withModelPaths(withUser(Profile));
