import React, { Component } from "react";
import { Formik, FormikActions, FormikProps } from "formik";
import styled from "styled-components/macro";

import api from "../api";
import { Field, Label, Input, Error, Button } from "../common/styles";

const Lock = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
  >
    <path d="M0 0h24v24H0z" fill="none" />
    <path
      d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
      fill="#fff"
    />
  </svg>
);

const Circle = styled("div")`
  width: 42px;
  height: 42px;
  background: var(--accent-color);
  border-radius: 50%;
  margin: auto;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Root = styled("div")`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-image: ${process.env.REACT_APP_TEST_ENV
    ? "none"
    : `url(https://source.unsplash.com/collection/2339015/${
        window.innerWidth
      }x${window.innerHeight})`};
`;

const Form = styled("form")`
  border-radius: 3px;
  background: #fff;
  padding: 30px;
  display: flex;
  flex-direction: column;
  flex-basis: 350px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.25);
`;

type Values = {
  email: string;
  password: string;
};

type Props = {
  onSuccess: (arg: any) => void;
};

export default class Login extends Component<Props> {
  onSubmit = (values: Values, { setSubmitting }: FormikActions<Values>) => {
    api.post("/login", values).then(
      user => {
        setSubmitting(false);
        this.props.onSuccess(user);
      },
      errors => {
        setSubmitting(false);
        // Maybe transform your API's errors into the same shape as Formik's
        // setErrors(transformMyApiErrors(errors));
        console.error("error", errors);
      }
    );
  };

  render() {
    return (
      <Root>
        <Formik
          initialValues={{
            email: "",
            password: ""
          }}
          validate={(values: Values) => {
            // same as above, but feel free to move this into a class method now.
            const errors: any = {};
            if (!values.email) {
              errors.email = "Required";
            } else if (
              !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)
            ) {
              errors.email = "Invalid email address";
            }
            return errors;
          }}
          onSubmit={this.onSubmit}
          render={({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            isSubmitting
          }: FormikProps<Values>) => (
            <Form onSubmit={handleSubmit}>
              <Circle>
                <Lock />
              </Circle>
              <Field>
                <Label>Email</Label>
                <Input
                  type="email"
                  name="email"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.email}
                />
                {touched.email && errors.email && <Error>{errors.email}</Error>}
              </Field>
              <Field>
                <Label>Password</Label>
                <Input
                  type="password"
                  name="password"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.password}
                />
                {touched.password &&
                  errors.password && <Error>{errors.password}</Error>}
              </Field>
              <Button type="submit" disabled={isSubmitting}>
                Login
              </Button>
            </Form>
          )}
        />
      </Root>
    );
  }
}
