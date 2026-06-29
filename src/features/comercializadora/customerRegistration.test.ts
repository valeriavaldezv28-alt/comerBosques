import {
  normalizeCustomerRegistration,
  registerCustomer,
  validateCustomerRegistration,
  type CustomerRegistrationFormValues,
} from "./customerRegistration";

const validValues: CustomerRegistrationFormValues = {
  fullName: "Maria Lopez",
  phone: "+5215512345678",
  merchantKey: "comercializadora-bosques",
  termsAccepted: true,
  address: {
    street: "Av. Siempre Viva",
    number: "123 Int 4",
    neighborhood: "Centro",
    city: "Ciudad de Mexico",
    state: "CDMX",
    postalCode: "06000",
    country: "Mexico",
    references: "Porton verde",
  },
};

describe("customerRegistration", () => {
  it("accepts a complete registration with E.164 phone", () => {
    expect(validateCustomerRegistration(validValues)).toEqual({});
  });

  it("rejects phone numbers outside E.164 format", () => {
    expect(validateCustomerRegistration({ ...validValues, phone: "5512345678" }).phone).toContain(
      "E.164",
    );
  });

  it("requires identity, merchant and address fields", () => {
    const errors = validateCustomerRegistration({
      ...validValues,
      fullName: "",
      merchantKey: "",
      address: {
        street: "",
        number: "",
        neighborhood: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        references: "",
      },
    });

    expect(errors.fullName).toBeTruthy();
    expect(errors.merchantKey).toBeTruthy();
    expect(errors.street).toBeTruthy();
    expect(errors.number).toBeTruthy();
    expect(errors.neighborhood).toBeTruthy();
    expect(errors.city).toBeTruthy();
    expect(errors.state).toBeTruthy();
    expect(errors.postalCode).toBeTruthy();
    expect(errors.country).toBeTruthy();
  });

  it("trims submitted values and removes empty optional references", () => {
    expect(
      normalizeCustomerRegistration({
        ...validValues,
        fullName: "  Maria Lopez  ",
        address: { ...validValues.address, references: "   " },
      }),
    ).toMatchObject({
      fullName: "Maria Lopez",
      address: {
        references: undefined,
      },
    });
  });

  it("falls back to the customers collection endpoint when the register action is missing", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Not found" }), { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(registerCustomer(validValues)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/customers/register",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/customers",
      expect.objectContaining({ method: "POST" }),
    );

    vi.unstubAllGlobals();
  });
});
