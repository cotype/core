import mock from "xhr-mock";
import React from "react";
import {
  render,
  fireEvent,
  waitForDomChange,
  act
} from "@testing-library/react";
import api from "../../api";
import { UploadProvider, createXhrClient } from "react-use-upload";
import UploadZone, { Props as UploadZoneProps } from "../UploadZone";
import { testable } from "../../utils/helper";

const TEST_ID = "uploadzonetest";
const createFile = (name: string, size: number, type: string) => {
  const file = new File([], name, { type });
  Object.defineProperty(file, "size", {
    get() {
      return size;
    }
  });
  return file;
};

function renderUploadZone(customProps: Partial<UploadZoneProps> = {}) {
  const defaultProps = {
    className: "foo",
    multiple: false,
    activeClass: "bar",
    onUpload: jest.fn(),
    render: jest.fn(p => <div {...testable(TEST_ID)}>{JSON.stringify(p)}</div>)
  };

  const props = {
    ...defaultProps,
    ...customProps
  };

  const queries = render(
    <UploadProvider client={createXhrClient({ baseUrl: api.baseURI })}>
      <UploadZone {...props} />
    </UploadProvider>
  );

  return { ...queries, props };
}

function loggable(config: object) {
  config!.toString = () => JSON.stringify(config);

  return config;
}

function onAlert() {
  const g = global as any;
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error("alert has not been called within 2s"));
    }, 2000);
    const alert = (message: any) => {
      clearTimeout(t);
      resolve(message);
    };
    if (g.alert) {
      jest.spyOn(g, "alert").mockImplementation(alert);
    } else {
      g.alert = alert;
    }
  });
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

  it("uploads a file and provides meta info to child render fn", async () => {
    const {
      getByTestId,
      props: { render: renderChild }
    } = renderUploadZone();
    mock.post("/rest/upload", {
      status: 200,
      body: "Foo"
    });
    const container = getByTestId(TEST_ID);

    fireEvent.drop(container, { target: { files } });
    await waitForDomChange({ container });

    const firstCall = renderChild.mock.calls[0][0];
    expect(firstCall).toEqual(
      expect.objectContaining({
        onFiles: expect.any(Function)
      })
    );
    expect(firstCall.progress).toBeFalsy();
    expect(firstCall.complete).toBeFalsy();

    const secondCall = renderChild.mock.calls[1][0];
    expect(secondCall).toEqual(
      expect.objectContaining({
        files
      })
    );
    expect(firstCall.progress).toBeFalsy();
    expect(firstCall.complete).toBeFalsy();

    const thirdCall = renderChild.mock.calls[2][0];
    expect(thirdCall).toEqual(
      expect.objectContaining({
        progress: expect.anything()
      })
    );
    expect(thirdCall.complete).toBeFalsy();
    expect(thirdCall.response).toBeFalsy();
    expect(thirdCall.status).toBeFalsy();

    const fourthCall = renderChild.mock.calls[3][0];
    expect(fourthCall).toEqual(
      expect.objectContaining({
        complete: true,
        status: 200,
        response: "Foo"
      })
    );
  });

  it("exposes a manual upload handler to child render", async () => {
    const {
      getByTestId,
      props: { render: renderChild }
    } = renderUploadZone();
    mock.post("/rest/upload", {
      status: 200,
      body: "{}"
    });

    renderChild.mock.calls[0][0].onFiles(files);
    await waitForDomChange({ container: getByTestId(TEST_ID) });

    expect(renderChild).toHaveBeenCalledWith(
      expect.objectContaining({
        complete: true
      })
    );
  });

  it("calls onUpload prop when upload is done", async () => {
    const {
      getByTestId,
      props: { onUpload }
    } = renderUploadZone();
    const container = getByTestId(TEST_ID);
    mock.post("/rest/upload", {
      status: 200,
      body: "Bar"
    });

    fireEvent.drop(container, { target: { files } });
    await waitForDomChange({ container: getByTestId(TEST_ID) });

    expect(onUpload).toHaveBeenCalledWith("Bar");
  });

  describe("with mediaType check", () => {
    it("disallows upload of media types that does not match", async () => {
      const { getByTestId } = renderUploadZone({ mediaType: "image" });
      const container = getByTestId(TEST_ID);

      fireEvent.drop(container, { target: { files } });
      const message = await onAlert();

      expect(message).toBe("File doesn't match requirements");
    });

    it("allows upload of media types that do match", async () => {
      const {
        getByTestId,
        props: { onUpload }
      } = renderUploadZone({ mediaType: "pdf" });
      const container = getByTestId(TEST_ID);
      mock.post("/rest/upload", {
        status: 200,
        body: ""
      });

      fireEvent.drop(container, { target: { files } });
      await waitForDomChange({ container: getByTestId(TEST_ID) });

      expect(onUpload).toHaveBeenCalled();
    });

    it("allows upload of any media types when check is 'all'", async () => {
      const {
        getByTestId,
        props: { onUpload }
      } = renderUploadZone({ mediaType: "all", multiple: true });
      files.push(createFile("foo.png", 200, "image/png"));
      const container = getByTestId(TEST_ID);
      mock.post("/rest/upload", {
        status: 200,
        body: ""
      });

      fireEvent.drop(container, { target: { files } });
      await waitForDomChange({ container: getByTestId(TEST_ID) });

      expect(onUpload).toHaveBeenCalled();
    });
  });

  describe("with mediaFilter on image/png of size 1500", () => {
    let png: File[];

    beforeEach(() => {
      jest.spyOn(global as any, "Image").mockImplementationOnce(() => {
        const img: any = {};

        Object.defineProperty(img, "src", {
          set() {
            Promise.resolve().then(() => {
              img.naturalHeight = 100;
              img.naturalWidth = 100;
              img.onload();
            });
          }
        });

        return img;
      });
      png = [createFile("file1.png", 1500, "image/png")];
    });

    describe.each([
      [loggable({ mimeType: "image/png" }), true],
      [loggable({ mimeType: "image/*" }), true],
      [loggable({ mimeType: "application/pdf" }), false],
      [loggable({ mimeType: "application/*" }), false],
      [loggable({ maxSize: 1000 }), false],
      [loggable({ maxSize: 2000 }), true],
      [loggable({ minHeight: 200 }), false],
      [loggable({ minHeight: 50 }), true],
      [loggable({ maxHeight: 200 }), true],
      [loggable({ maxHeight: 50 }), false],
      [loggable({ minWidth: 200 }), false],
      [loggable({ minWidth: 50 }), true],
      [loggable({ maxWidth: 200 }), true],
      [loggable({ maxWidth: 50 }), false]
    ])("%s", (mediaFilter, expected) => {
      it(`${expected ? "" : "dis"}allows upload`, async () => {
        const {
          getByTestId,
          props: { onUpload }
        } = renderUploadZone({
          mediaFilter: mediaFilter as any
        });
        const container = getByTestId(TEST_ID);

        fireEvent.drop(container, { target: { files: png } });

        if (!expected) {
          expect(await onAlert()).toBe("File doesn't match requirements");
        } else {
          mock.post("/rest/upload", {
            status: 200,
            body: ""
          });
          await waitForDomChange({ container });
          expect(onUpload).toHaveBeenCalled();
        }
      });
    });
  });
});
