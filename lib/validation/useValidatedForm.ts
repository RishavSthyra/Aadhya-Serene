"use client";

import { useMemo, useState } from "react";
import {
  getFormFieldErrors,
  getVisibleFieldErrors,
  touchAllFields,
} from "@/lib/validation/enquiry";

type FormValues = Record<string, unknown>;
type FieldErrors = Record<string, string>;
type TouchedFields = Record<string, boolean>;
type SanitizerMap = Record<string, (value: string) => string>;

function createInitialTouchedState(values: FormValues) {
  return Object.keys(values).reduce<TouchedFields>((accumulator, key) => {
    accumulator[key] = false;
    return accumulator;
  }, {});
}

export function useValidatedForm<TSchema extends { safeParse: (values: unknown) => any }>({
  initialValues,
  schema,
  sanitizers = {},
}: {
  initialValues: FormValues;
  schema: TSchema;
  sanitizers?: SanitizerMap;
}) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [touched, setTouched] = useState<TouchedFields>(
    createInitialTouchedState(initialValues)
  );
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  const clientErrors = useMemo(() => getFormFieldErrors(schema as never, values), [schema, values]);

  const visibleErrors = useMemo(
    () => ({
      ...getVisibleFieldErrors(clientErrors, touched),
      ...serverErrors,
    }),
    [clientErrors, serverErrors, touched]
  );

  function clearServerError(fieldName: string) {
    setServerErrors((current) => {
      if (!current[fieldName]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  }

  function setFieldValue(fieldName: string, rawValue: string) {
    const sanitizer = sanitizers[fieldName];
    const nextValue = sanitizer ? sanitizer(rawValue) : rawValue;

    setValues((current) => ({
      ...current,
      [fieldName]: nextValue,
    }));
    clearServerError(fieldName);
  }

  function setFieldTouched(fieldName: string) {
    setTouched((current) => ({
      ...current,
      [fieldName]: true,
    }));
  }

  function setTouchedFields(nextTouched: TouchedFields) {
    setTouched(nextTouched);
  }

  function applyServerErrors(fieldErrors: FieldErrors = {}) {
    setServerErrors(fieldErrors);
    setTouched((current) => ({
      ...touchAllFields(values),
      ...current,
    }));
  }

  function resetForm(nextValues: FormValues = initialValues) {
    setValues(nextValues);
    setTouched(createInitialTouchedState(nextValues));
    setServerErrors({});
  }

  function validateForm() {
    const parseResult = schema.safeParse(values);

    setTouched(touchAllFields(values));

    if (parseResult.success) {
      setServerErrors({});
    }

    return parseResult;
  }

  return {
    values,
    touched,
    clientErrors,
    visibleErrors,
    setValues,
    setFieldValue,
    setFieldTouched,
    setTouchedFields,
    applyServerErrors,
    resetForm,
    validateForm,
  };
}
