import { Model, NavigationItem } from "../../typings";
import React, { Component } from "react";
import basePath from "./basePath";
import Sidebar from "./common/Sidebar";
import SidebarGroup from "./common/SidebarGroup";
import SidebarLink from "./common/SidebarLink";
import { testable } from "./utils/helper";

type Props = {
  models: Model[];
  navigation: NavigationItem[];
  match: { params: { type: string } };
};

type State = {
  openGroup: string | null;
};
export default class ModelsSidebar extends Component<Props, State> {
  state: State = {
    openGroup: null
  };

  toggleGroup = (group: string) => {
    this.setState(state => ({
      openGroup: state.openGroup === group ? null : group
    }));
  };

  containsModel = (sidebar: NavigationItem[], model: string) => {
    return sidebar.some(s => {
      if (s.type === "model" && s.model === model) return true;
      if (s.type === "group") return this.containsModel(s.items, model);
      return false
    });
  };

  renderSidebar = (s: NavigationItem, level?: number) => {
    const { match } = this.props;
    const { type } = match.params;
    let selected = false;
    if (s.type === "model") {
      return (
        <div key={s.model}>
          <SidebarLink to={`${basePath}${s.path!}`}>{s.name}</SidebarLink>
        </div>
      );
    }
    if (s.items) {
      if (type) selected = this.containsModel(s.items, type);
      level = level ? level : 0;
      level++;
      return (
        <SidebarGroup key={s.name} level={level} initialOpen={selected}>
          {s.name}
          {s.items.map(n => this.renderSidebar(n, level))}
        </SidebarGroup>
      );
    }
  };

  render() {
    const { navigation } = this.props;

    if (!navigation.length) {
      return null;
    }

    return (
      <Sidebar {...testable("models-sidebar")} style={{ overflowY: "scroll" }}>
        {navigation.map(n => this.renderSidebar(n))}
      </Sidebar>
    );
  }
}
