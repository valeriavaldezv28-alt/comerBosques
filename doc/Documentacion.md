# Endpoints principales

Esta documentación técnica describe el proceso de integración de pagos mediante flujos Server-to-Server (S2S) y checkout embebido, incluyendo autenticación, creación de cargos, generación de payment links, procesamiento de reembolsos y validación de estados transaccionales.

---

## POST /api/v1/auth/login

Descripción
- Autentica a un usuario mediante credenciales de acceso y devuelve un token para consumir endpoints protegidos.
- Uso típico: obtener un `accessToken` o token equivalente para enviarlo posteriormente en el header `Authorization: Bearer <token>` de endpoints como cargos y reembolsos.

Headers
- Content-Type: application/json (requerido)

Path params
- No aplica.

Request body (JSON)
- email: string (requerido)
  - Correo del usuario autorizado para iniciar sesión.
  - Debe tener formato de email válido.

- password: string (requerido)
  - Contraseña del usuario.
  - Debe enviarse únicamente desde canales seguros y no debe exponerse en frontend público, logs o repositorios.

Ejemplo request (curl)
```bash
curl -sS -X POST 'https://sandbox.magictronicplanet.com/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"dashboard.user@example.com","password":"sQT1<c2KRz!mWD3"}'
```

Respuesta (200 OK)
- JSON con los datos de autenticación.
- Campos típicos:
  - accessToken / token: string (token de acceso que debe usarse como Bearer token)
  - tokenType: string (p.ej. Bearer)
  - expiresIn: number (tiempo de expiración en segundos, si aplica)
  - refreshToken: string (si el flujo lo soporta)
  - user / roles / permissions: información opcional del usuario autenticado

Codigos de respuesta
- 200: Autenticación correcta
- 400: Error de validación (email o password ausentes, formato inválido)
- 401: Credenciales inválidas
- 403: Usuario sin permisos o cuenta bloqueada
- 429: Rate limit excedido
- 500: Error interno

Notas de uso
- El token obtenido debe enviarse en los endpoints protegidos usando el header `Authorization: Bearer <token>`.
- Se recomienda almacenar el token solo durante el tiempo necesario y renovarlo cuando expire.
- No se recomienda versionar credenciales reales ni imprimir contraseñas o tokens en logs.
- En integraciones backend, las credenciales deben manejarse mediante variables de entorno o un gestor de secretos.

---

## POST /api/v1/charges/merchant/{merchantId}

Descripción
- Crea/procesa un cargo (S2S payment intent) para el merchant identificado por `{merchantId}`.
- Uso típico: crear un payment intent que devuelva una `paymentUrl` o información de la intención
  para continuar el flujo de pago.

Headers
- Authorization: Bearer <token> (requerido)
- Idempotency-Key: <string> (opcional) — si se envía, se propagará para evitar duplicados.

Path params
- merchantId (string) — identificador del merchant (formato alfanumérico/underscore, 10..50 chars).

Request body (JSON)
- amount: number (long, requerido)
  - Representa la cantidad en unidades menores aceptadas por el sistema (cents) según contrato.
  - Validación: debe ser positivo (>0).

- currency: string (opcional, por defecto "USD")
  - Formato: solo se aceptan "USD" o "EUR" (dólares o euros). Ej: "USD", "EUR".

- description: string (requerido)
  - Máx. 250 caracteres.

- redirectUrl / successUrl / failureUrl / cancelUrl: string (opcionales)
  - Máx. 500 caracteres. URLs para redirección dependiendo del flujo.

 - orderId: string (requerido)
  - Máx. 100 caracteres. Identificador de orden del cliente — forma principal en que el merchant
    identifica la operación. Se recomienda enviarlo siempre; se indexa y se usa para búsquedas.

- idempotencyKey: string (opcional)
  - Máx. 255 caracteres. Para idempotencia a nivel de cliente.

- customer: object (opcional)
  - name: string (máx. 255)
  - email: string (máx. 255)
  - phone: string (máx. 50)

