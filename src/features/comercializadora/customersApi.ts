const CUSTOMERS_BASE = "/api/customers";
const PUBLIC_REGISTRATION_ENDPOINTS = ["/api/customers/register", CUSTOMERS_BASE] as const;

export type CustomerAddress = {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  references?: string;
};

export type CustomerFormValues = {
  fullName: string;
  phone: string;
  merchantKey: string;
  address: CustomerAddress;
  termsAccepted: boolean;
};

export type RegisteredCustomer = CustomerFormValues & {
  id: string;
  createdAt: string;
  updatedAt?: string;
  status?: "active" | "inactive" | "Activo" | "Inactivo" | string;
};

export type CustomerValidationErrors = Partial<
  Record<keyof CustomerFormValues | keyof CustomerAddress, string>
>;

export const emptyCustomerFormValues: CustomerFormValues = {
  fullName: "",
  phone: "",
  merchantKey: "",
  termsAccepted: false,
  address: {
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Mexico",
    references: "",
  },
};

const requiredError = (labelEs: string, labelEn: string) =>
  `${labelEs} es obligatorio. / ${labelEn} is required.`;

const parseErrorMessage = async (res: Response) => {
  try {
    const body = (await res.json()) as { message?: string; error?: string; detail?: string };
    return body.message ?? body.error ?? body.detail ?? `Error ${res.status}`;
  } catch {
    return `Error ${res.status}`;
  }
};

const assertOk = async (res: Response) => {
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
};

const toStringValue = (value: unknown) => (typeof value === "string" ? value : "");

export const normalizeCustomerFormValues = (values: CustomerFormValues): CustomerFormValues => ({
  fullName: values.fullName.trim(),
  phone: values.phone.trim(),
  merchantKey: values.merchantKey.trim(),
  termsAccepted: values.termsAccepted,
  address: {
    street: values.address.street.trim(),
    number: values.address.number.trim(),
    neighborhood: values.address.neighborhood.trim(),
    city: values.address.city.trim(),
    state: values.address.state.trim(),
    postalCode: values.address.postalCode.trim(),
    country: values.address.country.trim(),
    references: values.address.references?.trim() || undefined,
  },
});

export const validateCustomerFormValues = (
  values: CustomerFormValues,
  options: { requireTerms?: boolean } = {},
): CustomerValidationErrors => {
  const normalizedValues = normalizeCustomerFormValues(values);
  const errors: CustomerValidationErrors = {};

  if (!normalizedValues.fullName) {
    errors.fullName = requiredError("El nombre completo", "Full name");
  }

  if (!normalizedValues.phone) {
    errors.phone = requiredError("El telefono WhatsApp", "WhatsApp phone");
  } else if (!/^\+[1-9]\d{7,14}$/.test(normalizedValues.phone)) {
    errors.phone =
      "Usa formato E.164, por ejemplo +5215512345678. / Use E.164 format, for example +5215512345678.";
  }

  if (!normalizedValues.merchantKey) {
    errors.merchantKey = requiredError("La empresa o comercio", "Business or merchant");
  }

  if (!normalizedValues.address.street) {
    errors.street = requiredError("La calle", "Street");
  }

  if (!normalizedValues.address.number) {
    errors.number = requiredError("El numero exterior/interior", "Exterior/interior number");
  }

  if (!normalizedValues.address.neighborhood) {
    errors.neighborhood = requiredError("La colonia", "Neighborhood");
  }

  if (!normalizedValues.address.city) {
    errors.city = requiredError("La ciudad", "City");
  }

  if (!normalizedValues.address.state) {
    errors.state = requiredError("El estado", "State");
  }

  if (!normalizedValues.address.postalCode) {
    errors.postalCode = requiredError("El codigo postal", "Postal code");
  }

  if (!normalizedValues.address.country) {
    errors.country = requiredError("El pais", "Country");
  }

  if (options.requireTerms && !normalizedValues.termsAccepted) {
    errors.termsAccepted =
      "Debes aceptar los terminos para continuar. / You must accept the terms to continue.";
  }

  return errors;
};

