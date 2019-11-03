jest.mock("react-day-picker/lib/style.css");
jest.mock("react-router-dom", () => ({ Link: () => "Link" }));

import React from "react";
import { render, fireEvent, waitForElement } from "@testing-library/react";
import ScheduleModal from "../Schedule";
import ModelPathsContext from "../../ModelPathsContext";
import ContentConstraintsErrorBoundary from "../../Edit/ContentConstraintsErrorBoundary";
import { ApiError } from "../../api";

const conflictingRef = {
  id: 117,
  model: "index",
  type: "content",
  title: "Startseite",
  kind: "Startseite"
};

beforeEach(() => {
  // when the error's thrown a bunch of console.errors are called even though
  // the error boundary handles the error. This makes the test output noisy,
  // so we'll mock out console.error
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

it("should display ConflictDialog on schedule error", async () => {
  const onSchedule = jest.fn(async () =>
    Promise.reject(
      new ApiError({ status: 400 } as Response, {
        conflictingRefs: [conflictingRef]
      })
    )
  );
  const { findByText } = render(
    <ModelPathsContext.Provider
      value={{
        modelPaths: { [conflictingRef.model]: "/test" },
        baseUrls: {} as any
      }}
    >
      <ContentConstraintsErrorBoundary>
        <ScheduleModal
          schedule={{ visibleFrom: null, visibleUntil: null }}
          onClose={jest.fn()}
          onSchedule={onSchedule}
        />
      </ContentConstraintsErrorBoundary>
    </ModelPathsContext.Provider>
  );

  const visibleUntilSlider = await waitForElement(() =>
    findByText(/Visible Until/i).then(e => e.closest("div"))
  );

  fireEvent.click(visibleUntilSlider as Element);

  const scheduleButton = await waitForElement(() =>
    findByText(/schedule/i, { selector: "span" }).then(e => e.closest("button"))
  );

  fireEvent.click(scheduleButton as Element);

  expect(onSchedule).toBeCalledTimes(1);
  expect(
    await waitForElement(() => findByText(/content in use/i))
  ).toBeInTheDocument();
});