Ejemplo request (curl)
```bash
# Exporta TOKEN antes de ejecutar (ej: LOGIN_RESP...)
export TOKEN="<ACCESS_TOKEN>"

curl -sS -X POST "https://sandbox.magictronicplanet.com/api/v1/charges/merchant/{merchantId}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: your-idempotency-key" \
  -d '{"amount":10000,"currency":"USD","description":"Compra #12345","orderId":"ORD-12345","successUrl":"https://example.com/success","failureUrl":"https://example.com/failure","customer":{"name":"Juan Perez","email":"juan@example.com"}}' | jq .
```

Respuesta (200 OK)
- JSON con los datos de la intención / resultado inmediato.
- Campos típicos:
  - intentId: number
  - transactionId: string (id interno tipo TRX-...)
  - paymentUrl: string (si aplica)
  - status: string (p.ej. CREATED, PENDING, SUCCEEDED)
  - providerResponse: string (información cruda del PSP)

Codigos de respuesta
- 200: Procesado / intent creado correctamente
- 400: Error de validación (campos obligatorios, formatos, rangos)
- 403: Token inválido o sin permisos
- 404: Merchant no encontrado
- 429: Rate limit excedido
- 500: Error interno

Notas de uso
- El `orderId` puede usarse para búsquedas en el dashboard. Si se espera buscar por `orderId` frecuentemente,
  considerar indexarlo en la base de datos.
- Se recomienda enviar `Idempotency-Key` en remesas que puedan reintentarse por el cliente.

---

## POST /api/v1/refunds/merchant/{merchantId}

Descripción
- Solicita un reembolso para una transacción previamente procesada. El merchant se identifica mediante
  `{merchantId}` y el reembolso se asocia a una `transactionId` existente.

Headers
- Authorization: Bearer <token> (requerido)

Path params
- merchantId (string) — identificador del merchant (formato alfanumérico/underscore, 10..50 chars).

Request body (JSON)
- transactionId: string (opcional pero recomendado)
  - Identificador de la transacción a reembolsar. Si se omite, el endpoint puede requerir otra forma de
    identificación dependiendo del flujo.
  - Tamaño: 1..100 chars. Solo caracteres alfanuméricos, guiones y guiones bajos.

- description: string (opcional)
  - Máx. 500 caracteres. Texto libre con acentos permitidos.

- amount: decimal (requerido)
  - Rango: mínimo 0.01, máximo 999999.99. Hasta 2 decimales.

- currency: string (requerido)
  - Solo se aceptan "USD" o "EUR" (dólares o euros).

Ejemplo request (curl)
```bash
export TOKEN="<ACCESS_TOKEN>"

curl -sS -X POST "https://sandbox.magictronicplanet.com/api/v1/refunds/merchant/{merchantId}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"TRX-20260509134034-mct82-1","amount":100.00,"currency":"USD","description":"Reembolso por devolución del producto"}' | jq .
```

Respuesta (200 OK)
- Devuelve un objeto de resultado tipo `TransactionResponse` con campos principales:
  - success: boolean
  - transactionId: string (id generado para el reembolso)
  - status: string (p.ej. REFUNDED, REFUND_FAILED)
  - amount: decimal
  - currency: string
  - pspProvider: string (proveedor que procesó el reembolso)
  - errorMessage / errorCode: presentes en caso de fallo
  - cardBrand, lastFourDigits: datos opcionales del método original

Codigos de respuesta
- 200: Reembolso procesado (o aceptado para procesamiento asíncrono)
- 400: Validación fallida (monto fuera de rango, currency ausente, transactionId inválido)
- 403: Token inválido o sin permisos
- 404: Transacción o merchant no encontrado
- 429: Rate limit excedido
- 500: Error interno

Notas de uso
- El `amount` debe expresarse en unidades principales con hasta 2 decimales.
- El servicio valida que la `transactionId` exista y pertenezca al merchant (según compañía resuelta desde el token).
- Los reembolsos pueden procesarse de forma síncrona o asíncrona según el PSP; la respuesta contiene
  información que indica si el reembolso fue completado o quedado en cola.



