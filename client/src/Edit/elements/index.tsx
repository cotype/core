import SlugInput from "./SlugInput";

import TextInput from "./TextInput";
import TextOutput from "./TextOutput";

import TextAreaInput from "./TextAreaInput";

import NumberInput from "./NumberInput";

import RichTextInput from "./RichTextInput";
import RichTextOutput from "./RichTextOutput";

import ListInput from "./lists/Input";
import ListOutput from "./lists/Output";

import UnionInput from "./UnionInput";
import UnionOutput from "./UnionOutput";

import ObjectInput from "./ObjectInput";
import ObjectOutput from "./ObjectOutput";

import OptionsInput from "./OptionsInput";
import OptionsOutput from "./OptionsOutput";

import MapInput from "./MapInput";

import MediaInput from "./MediaInput";
import MediaOutput from "./MediaOutput";

import BooleanInput from "./BooleanInput";
import BooleanOutput from "./BooleanOutput";

import ReferenceInput from "./ReferenceInput";
import ReferenceOutput from "./ReferenceOutput";

import SingleReferenceInput from "./SingleReferenceInput";
import SingleReferenceOutput from "./SingleReferenceOutput";

import DateInput from "./DateInput";
import DateOutput from "./DateOutput";

import ImmutableInput from "./ImmutableInput";
import ImmutableOutput from "./ImmutableOutput";

import inputs from "./inputs";
import outputs from "./outputs";
import PositionInput from "./PositionInput";
import I18nInput from "./I18nInput";
import I18nOutput from "./I18nOutput";

const Empty: React.FC = () => null;

inputs.register({
  boolean: BooleanInput,
  content: ReferenceInput,
  external: ReferenceInput,
  list: ListInput,
  map: MapInput,
  media: MediaInput,
  object: ObjectInput,
  richtext: RichTextInput,
  select: OptionsInput,
  settings: SingleReferenceInput,
  slug: SlugInput,
  string: TextInput,
  union: UnionInput,
  number: NumberInput,
  date: DateInput,
  textarea: TextAreaInput,
  immutable: ImmutableInput,
  position: PositionInput,
  virtual: Empty,
  i18n: I18nInput
});

outputs.register({
  boolean: BooleanOutput,
  content: ReferenceOutput,
  external: ReferenceOutput,
  list: ListOutput,
  media: MediaOutput,
  object: ObjectOutput,
  richtext: RichTextOutput,
  select: OptionsOutput,
  settings: SingleReferenceOutput,
  string: TextOutput,
  number: TextOutput,
  union: UnionOutput,
  date: DateOutput,
  textarea: TextOutput,
  immutable: ImmutableOutput,
  position: TextOutput,
  virtual: Empty,
  i18n: I18nOutput
});

export const Input = ObjectInput;
export const Output = ObjectOutput;
