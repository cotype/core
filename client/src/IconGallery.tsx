import React, { Component } from "react";
import styled from "react-emotion";
import api from "./api";
import Icon from "./common/Icon";
import { Page } from "./common/page";

const Figure = styled("figure")`
  display: inline-block;
  margin: 5px;
  position: relative;
  & > figcaption {
    display: none;
    position: absolute;
    z-index: 1;
    padding: 5px;
    background: #fff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    white-space: nowrap;
  }
  :hover {
    color: var(--primary-color);
  }
  :hover > figcaption {
    display: block;
  }
`;

type State = {
  icons?: any;
  filter?: string;
};

export default class IconGallery extends Component {
  state: State = {};

  componentDidMount() {
    api.get("/icons").then(icons => {
      icons.forEach(i => {
        i.search = [i.name, ...i.tags, ...i.aliases].join().toLowerCase();
      });
      this.setState({ icons });
    });
  }

  filter = ev => {
    this.setState({ filter: ev.target.value.toLowerCase() });
  };

  match = icon => {
    const { filter } = this.state;
    return !filter || icon.search.includes(filter);
  };

  render() {
    const { icons } = this.state;
    if (!icons) return null;
    return (
      <Page>
        <p>
          <input type="search" placeholder="Search …" onKeyUp={this.filter} />
        </p>
        <div>
          {icons.filter(this.match).map(i => (
            <Figure key={i.id}>
              <Icon path={i.path} />
              <figcaption>{i.name}</figcaption>
            </Figure>
          ))}
        </div>
      </Page>
    );
  }
}
