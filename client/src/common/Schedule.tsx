import * as Cotype from "../../../typings";
import React, { Component } from "react";
import styled from "styled-components/macro";
import moment from "moment";
import ModalDialog from "./ModalDialog";
import Button from "./Button";
import ToggleSwitch from "./ToggleSwitch";
import { paths } from "./icons";
import DatePicker from "./DatePicker";
import TimeInput from "./TimeInput";

const modalStyle = {
  width: 750,
  height: 500,
  background: "#f5f5f5",
  maxWidth: "90vw",
  maxHeight: "90hw"
};

type Props = Cotype.Schedule & {
  schedule: Cotype.Schedule;
  onClose: () => void;
  onSchedule: (schedule: Cotype.Schedule) => Promise<void | any>;
};

type State = {
  visibleFrom: boolean;
  visibleFromDate: string;
  visibleFromTime: string;
  visibleUntil: boolean;
  visibleUntilDate: string;
  visibleUntilTime: string;
  conflictingRefs: Cotype.VersionItem[] | null;
};

const Row = styled("div")`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 1em;
`;
const Half = styled("div")`
  flex: 0 0 50%;
`;
const Label = styled("span")`
  font-weight: bold;
  margin-left: 1em;
`;

const toIsoDate = (v?: Date | null) => {
  const d = v ? new Date(v) : new Date();
  return d.toISOString();
};

const toTime = (v?: Date | null) => {
  if (!v) return "00:00";
  return moment(v).format("HH:mm");
};

export default class ScheduleModal extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { visibleFrom, visibleUntil } = props.schedule;
    this.state = {
      visibleFrom: !!visibleFrom,
      visibleFromDate: toIsoDate(visibleFrom),
      visibleFromTime: toTime(visibleFrom),
      visibleUntil: !!visibleUntil,
      visibleUntilDate: toIsoDate(visibleUntil),
      visibleUntilTime: toTime(visibleUntil),
      conflictingRefs: null
    };
  }

  get visibleFrom() {
    const { visibleFrom, visibleFromDate, visibleFromTime } = this.state;
    if (!visibleFrom) return null;
    const [hh, mm] = visibleFromTime.split(":").map(Number);
    return moment(visibleFromDate)
      .hours(hh)
      .minutes(mm)
      .toDate();
  }

  get visibleUntil() {
    const { visibleUntil, visibleUntilDate, visibleUntilTime } = this.state;
    if (!visibleUntil) return null;
    const [hh, mm] = visibleUntilTime.split(":").map(Number);
    return moment(visibleUntilDate)
      .hours(hh)
      .minutes(mm)
      .toDate();
  }

  onSchedule = () => {
    const { visibleFrom, visibleUntil } = this;

    this.props
      .onSchedule({
        visibleFrom,
        visibleUntil
      })
      .catch(err => {
        this.setState(() => {
          Object.assign(err.body, { conflictType: "schedule" });
          throw err;
        });
      });
  };

  render() {
    const { onClose } = this.props;
    const {
      visibleFrom,
      visibleFromDate,
      visibleFromTime,
      visibleUntil,
      visibleUntilDate,
      visibleUntilTime
    } = this.state;
    const actionButtons = [
      <Button icon={paths.History} onClick={this.onSchedule}>
        Schedule
      </Button>
    ];

    return (
      <ModalDialog
        title={"Schedule"}
        icon={paths.Calendar}
        onClose={onClose}
        style={modalStyle}
        actionButtons={actionButtons}
      >
        <Row>
          <Half>
            <Row>
              <ToggleSwitch
                on={visibleFrom}
                onClick={() => this.setState({ visibleFrom: !visibleFrom })}
              />
              <Label>Visible From</Label>
            </Row>
            {visibleFrom && (
              <Row>
                <DatePicker
                  value={visibleFromDate}
                  onChange={date => this.setState({ visibleFromDate: date })}
                />
                <TimeInput
                  value={visibleFromTime}
                  placeholder="hh:mm"
                  onChange={time => this.setState({ visibleFromTime: time })}
                />
              </Row>
            )}
          </Half>

          <Half>
            <Row>
              <ToggleSwitch
                on={visibleUntil}
                onClick={() => this.setState({ visibleUntil: !visibleUntil })}
              />
              <Label>Visible Until</Label>
            </Row>
            {visibleUntil && (
              <Row>
                <DatePicker
                  value={visibleUntilDate}
                  onChange={date => this.setState({ visibleUntilDate: date })}
                />
                <TimeInput
                  value={visibleUntilTime}
                  placeholder="hh:mm"
                  onChange={time => this.setState({ visibleUntilTime: time })}
                />
              </Row>
            )}
          </Half>
        </Row>
      </ModalDialog>
    );
  }
}
