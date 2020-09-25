import * as Cotype from "../../../typings";
import React from "react";
import styled from "styled-components/macro";
import { Link } from "react-router-dom";
import _escape from "lodash/escape";
import basePath from "../basePath";
import ImageCircle from "../common/ImageCircle";
import TimeAgo from "react-time-ago";
import ColorHash from "color-hash";
import { useModelPaths, withModelPaths } from "../ModelPathsContext";
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

const ChangedBy = styled("span")`
  color: var(--dark-grey);
  font-size: 0.8em;
`;

const LastChangedBy = ({ author, date }: { author: string; date: string }) => (
  <ChangedBy>
    Updated by {author} <TimeAgo date={new Date(date)} />
  </ChangedBy>
);

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
  const src = image
    ? image.includes("://")
      ? image
      : `/thumbs/square/${image}`
    : null;
  return (
    <ImageItem>
      <ImageCircle src={src} alt={title} size={12} />
      <Wrapper>
        <TitleWrapper>
          <ResultTitle title={title} term={term}></ResultTitle>

          <Kind style={{ background: colorHash.hex(String(kind)) }}>
            {kind}
          </Kind>
        </TitleWrapper>
        <DescriptionWrapper>
          {"description" in item && item.description && (
            <Description>
              <ResultTitle term={term} title={item.description}></ResultTitle>
            </Description>
          )}
        </DescriptionWrapper>
        {"author_name" in item && "date" in item && (
          <LastChangedBy date={item.date} author={item.author_name} />
        )}
      </Wrapper>
    </ImageItem>
  );
};

type Props = {
  item: Cotype.SearchResultItem | Cotype.VersionItem;
  term?: string;
};

const link = (...parts: string[]) => basePath + parts.filter(Boolean).join("/");

const ResultItem = ({ item, term }: Props) => {
  const { modelPaths } = useModelPaths();
  const { type, model, id } = item;
  if (!type || !modelPaths) return null;

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

export default ResultItem;
