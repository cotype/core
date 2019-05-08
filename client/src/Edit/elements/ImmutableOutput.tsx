import React from "react";

import outputs from "./outputs";

export default function ImmutableOutput({ type, child, ...rest }) {
  const Output = outputs.get(child);

  return <Output {...child} {...rest} />;
}
