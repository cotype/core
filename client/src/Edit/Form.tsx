import * as Cotype from "../../../typings";
import React, { Component, Fragment } from "react";
import { Formik, FormikActions, FormikProps } from "formik";
import { Prompt, RouteComponentProps } from "react-router-dom";
import { withModelPaths } from "../ModelPathsContext";
import api from "../api";
import { Page, Cols, Content } from "../common/page";
import Sidebar from "./ActionBar";
import History from "./History";
import Schedule from "../common/Schedule";
import { Input } from "./elements";
import { titleCase } from "title-case";
import { getPreviewUrl } from "../utils/helper";
import styled from "styled-components/macro";
import LanguageModal from "./LanguageModal";
import { Language } from "../../../typings";

export const errorClass = "error-field-label";

const NewTag = styled("div")`
  color: var(--accent-color);
  font-size: 1.4em;
  text-transform: uppercase;
  font-style: italic;
  margin-top: -1.4em;
  padding-left: 24px;
`;

type Props = RouteComponentProps & {
  clone?: string;
  id?: string;
  model: Cotype.Model;
  versions?: (Cotype.VersionItem & { published: boolean })[];
  onSave?: (record: { id: string; isUpdate: boolean; data: any }) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onPublish?: () => void;
  onUnpublish: () => void;
  modelPaths: Cotype.ModelPaths;
  baseUrls: Cotype.BaseUrls;
  languages: Cotype.Language[] | null;
};

type State = {
  initialData?: any;
  schedule?: any;
  modal: null | "history" | "schedule";
  language: Cotype.Language | null;
  documentLanguages: Cotype.Language[] | null;
  langModalOpen: boolean;
};

