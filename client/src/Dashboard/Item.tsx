import styled from "styled-components/macro";

const Item = styled("div")`
  cursor: pointer;
  padding: 12px 16px;
  box-sizing: border-box;
  border-bottom: 1px solid #f5f5f5;
  :hover {
    background-color: var(--light-color);
  }
`;

export default Item;
