import React from "react";
import { Input, Label } from "./styles";

type Props = {
  label: string;
  field: any;
  style: any;
};
export default function(props: Props) {
  const { label, field, style } = props;
  return (
    <div style={style}>
      <Label>{label}</Label>
      <Input type="text" {...field} placeholder={label} />
    </div>
  );
}
