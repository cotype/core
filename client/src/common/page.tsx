import styled from "styled-components/macro";

export const Background = styled("div")`
  height: 100%;
  background: #fff;
  position: relative;
  display: flex;
  flex-direction: column;
`;

export const Gradient = styled("div")`
  height: 100%;
  background: linear-gradient(90deg, #f5f5f5 50%, #fff);
`;

export const Page = styled("div")`
  box-sizing: border-box;
  min-height: 100%;
  padding: 36px;
  padding-top: 55px;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  position: relative;
`;

export const Center = styled("div")`
  margin: auto;
  text-align: center;
  max-width: 450px;
`;

export const Title = styled("div")`
  font-weight: 500;
  font-size: 30px;
  font-size: 1.875rem;
  letter-spacing: -0.05em;
  margin-right: 15px;
  margin-bottom: 24px;
  line-height: 1.1;
`;

export const Cols = styled("div")`
  display: flex;
`;

export const Content = styled("div")`
  flex-grow: 1;
  flex-shrink: 0;
  flex-basis: 250px;
  border-radius: 3px;
  padding: 24px;
`;

export const Outset = styled("div")`
  margin-left: -24px;
`;
