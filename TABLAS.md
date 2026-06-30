# Tabla merchan

## Nombre sugerido

`merchan`

## Descripcion

Tabla para almacenar los clientes registrados desde el formulario publico o desde la administracion interna.

## Campos

| Campo | Tipo sugerido | Obligatorio | Descripcion |
| --- | --- | --- | --- |
| `id` | `VARCHAR(64)` | Si | Identificador unico del cliente. Puede generarse como UUID o por el backend. |
| `fullName` | `VARCHAR(160)` | Si | Nombre completo del cliente. |
| `phone` | `VARCHAR(20)` | Si | Telefono WhatsApp en formato E.164, por ejemplo `+5215512345678`. |
| `merchantKey` | `VARCHAR(80)` | Si | Clave, nombre corto o identificador del comercio/empresa relacionada. |
| `termsAccepted` | `BOOLEAN` | Si | Indica si el cliente acepto los terminos al registrarse. |
| `status` | `VARCHAR(20)` | Si | Estado del cliente. Valores sugeridos: `active`, `inactive`. |
| `street` | `VARCHAR(140)` | Si | Calle del domicilio del cliente. |
| `number` | `VARCHAR(40)` | Si | Numero exterior y/o interior. |
| `neighborhood` | `VARCHAR(120)` | Si | Colonia o barrio. |
| `city` | `VARCHAR(100)` | Si | Ciudad o municipio. |
| `state` | `VARCHAR(100)` | Si | Estado. |
| `postalCode` | `VARCHAR(12)` | Si | Codigo postal. |
| `country` | `VARCHAR(80)` | Si | Pais del domicilio. Valor por defecto sugerido: `Mexico`. |
| `references` | `VARCHAR(255)` | No | Referencias adicionales del domicilio. |
| `createdAt` | `DATETIME` | Si | Fecha y hora de creacion del registro en formato ISO 8601. |
| `updatedAt` | `DATETIME` | No | Fecha y hora de la ultima actualizacion en formato ISO 8601. |

## Reglas de validacion

- `fullName`, `phone`, `merchantKey` y los campos obligatorios del domicilio no deben estar vacios.
- `phone` debe guardarse en formato E.164.
- `termsAccepted` debe ser `true` cuando el registro venga del formulario publico.
- `status` debe iniciar como `active` para clientes nuevos.
- `references` puede omitirse cuando no exista informacion adicional.

## JSON de ejemplo

```json
{
  "id": "customer-001",
  "fullName": "Maria Fernanda Lopez",
  "phone": "+5215512345678",
  "merchantKey": "bosques-central",
  "termsAccepted": true,
  "status": "active",
  "address": {
    "street": "Av. Bosques",
    "number": "120 Int. 4",
    "neighborhood": "Lomas Verdes",
    "city": "Naucalpan",
    "state": "Estado de Mexico",
    "postalCode": "53120",
    "country": "Mexico",
    "references": "Frente al parque principal"
  },
  "createdAt": "2026-06-29T10:30:00.000Z",
  "updatedAt": "2026-06-29T10:30:00.000Z"
}
```

## Respuesta esperada al listar clientes

```json
{
  "customers": [
    {
      "id": "customer-001",
      "fullName": "Maria Fernanda Lopez",
      "phone": "+5215512345678",
      "merchantKey": "bosques-central",
      "termsAccepted": true,
      "status": "active",
      "address": {
        "street": "Av. Bosques",
        "number": "120 Int. 4",
        "neighborhood": "Lomas Verdes",
        "city": "Naucalpan",
        "state": "Estado de Mexico",
        "postalCode": "53120",
        "country": "Mexico",
        "references": "Frente al parque principal"
      },
      "createdAt": "2026-06-29T10:30:00.000Z",
      "updatedAt": "2026-06-29T10:30:00.000Z"
    }
  ]
}
```

# Tabla Inventario

## Nombre sugerido

`Inventario`

## Descripcion

Tabla para almacenar los productos del inventario, incluyendo su identificación, clasificación comercial, precios, unidad de stock, cantidades disponibles y movimientos recientes, permitiendo controlar la disponibilidad de mercancía para venta y administración interna.

Cada registro representa un SKU/presentacion con codigo de barras, precio y stock propios, pero puede pertenecer a un mismo producto base. Ejemplo: producto base `Coca-Cola` con variantes `600 ml`, `1.5 L` y `3 L`.
## Campos

| Campo | Descripcion | Longitud | Tipo de dato |
| --- | --- | --- | --- |
| `producto` | Informacion principal mostrada en la tabla: producto base, presentacion, nombre comercial, ID/SKU, codigo de barras e imagen. | 255 | `Object` |
| `productLine` | Producto base o familia comercial. Ejemplo: `Coca-Cola`. | 120 | `String` |
| `presentation` | Variante o presentacion vendible. Ejemplo: `600 ml`, `1.5 L`, `3 L`. | 80 | `String` |
| `stock` | Existencia actual del producto y minimo requerido. Ejemplo: `10 cajas (240 piezas)`, `Min. 5 cajas`. | 80 | `String` |
| `estado` | Estado calculado segun disponibilidad. Valores: `disponible`, `poca disponibilidad`, `agotado`. | 30 | `String` |
| `alerta` | Mensaje de alerta segun el stock. Ejemplo: `Stock suficiente` o `Alerta: 5 cajas o menos`. | 120 | `String` |
| `detalles` | Datos adicionales visibles al abrir "Ver datos": codigo, ID y precio. | 255 | `Object` |
| `acciones` | Acciones disponibles en la tabla: agregar stock, editar o eliminar producto. | 120 | `Array` |

## JSON de ejemplo

```json
{
  "producto": {
    "productLine": "Coca-Cola",
    "presentation": "600 ml",
    "nombre": "Coca-Cola 600 ml",
    "id": "PROD-000001",
    "codigo": "7501055300072",
    "imagenUrl": ""
  },
  "stock": "10 cajas (240 piezas)",
  "estado": "disponible",
  "alerta": "Stock suficiente",
  "detalles": {
    "codigo": "7501055300072",
    "id": "PROD-000001",
    "precio": "$18.00 por pieza"
  },
  "acciones": ["Agregar stock", "Editar", "Eliminar"]
}
```
