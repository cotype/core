import * as Cotype from "../../../typings";
import React from "react";
import styled from "react-emotion";
import { Link } from "react-router-dom";

import basePath from "../basePath";
import ImageCircle from "../common/ImageCircle";

import ColorHash from "color-hash";
import { withModelPaths } from "../ModelPathsContext";
const colorHash = new ColorHash({ saturation: 0.7, lightness: 0.6 });

const ImageItem = styled(Link)`
  width: 100%;
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--dark-color);
`;

const Title = styled("div")`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const Kind = styled("div")`
  margin-left: auto;
  border-radius: 3px;
  color: #fff;
  font-size: 0.8em;
  padding: 2px 5px;
`;

type Props = {
  item: Cotype.Item;
  modelPaths: Cotype.ModelPaths;
  baseUrls: Cotype.BaseUrls;
};

const link = (...parts: string[]) => basePath + parts.filter(Boolean).join("/");

const ResultItem = ({ item, modelPaths }: Props) => {
  const { type, model, title, image, kind, id } = item;

  const path =
    type === "settings"
      ? `${type}/${model}`
      : modelPaths[type] && modelPaths[type][model];

  const to = link(path, "edit", id);
  const src = image ? `/thumbs/square/${image}` : null;
  return (
    <ImageItem to={to}>
      {<ImageCircle src={src} alt={title} size={12} />}
      <Title>{title}</Title>
      <Kind style={{ background: colorHash.hex(kind) }}>{kind}</Kind>
    </ImageItem>
  );
};

export default withModelPaths(ResultItem);
