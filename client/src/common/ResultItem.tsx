import * as Cotype from "../../../typings";
import React, { Fragment } from "react";
import styled from "react-emotion";
import { Link } from "react-router-dom";
import _escape from "lodash/escape";
import basePath from "../basePath";
import ImageCircle from "../common/ImageCircle";

import ColorHash from "color-hash";
import { withModelPaths } from "../ModelPathsContext";
const colorHash = new ColorHash({ saturation: 0.7, lightness: 0.6 });

const ImageItem = styled("div")`
  width: 100%;
  display: flex;
  align-items: center;
  color: var(--dark-color);
  min-width: 0;
`;

const Container = styled(Link)`
  width: 100%;
  text-decoration: none;
  color: var(--dark-color);
  min-width: 0;
`;

const Wrapper = styled("div")`
  min-width: 0;
  width: 100%;
`;
const DescriptionWrapper = styled("div")`
  display: flex;
`;
const TitleWrapper = styled("div")`
  display: flex;
  justify-content: space-between;
`;
const Description = styled("div")`
  color: var(--dark-grey);
  padding-top: 4px;
  font-size: 0.8rem;
  min-width: 0;
`;
const Title = styled("div")`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const Kind = styled("div")`
  border-radius: 3px;
  color: #fff;
  font-size: 0.8em;
  padding: 2px 5px;
  flex-shrink: 0;
`;

export const ResultTitle = ({
  title,
  term
}: {
  title: string;
  term?: string;
}) => {
  if (!term) return <Title>{title}</Title>;

  const firstMatch = title.search(new RegExp(term, "i"));

  if (firstMatch === -1) return <Title>{title}</Title>;

  let titleWithHighlight = _escape(title).replace(
    new RegExp("(^|)(" + term + ")(|$)", "gi"),
    "$1<b>$2</b>$3"
  );

  // cut beginning of string, if match is too far in the end
  if (firstMatch > 20 && title.length > 50) {
    titleWithHighlight =
      "..." +
      titleWithHighlight.substring(
        firstMatch - (title.length - firstMatch > 25 ? 5 : 25)
      );
  }

  return (
    <Title
      dangerouslySetInnerHTML={{
        __html: titleWithHighlight
      }}
    />
  );
};

type BasicProps = {
  item: Cotype.SearchResultItem | Cotype.VersionItem;
  term?: string;
};
export const BasicResultItem = ({ item, term }: BasicProps) => {
  const { title, image, kind } = item;
  const src = image ? `/thumbs/square/${image}` : null;
  return (
    <ImageItem>
      <ImageCircle src={src} alt={title} size={12} />
      <Wrapper>
        <TitleWrapper>
          <ResultTitle title={title} term={term}></ResultTitle>
          <Kind style={{ background: colorHash.hex(kind) }}>{kind}</Kind>
        </TitleWrapper>
        <DescriptionWrapper>
          {"description" in item && item.description && (
            <Description>
              <ResultTitle term={term} title={item.description}></ResultTitle>
            </Description>
          )}
        </DescriptionWrapper>
      </Wrapper>
    </ImageItem>
  );
};

type Props = {
  item: Cotype.SearchResultItem | Cotype.VersionItem;
  term?: string;
  modelPaths: Cotype.ModelPaths;
  baseUrls: Cotype.BaseUrls;
};

const link = (...parts: string[]) => basePath + parts.filter(Boolean).join("/");

const ResultItem = ({ item, modelPaths, term }: Props) => {
  const { type, model, id } = item;
  if (!type) return null;

  const path =
    type === "settings"
      ? `/${type}/${model}`
      : modelPaths[type] && modelPaths[type][model];

  const to = link(path, "edit", id);

  return (
    <Container to={to}>
      <BasicResultItem item={item} term={term}></BasicResultItem>
    </Container>
  );
};

export default withModelPaths(ResultItem);