class Form extends Component<Props, State> {
  state: State = {
    modal: null,
    language: this.props.languages ? this.props.languages[0] : null,
    documentLanguages: this.props.languages ? [this.props.languages[0]] : null,
    langModalOpen: false
  };
  componentDidMount() {
    this.initForm();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.id !== prevProps.id) {
      this.initForm();
    }
  }

  initForm = () => {
    const { clone, id, model, history, languages } = this.props;
    const contentId = clone || id;
    if (id && history.location.state) {
      // Hack to show tokens that have been generated by the server
      // The state is set in List.onSave() when changing the url to /edit/{id}
      this.setState({ initialData: history.location.state });
      history.replace(history.location.pathname, null);
    } else if (contentId) {
      this.fetchData(contentId);
    } else {
      this.setState({
        initialData: Input.getDefaultValue(model, languages && [languages[0]])
      });
    }
  };

  fetchData = (id: string) => {
    const { model } = this.props;
    if (id) {
      api.load(model, id).then(res => {
        const { data, visibleFrom, visibleUntil, activeLanguages } = res;
        this.setState({
          initialData: data,
          schedule: { visibleFrom, visibleUntil },
          documentLanguages:
            this.props.languages?.filter(l =>
              activeLanguages?.includes(l.key)
            ) || null,
          language:
            this.props.languages?.filter(l =>
              activeLanguages?.includes(l.key)
            )[0] || null
        });
      });
    }
  };

  restore = (rev: string, setValues: (values: any) => void) => {
    const { model, id } = this.props;
    if (id && rev) {
      api.loadVersion(model, id, rev).then(({ data }) => {
        setValues(data);
      });
    }
    this.setState({ modal: null });
  };

  onPreview = (
    form: FormikProps<any>,
    modelPreviewUrl: string | { [langKey: string]: string },
    language?: Language | null
  ) => {
    const { baseUrls } = this.props;
    const previewUrl = getPreviewUrl(
      form.values,
      `${baseUrls.preview ? baseUrls.preview : ""}${
        typeof modelPreviewUrl === "string"
          ? modelPreviewUrl
          : modelPreviewUrl[
              language ? language.key : Object.keys(modelPreviewUrl)[0]
            ]
      }`,
      language
    );
    if (previewUrl) window.open(previewUrl);
  };

  submit = (form: any) => {
    form.validateForm().then((errors: object) => {
      const fields = Object.keys(errors);
      const fieldCount = fields.length;
      if (fieldCount) {
        const { model } = this.props;
        const fieldNames = Object.keys(errors).map((e, idx) => {
          const { label } = model.fields[e];
          const separator = idx < fieldCount - 1 ? `,` : `!`;
          return `${label || titleCase(e)}${separator}`;
        });

        const error = `Please fix errors in the following field${
          fieldCount === 1 ? "" : "s"
        }: ${fieldNames}`;

        const errorElement: HTMLElement | null = document.querySelector(
          `.${errorClass}`
        );

        if (errorElement) {
          errorElement.scrollIntoView({
            behavior: "smooth",
            inline: "center"
          });
        }
        setTimeout(() => {
          alert(error);
        }, 400);
      } else {
        form.submitForm();
      }
    });
  };

  onSubmit = (
    values: object,
    { setSubmitting, setFieldError }: FormikActions<any>
  ) => {
    const { model, id, onSave } = this.props;
    api
      .save(
        model,
        id,
        values,
        this.state.documentLanguages?.map(l => l.key)
      )
      .then(res => {
        const {
          id: savedId,
          data,
          visibleFrom = null,
          visibleUntil = null
        } = res;

        setSubmitting(false);
        this.setState({
          initialData: data,
          schedule: { visibleFrom, visibleUntil }
        });
        if (onSave)
          onSave({
            id: savedId,
            data,
            isUpdate: !!id
          });
      })
      .catch(err => {
        const { status } = err;
        if (status === 409) {
          setSubmitting(false);
          const { uniqueErrors, message }: any = err.body;
          if (message) {
            alert(message);
          } else if (uniqueErrors) {
            uniqueErrors.forEach(e =>
              setFieldError(
                e.field,
                `This field value needs to be unique, but exists already on another ${model.singular}!`
              )
            );
          }
        } else {
          setSubmitting(false);
          alert("Something went wrong while submitting the form");
        }
      });
  };

  get isNew() {
    const { id, clone } = this.props;
    return !id || clone;
  }

  get hasSchedule() {
    const { schedule } = this.state;
    return schedule && (schedule.visibleFrom || schedule.visibleUntil);
  }

  setLanguage = (lang: Cotype.Language) => {
    this.setState({ language: lang });
  };
  setDocumentLanguages = (langs: Cotype.Language[]) => {
    this.setState({ documentLanguages: langs, language: langs[0] });
  };
  openLangModal = () => {
    this.setState({ langModalOpen: true });
  };
  closeLangModal = () => {
    this.setState({ langModalOpen: false });
  };

  render() {
    const {
      model,
      id,
      clone,
      versions,
      onDuplicate,
      onDelete,
      onPublish,
      onUnpublish
    } = this.props;

    const { modal, initialData } = this.state;
    if (!initialData) {
      return null;
    }
    return (
      <Formik
        initialValues={initialData}
        validateOnChange={false}
        validateOnBlur={false}
        enableReinitialize
        onSubmit={this.onSubmit}
        render={(form: FormikProps<any>) => {
          const {
            dirty,
            handleSubmit,
            isSubmitting,
            isValid,
            errors,
            setValues
          } = form;

          return (
            <Fragment>
              {id && modal === "history" && (
                <History
                  model={model}
                  id={id}
                  versions={versions}
                  onUnpublish={onUnpublish}
                  onRestore={rev => this.restore(rev, setValues)}
                  onClose={() => this.setState({ modal: null })}
                />
              )}
              {id && modal === "schedule" && (
                <Schedule
                  schedule={this.state.schedule}
                  onClose={() => this.setState({ modal: null })}
                  onSchedule={schedule => {
                    return api.schedule(model, id, schedule).then(() => {
                      this.setState({ modal: null, schedule });
                    });
                  }}
                />
              )}
              <Sidebar
                isNew={!id}
                isDirty={dirty || !!clone}
                isSubmitting={isSubmitting}
                hasSchedule={this.hasSchedule}
                model={model}
                versions={versions}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onPublishChange={onPublish}
                onUnpublish={onUnpublish}
                onPreview={() => {
                  if (model.urlPath) {
                    this.onPreview(form, model.urlPath, this.state.language);
                  }
                }}
                onHistory={() => {
                  this.setState({ modal: "history" });
                }}
                onSchedule={() => {
                  this.setState({ modal: "schedule" });
                }}
                submitForm={() => {
                  this.submit(form);
                }}
                hasErrors={!isValid}
                errors={errors as any}
                setLanguage={this.setLanguage}
                language={this.state.language}
                documentLanguages={this.state.documentLanguages}
                openLanguageModal={this.openLangModal}
              />
              <Page id="edit-form">
                <form onSubmit={handleSubmit}>
                  <Prompt
                    when={dirty}
                    message="There are changes that have not been saved. Is it ok to leave the page?"
                  />
                  <Cols>
                    <Content style={{ padding: 0, width: "100%" }}>
                      {this.isNew && <NewTag>new</NewTag>}
                      <Input
                        key={id || "new"}
                        fields={model.fields}
                        form={form}
                        model={model}
                        id={id}
                        i18n={model.i18n}
                        activeLanguages={this.state.documentLanguages}
                        activeLanguage={this.state.language}
                      />
                      {this.props.languages &&
                        this.state.documentLanguages &&
                        this.state.langModalOpen && (
                          <LanguageModal
                            onSave={this.setDocumentLanguages}
                            onClose={this.closeLangModal}
                            model={model}
                            activeLanguages={this.state.documentLanguages}
                            languages={this.props.languages}
                          />
                        )}
                    </Content>
                  </Cols>
                </form>
              </Page>
            </Fragment>
          );
        }}
      />
    );
  }
}

export default withModelPaths(Form);
