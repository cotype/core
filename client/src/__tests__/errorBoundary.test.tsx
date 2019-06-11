jest.mock("../Header", () => ({
  HEIGHT: 50
}));
jest.mock("../basePath", () => "");

import React from "react";
import { render } from "@testing-library/react";
import ErrorBoundary from "../ErrorBoundary";

beforeEach(() => {
  // when the error's thrown a bunch of console.errors are called even though
  // the error boundary handles the error. This makes the test output noisy,
  // so we'll mock out console.error
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

test("catches error and renders that there was a problem", async () => {
  const Foo = () => {
    throw new Error("NOPE");
  };
  const { container } = render(
    <ErrorBoundary>
      <Foo />
    </ErrorBoundary>
  );

  expect(container).toHaveTextContent(/ups, something went wrong/i);
});
