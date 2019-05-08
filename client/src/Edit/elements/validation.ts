export const required = (
  value: string | number,
  { required: isRequired }: { required?: boolean | undefined }
) => {
  if (isRequired && !value) {
    return "This field is required";
  }
};
