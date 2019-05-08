import React from "react";
import { inputClass, labelClass } from "./styles";

type Props = {
  label: string;
  field: any;
  style: any;
};
export default function(props: Props) {
  const { label, field, style } = props;
  return (
    <div style={style}>
      <label className={labelClass}>{label}</label>
      <input
        type="text"
        {...field}
        className={inputClass}
        placeholder={label}
      />
    </div>
  );
}
