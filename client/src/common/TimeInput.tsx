import React, { Component } from "react";
import { css } from "react-emotion";

import { inputClass } from "./styles";

const timeInputClass = css`
  ${inputClass}
  width: 5em;
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
`;

const regexp = /^\d{0,2}?\:?\d{0,2}$/;

const isValidHour = (h: any) => Number.isInteger(h) && h >= 0 && h < 24;

const isValidMinutes = (m: any) =>
  (Number.isInteger(m) && m >= 0 && m < 60) || Number.isNaN(m);

type Props = {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
};

type State = {
  value: string;
};

export default class TimeInput extends Component<Props, State> {
  state = {
    value: this.props.value || "00:00"
  };

  lastVal = "";

  isValid(val) {
    if (!regexp.test(val)) return false;

    const [hh, mm] = val.split(":");
    const hours = Number(hh);
    const minutes = Number(mm);

    if (!isValidHour(hours) || !isValidMinutes(minutes)) {
      return false;
    }

    // first mm digit must be <= 5
    if (minutes < 10 && Number(mm[0]) > 5) return false;

    return true;
  }

  onChange(value: string) {
    if (value === this.state.value) return;
    if (this.isValid(value)) {
      if (
        value.length === 2 &&
        this.lastVal.length !== 3 &&
        !value.includes(":")
      ) {
        value += ":";
      }

      if (value.length === 2 && this.lastVal.length === 3) {
        value = value.slice(0, 1);
      }

      if (value.length > 5) {
        return false;
      }

      this.lastVal = value;
      this.setState({ value });

      if (value.length === 5) {
        const { onChange } = this.props;
        if (onChange) onChange(value);
      }
    }
  }

  render() {
    return (
      <input
        className={timeInputClass}
        type="tel"
        value={this.state.value}
        placeholder={this.props.placeholder}
        onChange={e => this.onChange(e.target.value)}
      />
    );
  }
}
