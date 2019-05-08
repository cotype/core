import React from "react";
import { Page, Center } from "./common/page";

export default function Empty() {
  return (
    <Page>
      <Center>
        <h1>Hello!</h1>
        <p>
          Please, select the content you would like to edit in the left sidebar.
        </p>
      </Center>
    </Page>
  );
}
