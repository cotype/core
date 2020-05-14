import { ModelOpts } from "../../../typings";
import styled from "styled-components";
import React, { useEffect, useState } from "react";
const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  // tslint:disable-next-line:prefer-for-of
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};
const IFrame = styled.iframe`
  width: 100%;
  height: 100%;
`;
export const IFrameView: React.FC<ModelOpts["iframeOptions"]> = props => {
  const [session, setSession] = useState<string>("");

  useEffect(() => {
    const cookie = getCookie("session");
    if (cookie) {
      setSession(cookie);
    }
  }, [setSession]);
  return (
    <IFrame
      src={`${props.url.replace("{sessionID}", session)}`}
      frameBorder={0}
    />
  );
};
