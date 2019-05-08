import * as Cotype from "../../../../typings";
import React, { Component } from "react";

import api from "../../api";
import { Page, Title, Cols, Content, Outset } from "../../common/page";
import { Output } from "../elements";

type Props = {
  id: string;
  rev?: string | number;
  model: Cotype.Model;
  versions?: Array<Cotype.VersionItem & { published: boolean }>;
  onReceiveData?: (data: any) => void;
};

type State = {
  data?: any;
  compareTo?: any;
};

export default class History extends Component<Props, State> {
  state: State = {};

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prev: Props) {
    const { id, rev } = this.props;
    if (id !== prev.id || rev !== prev.rev) this.fetchData();
  }

  fetchData = () => {
    const { model, id, versions, rev, onReceiveData } = this.props;

    if (id !== undefined && rev !== undefined) {
      api.loadVersion(model, id, Number(rev)).then(version => {
        this.setState(version);
        if (onReceiveData) onReceiveData(version);
      });
      if (versions && versions.length) {
        api
          .loadVersion(model, id, versions[0].rev)
          .then(version => this.setState({ compareTo: version.data }));
      }
    } else if (id !== undefined) {
      api.load(model, id).then(version => this.setState(version));
    }
  };

  render() {
    const { model, rev } = this.props;
    const { data, compareTo } = this.state;

    if (!data) return null;
    return (
      <Page>
        {rev && <Title>{`Version ${rev}`}</Title>}
        <Cols>
          <Content style={{ background: "none" }}>
            <Outset>
              <Output
                fields={model.fields}
                value={data}
                compareTo={compareTo}
              />
            </Outset>
          </Content>
        </Cols>
      </Page>
    );
  }
}
