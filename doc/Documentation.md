# Main endpoints

This technical documentation describes the payment integration process using Server-to-Server (S2S) flows and embedded checkout, including authentication, charge creation, payment link generation, refund processing, and transactional state validation.
---

## POST /api/v1/auth/login

Description
- Authenticates a user with access credentials and returns a token to consume protected endpoints.
- Typical use: obtain an `accessToken` or equivalent token to send later in the `Authorization: Bearer <token>` header for endpoints such as charges and refunds.

Headers
- Content-Type: application/json (required)

Path params
- Not applicable.

Request body (JSON)
- email: string (required)
  - Email address of the user authorized to sign in.
  - Must have a valid email format.

- password: string (required)
  - User password.
  - Must be sent only through secure channels and must not be exposed in public frontend code, logs, or repositories.

Example request (curl)
```bash
curl -sS -X POST 'https://sandbox.magictronicplanet.com/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"dashboard.user@example.com","password":"sQT1<c2KRz!mWD3"}'
```

Response (200 OK)
- JSON with authentication data.
- Typical fields:
  - accessToken / token: string (access token to use as a Bearer token)
  - tokenType: string (e.g. Bearer)
  - expiresIn: number (expiration time in seconds, if applicable)
  - refreshToken: string (if the flow supports it)
  - user / roles / permissions: optional information about the authenticated user

Response codes
- 200: Authentication successful
- 400: Validation error (missing email or password, invalid format)
- 401: Invalid credentials
- 403: User has no permissions or account is blocked
- 429: Rate limit exceeded
- 500: Internal error

Usage notes
- The obtained token must be sent to protected endpoints using the `Authorization: Bearer <token>` header.
- Store the token only for the time needed and renew it when it expires.
- Do not version real credentials or print passwords or tokens in logs.
- In backend integrations, credentials should be handled through environment variables or a secrets manager.

---

## POST /api/v1/charges/merchant/{merchantId}

Description
- Creates/processes a charge (S2S payment intent) for the merchant identified by `{merchantId}`.
- Typical use: create a payment intent that returns a `paymentUrl` or intent information to continue the payment flow.

Headers
- Authorization: Bearer <token> (required)
- Idempotency-Key: <string> (optional): if sent, it will be propagated to avoid duplicates.

Path params
- merchantId (string): merchant identifier (alphanumeric/underscore format, 10..50 chars).

Request body (JSON)
- amount: number (long, required)
  - Represents the amount in minor units accepted by the system (cents), according to the contract.
  - Validation: must be positive (>0).

- currency: string (optional, default "USD")
  - Format: only "USD" or "EUR" are accepted. Example: "USD", "EUR".

- description: string (required)
  - Max. 250 characters.

- redirectUrl / successUrl / failureUrl / cancelUrl: string (optional)
  - Max. 500 characters. Redirect URLs depending on the flow.

- orderId: string (required)
  - Max. 100 characters. Customer order identifier: the main way the merchant identifies the operation. It is recommended to always send it; it is indexed and used for searches.

- idempotencyKey: string (optional)
  - Max. 255 characters. Used for client-level idempotency.

- customer: object (optional)
  - name: string (max. 255)
  - email: string (max. 255)
  - phone: string (max. 50)

Example request (curl)
```bash
# Export TOKEN before running (e.g. LOGIN_RESP...)
export TOKEN="<ACCESS_TOKEN>"

curl -sS -X POST "https://sandbox.magictronicplanet.com/api/v1/charges/merchant/{merchantId}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: your-idempotency-key" \
  -d '{"amount":10000,"currency":"USD","description":"Purchase #12345","orderId":"ORD-12345","successUrl":"https://example.com/success","failureUrl":"https://example.com/failure","customer":{"name":"Juan Perez","email":"juan@example.com"}}' | jq .
```

Response (200 OK)
- JSON with intent data / immediate result.
- Typical fields:
  - intentId: number
  - transactionId: string (internal id like TRX-...)
  - paymentUrl: string (if applicable)
  - status: string (e.g. CREATED, PENDING, SUCCEEDED)
  - providerResponse: string (raw PSP information)

Response codes
- 200: Processed / intent created successfully
- 400: Validation error (required fields, formats, ranges)
- 403: Invalid token or insufficient permissions
- 404: Merchant not found
- 429: Rate limit exceeded
- 500: Internal error

Usage notes
- The `orderId` can be used for dashboard searches. If frequent searches by `orderId` are expected, consider indexing it in the database.
- It is recommended to send `Idempotency-Key` in batches or requests that may be retried by the client.

