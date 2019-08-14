jest.mock("./src/basePath", () => "");
// Hack: Make test work with macros: don't use them.
jest.mock("styled-components/macro", () => require("styled-components"));

import "@testing-library/jest-dom/extend-expect";
