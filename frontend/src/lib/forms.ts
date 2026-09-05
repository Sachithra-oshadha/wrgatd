/**
 * register() options for numeric inputs.
 *
 * An empty <input type="number"> yields "", which Number() would turn into
 * 0 - recording "0% complete" when the user meant "not filled in". These
 * helpers convert at the register boundary so the form state always holds
 * a real number, null, or NaN, and the Zod schema can stay a plain
 * z.number() with matching input and output types.
 */

/** "" -> null. Use for fields the schema marks .nullable(). */
export const optionalNumberField = {
  setValueAs: (value: unknown): number | null =>
    value === "" || value === null || value === undefined
      ? null
      : Number(value),
};

/** "" -> NaN, which z.number() rejects with the field's own message. */
export const requiredNumberField = {
  setValueAs: (value: unknown): number =>
    value === "" || value === null || value === undefined
      ? Number.NaN
      : Number(value),
};
