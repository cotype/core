jest.mock("react-day-picker/lib/style.css");
jest.mock("react-router-dom", () => ({ Link: () => "Link" }));

import React from "react";
import { render, fireEvent, waitForElement } from "@testing-library/react";
import ScheduleModal from "../Schedule";
import ModelPathsContext from "../../ModelPathsContext";

const conflictingRef = {
  id: 117,
  model: "index",
  type: "content",
  title: "Startseite",
  kind: "Startseite"
};

it("should display ConflictDialog on schedule error", async () => {
  const onSchedule = jest.fn(async () =>
    Promise.reject({
      body: {
        conflictingRefs: [conflictingRef]
      }
    })
  );
  const { findByText } = render(
    <ModelPathsContext.Provider
      value={{
        modelPaths: { [conflictingRef.model]: "/test" },
        baseUrls: {} as any
      }}
    >
      <ScheduleModal
        schedule={{ visibleFrom: null, visibleUntil: null }}
        onClose={jest.fn()}
        onSchedule={onSchedule}
      />
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
