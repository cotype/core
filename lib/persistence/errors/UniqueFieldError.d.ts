export type NonUniqueField = {
    field: string;
    existingContentId: string;
};
export default class UniqueFieldError extends Error {
    nonUniqueFields: NonUniqueField[];
    constructor(nonUniqueFields: NonUniqueField[]);
}
