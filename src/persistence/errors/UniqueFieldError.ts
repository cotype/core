export type NonUniqueField = { field: string; existingContentId: string };

export default class UniqueFieldError extends Error {
  nonUniqueFields: NonUniqueField[];

  constructor(nonUniqueFields: NonUniqueField[]) {
    super("Content contains unique field conflicts");
    this.nonUniqueFields = nonUniqueFields;
  }
}
