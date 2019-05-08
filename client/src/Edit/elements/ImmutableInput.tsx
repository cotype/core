import React from "react";

import inputs from "./inputs";
import outputs from "./outputs";

export default function ImmutableInput({ field, form, type, child, ...rest }) {
  if (form.initialValues[field.name] == null) {
    const Input = inputs.get(child);
    return <Input {...rest} {...child} field={field} form={form} />;
  }

  const Output = outputs.get(child);

  return (
    <Output data-name={field.name} {...rest} {...child} value={field.value} />
  );
}

ImmutableInput.validate = (value, { child, ...rest }) => {
  const Input = inputs.get(child);

  return Input.validate(value, { ...rest, ...child });
};