Contacto
- Para dudas sobre campos específicos o validaciones, contacta al equipo de backend responsable.

---

## Framework embebido

El framework embebido permite iniciar un pago desde el backend del comercio y presentar el formulario del proveedor dentro de un `iframe` controlado por la ventana principal del checkout. Mantiene las credenciales, tokens y reglas de idempotencia en el servidor, mientras el frontend consume únicamente un `paymentUrl` o `providerUrl` temporal.

### Flujo completo del pago embebido

El flujo embebido se compone de seis etapas:

1. Preparación de la orden en `index.html`.
2. Creación S2S de la intención mediante `server.js`.
3. Recepción inmediata o diferida del `paymentUrl` / `providerUrl`.
4. Renderizado del link dentro del `iframe`.
5. Notificación del resultado mediante `postMessage`.
6. Confirmación final del estado desde el backend.

### Rol de `index.html`

`index.html` funciona como cliente de referencia para el flujo embebido. Sus responsabilidades principales son:

- Capturar los datos mínimos de la orden, del cliente y de las URLs de retorno.
- Invocar `POST /checkout/pay/{merchantId}` sin exponer credenciales de servicio.
- Renderizar `providerUrl` o `paymentUrl` dentro de un `iframe`.
- Mantener una lista de orígenes permitidos para validar mensajes entrantes.
- Escuchar eventos `message` de la ventana y reaccionar ante estados de éxito, error o cancelación.

### Rol de `server.js`

`server.js` actúa como backend del comercio para el flujo S2S y embebido. Sus responsabilidades principales son:

- Leer configuración sensible desde variables de entorno (`GATEWAY_BASE_URL`, `AUTH_URL`, `CLIENT_ID`, `CLIENT_SECRET`, `GATEWAY_URL`).
- Obtener el token de servicio desde el endpoint de autenticación y cachearlo hasta su expiración.
- Exponer `POST /checkout/pay/:merchantId` como endpoint seguro para que el frontend solicite la creación de la intención.
- Validar y normalizar datos recibidos desde el frontend, especialmente `customer.name`, `customer.email`, `currency` y la llave de idempotencia.
- Normalizar la respuesta del gateway a un payload estable con `providerUrl`, `paymentUrl`, `transactionId`, `status`, `intentId`, `expiresAt` e `idempotencyKey`.
- Responder `202` cuando la intención fue creada pero el link del proveedor aún no está disponible.

Para completar el flujo embebido de extremo a extremo, el backend debe disponer además de una ruta de consulta del payment link por `transactionId` y una ruta bridge de retorno para emitir `postMessage` cuando el proveedor redirige a `successUrl`, `failureUrl` o `cancelUrl`.

### Generación y consumo del payment link

El payment link se genera en el gateway cuando el backend crea la intención de pago. La solicitud se realiza con token de servicio e `Idempotency-Key`; si existe `orderId`, se recomienda asociar la llave de idempotencia a ese identificador para evitar cargos duplicados en reintentos.

El frontend consume el link únicamente después de recibirlo desde el backend:

- Si la respuesta incluye `providerUrl`, se usa como URL preferida del proveedor.
- Si la respuesta incluye `paymentUrl`, se puede usar como alternativa equivalente cuando aplique.
- Si no hay link inmediato, el backend puede responder `202` con `transactionId` para habilitar una consulta posterior.
- Una vez obtenido, el link se asigna a `iframe.src`.
- El `iframe` debe limitarse con `sandbox` y permisos explícitos, por ejemplo `allow-forms`, `allow-scripts`, `allow-same-origin`, `allow-top-navigation`, `allow-popups` y `allow="payment"`.

### Comunicación con `postMessage`

La comunicación entre el `iframe` y la ventana principal se realiza con `window.postMessage` para informar el resultado del pago sin depender únicamente de redirecciones visuales.

#### Origen del mensaje

- La ventana principal debe aceptar mensajes solo si `event.source` corresponde al `contentWindow` del `iframe` activo.
- El origen (`event.origin`) debe pertenecer al proveedor autorizado, al bridge local del comercio o a una lista explícita de orígenes permitidos.
- En desarrollo puede existir un origen local como `http://localhost:3000`; en producción se deben usar orígenes exactos y controlados.

