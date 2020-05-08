import mock from "xhr-mock";
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import api from "../../api";
import { UploadProvider, createXhrClient } from "react-use-upload";
import Topbar, { Props as TopbarProps } from "../Topbar";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Media", value: "media" }
];
const ORDERS = [
  { label: "Date", value: "date" },
  { label: "Name", value: "name" }
];

const createFile = (name: string, size: number, type: string) => {
  const file = new File([], name, { type });
  Object.defineProperty(file, "size", {
    get() {
      return size;
    }
  });
  return file;
};

function renderTopbar(customProps: Partial<TopbarProps> = {}) {
  const props = {
    onFilterChange: jest.fn(),
    onSearch: jest.fn(),
    filters: FILTERS,
    orderBys: ORDERS,
    onOrderByChange: jest.fn(),
    onOrderChange: jest.fn(),
    onUpload: jest.fn(),
    onUploadProgress: jest.fn(),
    onUnUsedChange: jest.fn(),
  };

  const queries = render(
    <UploadProvider client={createXhrClient({ baseUrl: api.baseURI })}>
      <div>
        <Topbar {...props} />
      </div>
    </UploadProvider>
  );

  return { ...queries, props };
}

describe("UploadZone", () => {
  let files: File[];
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {
      /* https://github.com/facebook/react/issues/14769 */
    });
    files = [createFile("file1.pdf", 1111, "application/pdf")];
    mock.setup();
  });
  afterEach(() => mock.teardown());

  it("uploads file", async () => {
    const {
      getByText,
      props: { onUpload, onUploadProgress }
    } = renderTopbar();

    mock.post("/rest/upload", {
      status: 200,
      body: "Foo"
    });

    let uploadButton = getByText("Upload New");
    uploadButton = uploadButton.closest("button") as HTMLElement;
    const uploadInput = uploadButton.nextSibling as HTMLElement;
    fireEvent.change(uploadInput, { target: { files } });

/*    await wait(() =>
      expect(onUploadProgress).toHaveBeenCalledWith(expect.any(Number)) //TODO: Could not test, because upload return NaN for MockFiles
    );*/
    await waitFor(() => expect(onUpload).toHaveBeenCalledWith("Foo"));
  });
});