---

## POST /api/v1/refunds/merchant/{merchantId}

Description
- Requests a refund for a previously processed transaction. The merchant is identified by `{merchantId}`, and the refund is associated with an existing `transactionId`.

Headers
- Authorization: Bearer <token> (required)

Path params
- merchantId (string): merchant identifier (alphanumeric/underscore format, 10..50 chars).

Request body (JSON)
- transactionId: string (optional but recommended)
  - Identifier of the transaction to refund. If omitted, the endpoint may require another identification method depending on the flow.
  - Size: 1..100 chars. Only alphanumeric characters, hyphens, and underscores.

- description: string (optional)
  - Max. 500 characters. Free text with accents allowed.

- amount: decimal (required)
  - Range: minimum 0.01, maximum 999999.99. Up to 2 decimals.

- currency: string (required)
  - Only "USD" or "EUR" are accepted.

Example request (curl)
```bash
export TOKEN="<ACCESS_TOKEN>"

curl -sS -X POST "https://sandbox.magictronicplanet.com/api/v1/refunds/merchant/{merchantId}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"TRX-20260509134034-mct82-1","amount":100.00,"currency":"USD","description":"Refund for product return"}' | jq .
```

Response (200 OK)
- Returns a result object of type `TransactionResponse` with main fields:
  - success: boolean
  - transactionId: string (id generated for the refund)
  - status: string (e.g. REFUNDED, REFUND_FAILED)
  - amount: decimal
  - currency: string
  - pspProvider: string (provider that processed the refund)
  - errorMessage / errorCode: present in case of failure
  - cardBrand, lastFourDigits: optional data from the original payment method

Response codes
- 200: Refund processed (or accepted for asynchronous processing)
- 400: Validation failed (amount out of range, missing currency, invalid transactionId)
- 403: Invalid token or insufficient permissions
- 404: Transaction or merchant not found
- 429: Rate limit exceeded
- 500: Internal error

Usage notes
- The `amount` must be expressed in major units with up to 2 decimals.
- The service validates that the `transactionId` exists and belongs to the merchant (according to the company resolved from the token).
- Refunds may be processed synchronously or asynchronously depending on the PSP; the response contains information indicating whether the refund was completed or queued.



Contact
- For questions about specific fields or validations, contact the backend team responsible for the service.

---

## Embedded framework

The embedded framework allows a payment to be started from the merchant backend and displays the provider form inside an `iframe` controlled by the checkout's main window. It keeps credentials, tokens, and idempotency rules on the server, while the frontend consumes only a temporary `paymentUrl` or `providerUrl`.

### Full embedded payment flow

The embedded flow is made up of six stages:

1. Order preparation in `index.html`.
2. S2S intent creation through `server.js`.
3. Immediate or deferred reception of the `paymentUrl` / `providerUrl`.
4. Rendering the link inside the `iframe`.
5. Result notification through `postMessage`.
6. Final status confirmation from the backend.

### Role of `index.html`

`index.html` acts as the reference client for the embedded flow. Its main responsibilities are:

- Capture the minimum order, customer, and return URL data.
- Call `POST /checkout/pay/{merchantId}` without exposing service credentials.
- Render `providerUrl` or `paymentUrl` inside an `iframe`.
- Maintain a list of allowed origins to validate incoming messages.
- Listen for window `message` events and react to success, error, or cancellation states.

### Role of `server.js`

`server.js` acts as the merchant backend for the S2S and embedded flow. Its main responsibilities are:

- Read sensitive configuration from environment variables (`GATEWAY_BASE_URL`, `AUTH_URL`, `CLIENT_ID`, `CLIENT_SECRET`, `GATEWAY_URL`).
- Obtain the service token from the authentication endpoint and cache it until expiration.
- Expose `POST /checkout/pay/:merchantId` as a secure endpoint so the frontend can request intent creation.
- Validate and normalize data received from the frontend, especially `customer.name`, `customer.email`, `currency`, and the idempotency key.
- Normalize the gateway response to a stable payload with `providerUrl`, `paymentUrl`, `transactionId`, `status`, `intentId`, `expiresAt`, and `idempotencyKey`.
- Return `202` when the intent was created but the provider link is not yet available.

To complete the embedded flow end to end, the backend must also provide a payment link lookup route by `transactionId` and a return bridge route to emit `postMessage` when the provider redirects to `successUrl`, `failureUrl`, or `cancelUrl`.

### Payment link generation and consumption