export const getCustomerAddressLine = (address: CustomerAddress) =>
  [address.street, address.number, address.neighborhood].filter(Boolean).join(", ");

export const mapCustomerToFormValues = (customer: RegisteredCustomer): CustomerFormValues => ({
  fullName: customer.fullName,
  phone: customer.phone,
  merchantKey: customer.merchantKey,
  termsAccepted: customer.termsAccepted,
  address: {
    street: customer.address.street,
    number: customer.address.number,
    neighborhood: customer.address.neighborhood,
    city: customer.address.city,
    state: customer.address.state,
    postalCode: customer.address.postalCode,
    country: customer.address.country,
    references: customer.address.references ?? "",
  },
});

const normalizeCustomerFromApi = (customer: Record<string, unknown>): RegisteredCustomer => {
  const address = (customer.address ?? {}) as Record<string, unknown>;
  const createdAt = toStringValue(customer.createdAt) || toStringValue(customer.registeredAt) || new Date().toISOString();

  return {
    id: toStringValue(customer.id) || toStringValue(customer.customerId) || toStringValue(customer.phone),
    fullName: toStringValue(customer.fullName) || toStringValue(customer.name),
    phone: toStringValue(customer.phone) || toStringValue(customer.whatsappPhone),
    merchantKey: toStringValue(customer.merchantKey) || toStringValue(customer.merchant),
    termsAccepted: Boolean(customer.termsAccepted ?? true),
    createdAt,
    updatedAt: toStringValue(customer.updatedAt) || undefined,
    status: toStringValue(customer.status) || "active",
    address: {
      street: toStringValue(address.street),
      number: toStringValue(address.number),
      neighborhood: toStringValue(address.neighborhood),
      city: toStringValue(address.city),
      state: toStringValue(address.state),
      postalCode: toStringValue(address.postalCode),
      country: toStringValue(address.country),
      references: toStringValue(address.references) || undefined,
    },
  };
};

const parseCustomersResponse = async (res: Response): Promise<RegisteredCustomer[]> => {
  await assertOk(res);
  const body = (await res.json()) as unknown;
  const rawCustomers = Array.isArray(body)
    ? body
    : Array.isArray((body as { customers?: unknown[] }).customers)
      ? (body as { customers: unknown[] }).customers
      : Array.isArray((body as { items?: unknown[] }).items)
        ? (body as { items: unknown[] }).items
        : [];

  return rawCustomers
    .filter((customer): customer is Record<string, unknown> => Boolean(customer) && typeof customer === "object")
    .map(normalizeCustomerFromApi);
};

export const fetchCustomers = (): Promise<RegisteredCustomer[]> =>
  fetch(CUSTOMERS_BASE).then(parseCustomersResponse);

export const createCustomer = async (values: CustomerFormValues): Promise<void> => {
  const response = await fetch(CUSTOMERS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizeCustomerFormValues(values)),
  });
  await assertOk(response);
};

export const registerCustomer = async (values: CustomerFormValues): Promise<void> => {
  const payload = normalizeCustomerFormValues(values);
  let notFoundError: Error | null = null;

  for (const endpoint of PUBLIC_REGISTRATION_ENDPOINTS) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status === 404) {
      notFoundError = new Error(await parseErrorMessage(response));
      continue;
    }

    await assertOk(response);
    return;
  }

  throw notFoundError ?? new Error("Error 404");
};

export const updateCustomer = async (id: string, values: CustomerFormValues): Promise<void> => {
  const response = await fetch(`${CUSTOMERS_BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizeCustomerFormValues(values)),
  });
  await assertOk(response);
};

export const deleteCustomer = async (id: string): Promise<void> => {
  const response = await fetch(`${CUSTOMERS_BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  await assertOk(response);
};
