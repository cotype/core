import * as Cotype from "../../../typings";
import styled from "styled-components/macro";
import React from "react";
import Button from "./Button";

const Box = styled.div`
  background: #fff;
  display: flex;
  flex-direction: column;
  border-radius: 3px;
`;
const Row = styled(Button)`
  padding: 0 15px;
  border: 0;
  width: 100%;
  margin: 0;
  background: #fff;
  border-radius: 0;
  color: var(--primary-color);
  :hover {
    color: #fff;
    background: var(--accent-color);
  }
`;

const LanguageSwitch = (p: {
  languages: Cotype.Language[] | null;
  setLanguage: (lang: Cotype.Language) => void;
  onChangeLanguages: () => void;
}) => {
  if (!p.languages) {
    return null;
  }
  return (
    <Box>
      {p.languages.map(l => {
        return (
          <Row onClick={() => p.setLanguage(l)} key={l.key}>
            {l.title}
          </Row>
        );
      })}
      <Row onClick={p.onChangeLanguages}>Sprachen anpassen</Row>
    </Box>
  );
};
export default LanguageSwitch;