The payment link is generated in the gateway when the backend creates the payment intent. The request is made with a service token and `Idempotency-Key`; if `orderId` exists, it is recommended to associate the idempotency key with that identifier to avoid duplicate charges during retries.

The frontend consumes the link only after receiving it from the backend:

- If the response includes `providerUrl`, it is used as the preferred provider URL.
- If the response includes `paymentUrl`, it can be used as an equivalent alternative when applicable.
- If no link is immediately available, the backend may return `202` with `transactionId` to allow a later lookup.
- Once obtained, the link is assigned to `iframe.src`.
- The `iframe` must be restricted with `sandbox` and explicit permissions, for example `allow-forms`, `allow-scripts`, `allow-same-origin`, `allow-top-navigation`, `allow-popups`, and `allow="payment"`.

### Communication with `postMessage`

Communication between the `iframe` and the main window is done with `window.postMessage` to report the payment result without depending only on visual redirects.

#### Message origin

- The main window must accept messages only if `event.source` matches the active `iframe` `contentWindow`.
- The origin (`event.origin`) must belong to the authorized provider, the merchant's local bridge, or an explicit list of allowed origins.
- In development, a local origin such as `http://localhost:3000` may exist; in production, exact and controlled origins must be used.

#### Main events

- Success:
  - `status: "success"`
  - `event: "payment.success"`
  - `event: "success"`
  - `event` or `type`: `"embedded_payment_success"`

- Error or failure:
  - `status: "failure"` or `status: "error"`
  - `event: "payment.failure"`
  - `event: "payment.error"`

- Cancellation:
  - `status: "cancel"`
  - `event: "payment.cancel"`

#### State handling

- Success: mark the event as processed to avoid double execution, show visual confirmation, redirect to `successUrl` if applicable, and request final confirmation from the backend.
- Error or failure: show a controlled message, redirect to `failureUrl` if applicable, and record the state for reconciliation.
- Cancellation: return to checkout or to `cancelUrl` without automatically creating a new charge.
- Pending or unknown: keep the operation in a verifiable state and confirm with the backend before updating the order.

---

## How to consume the service

### S2S flow (Server to Server)

The S2S flow keeps sensitive logic in the merchant backend. It is the recommended flow to create payment intents, protect credentials, and maintain idempotency control.

#### Step by step

1. The merchant backend obtains an access token through `POST /api/v1/auth/login` or through the service token flow configured for S2S integrations.
2. The backend receives or builds the internal order with `orderId`, `amount`, `currency`, `description`, customer data, and return URLs.
3. The backend validates the payload, defines the idempotency key, and calls `POST /api/v1/charges/merchant/{merchantId}`.
4. The backend stores `intentId`, `transactionId`, `status`, and the received link together with the local order.
5. The backend responds to the consuming channel with the minimum data needed to continue.
6. The backend confirms the final status through webhook, status lookup, or internal reconciliation before marking the order as paid.

#### Merchant backend responsibilities

In addition to following the charge endpoint contract, the backend must:

- Keep passwords, `CLIENT_SECRET`, and tokens out of the browser.
- Verify that `merchantId`, `orderId`, and the local order are consistent.
- Persist the relationship between `orderId`, `transactionId`, and `intentId`.
- Handle `202` states, PSP errors, rate limits, and retries.
- Confirm the final status on the server before releasing products, services, or balances.

### Embedded flow

The embedded flow reuses the S2S flow to create the intent and adds an iframe-based frontend experience.

#### Step by step

1. The frontend calls the merchant backend with the order data.
2. The backend executes the S2S flow and returns the link or a pending `transactionId`.
3. The frontend renders the link in the `iframe` and listens for the result with `postMessage`.
4. The backend verifies the final status and updates the local order.

#### Frontend <-> backend interaction

The frontend starts the experience and shows immediate states, but it does not authenticate against the gateway or decide the definitive order status. That confirmation belongs to the backend.

---

## Text-based logical diagram

1. The merchant requests the payment link.
   - S2S: the request starts in the backend.
   - Embedded: the frontend requests it from the backend.

2. The backend validates the order, authenticates the service, and creates the intent.

3. The gateway returns `paymentUrl` / `providerUrl` or a pending state with `transactionId`.

4. The link is consumed.
   - S2S: the backend delivers it to the channel defined by the merchant.
   - Embedded: `index.html` renders it inside an `iframe`.

5. The provider processes the payment.

6. The result is notified.
   - S2S: confirmation by webhook, status lookup, or reconciliation.
   - Embedded: notification to the main window through `postMessage`.

7. The backend confirms the final status and updates the order.
