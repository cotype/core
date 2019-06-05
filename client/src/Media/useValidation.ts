import { useState, useMemo } from "react";

export default function useValidation(
  validator: (files: File[]) => Promise<boolean>
): [File[] | undefined, (files: File[]) => void, () => void] {
  const [fileState, setValidatedFiles] = useState<File[]>();
  const setFiles = useMemo(
    () => async (files: File[]) => {
      if (await validator(files)) {
        setValidatedFiles(files);
      } else {
        alert("File doesn't match requirements");
      }
    },
    [validator, setValidatedFiles]
  );
  const reset = useMemo(() => () => setValidatedFiles(undefined), [
    setValidatedFiles
  ]);

  return [fileState, setFiles, reset];
}