#### Eventos principales

- Éxito:
  - `status: "success"`
  - `event: "payment.success"`
  - `event: "success"`
  - `event` o `type`: `"embedded_payment_success"`

- Error o fallo:
  - `status: "failure"` o `status: "error"`
  - `event: "payment.failure"`
  - `event: "payment.error"`

- Cancelación:
  - `status: "cancel"`
  - `event: "payment.cancel"`

#### Manejo de estados

- Éxito: marcar el evento como procesado para evitar doble ejecución, mostrar confirmación visual, redirigir a `successUrl` si aplica y solicitar confirmación final al backend.
- Error o fallo: mostrar un mensaje controlado, redirigir a `failureUrl` si aplica y registrar el estado para conciliación.
- Cancelación: regresar al checkout o a `cancelUrl` sin crear un nuevo cargo automáticamente.
- Pendiente o desconocido: mantener la operación en estado verificable y confirmar con el backend antes de actualizar la orden.

---

## Cómo consumir el servicio

### Flujo S2S (Server to Server)

El flujo S2S concentra la lógica sensible en el backend del comercio. Es el flujo recomendado para crear intenciones de pago, proteger credenciales y mantener control de idempotencia.

#### Paso a paso

1. El backend del comercio obtiene un token de acceso mediante `POST /api/v1/auth/login` o mediante el flujo de token de servicio configurado para integraciones S2S.
2. El backend recibe o construye la orden interna con `orderId`, `amount`, `currency`, `description`, datos del cliente y URLs de retorno.
3. El backend valida el payload, define la llave de idempotencia y llama a `POST /api/v1/charges/merchant/{merchantId}`.
4. El backend almacena `intentId`, `transactionId`, `status` y el link recibido junto con la orden local.
5. El backend responde al canal consumidor con los datos mínimos necesarios para continuar.
6. El backend confirma el estado final mediante webhook, consulta de estado o conciliación interna antes de marcar la orden como pagada.

#### Responsabilidades del backend del comercio

Además de respetar el contrato del endpoint de cargos, el backend debe:

- Mantener contraseñas, `CLIENT_SECRET` y tokens fuera del navegador.
- Verificar que `merchantId`, `orderId` y la orden local sean coherentes.
- Persistir la relación entre `orderId`, `transactionId` e `intentId`.
- Manejar estados `202`, errores del PSP, rate limits y reintentos.
- Confirmar el estado final en el servidor antes de liberar productos, servicios o saldos.

### Flujo embebido

El flujo embebido reutiliza el flujo S2S para crear la intención y agrega una experiencia frontend basada en `iframe`.

#### Paso a paso

1. El frontend llama al backend del comercio con los datos de la orden.
2. El backend ejecuta el flujo S2S y devuelve el link o un `transactionId` pendiente.
3. El frontend renderiza el link en el `iframe` y escucha el resultado con `postMessage`.
4. El backend verifica el estado final y actualiza la orden local.

#### Interacción frontend ↔ backend

El frontend inicia la experiencia y muestra estados inmediatos, pero no autentica contra el gateway ni decide el estado definitivo de la orden. Esa confirmación pertenece al backend.

---

## Diagrama lógico en texto

1. El comercio solicita el payment link.
   - S2S: la solicitud nace en el backend.
   - Embebido: el frontend la solicita al backend.

2. El backend valida la orden, autentica el servicio y crea la intención.

3. El gateway devuelve `paymentUrl` / `providerUrl` o un estado pendiente con `transactionId`.

4. Se consume el link.
   - S2S: el backend lo entrega al canal definido por el comercio.
   - Embebido: `index.html` lo renderiza dentro de un `iframe`.

5. El proveedor procesa el pago.

6. Se notifica el resultado.
   - S2S: confirmación por webhook, consulta de estado o conciliación.
   - Embebido: notificación hacia la ventana principal mediante `postMessage`.

7. El backend confirma el estado final y actualiza la orden.
