import styled from "react-emotion";

const colors = {
  grey: "#aaa",
  yellow: "#dfda00",
  green: "#51c633",
  red: "#f96054"
};

type P = {
  color: keyof typeof colors;
};

const StatusLight = styled("div")`
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 5px;
  margin: 0 5px;
  display: inline-block;
  vertical-align: middle;
  background-color: ${(p: P) => colors[p.color || "grey"]};
`;

export default StatusLight;
