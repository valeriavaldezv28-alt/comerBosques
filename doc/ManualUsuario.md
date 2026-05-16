# Manual de Usuario

## Dashboard Magictronic PSP

**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Sistema:** Magictronic PSP Dashboard

---

## 1. Introducción

El dashboard de Magictronic PSP es una herramienta web diseñada para consultar, monitorear y analizar la operación de pagos de la plataforma. Su objetivo principal es ofrecer a los usuarios autorizados una vista clara del comportamiento transaccional, incluyendo indicadores clave, gráficas operativas, pagos exitosos, intenciones de pago, transacciones rechazadas, devoluciones y transacciones generales.

El sistema permite revisar información diaria, aplicar filtros por fecha, consultar estados de pagos, descargar información en archivos CSV y realizar búsquedas de transacciones específicas desde la barra superior.

Este manual está dirigido a usuarios operativos, administrativos y clientes autorizados que requieren consultar información del dashboard sin necesidad de conocimientos técnicos.

---

## 2. Precondiciones

Antes de utilizar el sistema, se deben cumplir las siguientes condiciones:

| Requisito | Descripción |
| --- | --- |
| Entorno | El sistema funciona en entorno web. No requiere instalación local por parte del usuario final. |
| Navegadores compatibles | Se recomienda usar versiones recientes de Google Chrome, Microsoft Edge, Mozilla Firefox o Safari. |
| Pantalla recomendada | Se recomienda una pantalla de escritorio o laptop con resolución mínima de 1366 x 768 px. También puede utilizarse en tablet o móvil, aunque la experiencia óptima es en escritorio. |
| Conexión a internet | Se requiere conexión estable a internet para iniciar sesión, consultar datos y actualizar la información. |
| Credenciales | El usuario y contraseña serán proporcionados por el administrador. |
| Permisos | El acceso a secciones como Dashboard, Intenciones de pago, Pagos exitosos, Transacciones rechazadas, Devoluciones y Transacciones depende del rol asignado al usuario. |

### Roles de usuario

| Rol | Acceso general |
| --- | --- |
| Administrador | Puede consultar información operativa de la plataforma y acceder a vistas protegidas de pagos y transacciones. |
| Cliente | Puede consultar información permitida de acuerdo con los accesos configurados para su cuenta. |


---

## 3. Inicio de sesión

Para ingresar al sistema:

1. Abra el navegador web.
2. Ingrese la URL proporcionada por el administrador.
3. En la pantalla de inicio de sesión, capture sus credenciales.
4. Presione el botón **Sign in**.

### Campos requeridos

| Campo | Descripción |
| --- | --- |
| Correo electrónico | Usuario asignado para acceder al dashboard. |
| Contraseña | Contraseña asociada a la cuenta del usuario. |

### Acciones disponibles en login

- **Ingresar:** valida las credenciales e inicia la sesión.
- **Mostrar/Ocultar contraseña:** permite verificar el texto capturado en el campo de contraseña.

### Credenciales incorrectas

Si las credenciales son incorrectas, el sistema mostrará un mensaje de error, por ejemplo:

- **Email o contraseña incorrectos.**

En caso de error:

1. Verifique que el correo esté escrito correctamente.
2. Revise que la contraseña no tenga espacios adicionales.
3. Confirme que está usando las credenciales vigentes.
4. Si el problema continúa, contacte al administrador.
## 4. Estructura del dashboard

Después de iniciar sesión correctamente, el usuario accede al dashboard principal. La interfaz se compone de las siguientes áreas:

### 4.1 Menú lateral

El menú lateral permite navegar entre las secciones principales del sistema.

Opciones principales:

| Opción | Descripción |
| --- | --- |
| Dashboard | Muestra los indicadores principales, gráficas y resumen operativo. |
| Intenciones de pago | Permite consultar intenciones de pago registradas. |
| Transacciones rechazadas | Muestra operaciones no autorizadas o con error. |
| Pagos exitosos | Presenta transacciones autorizadas o liquidadas. |
| Devoluciones | Permite consultar devoluciones procesadas. |
| Transacciones | Muestra un listado general de transacciones. |
| Centro de ayuda | Despliega información de soporte y enlaces de ayuda. |
| Cerrar sesión | Finaliza la sesión del usuario. |

En pantallas pequeñas, el menú lateral se abre mediante el botón de menú ubicado en el header.

### 4.2 Header o barra superior

La barra superior contiene:

- Botón para abrir o cerrar el menú en dispositivos móviles.
- Campo de búsqueda de pagos o transacciones exitosas, disponible en el dashboard.
- Selector de idioma.
- Botón de cambio de tema claro/oscuro.
- Identificación del usuario y rol.

El campo de búsqueda acepta identificadores de transacción u orden con formatos válidos, por ejemplo:

- `TRX-AAAAMMDDHHmmss-código-número`
- `ORD-123`

### 4.3 Cards informativas

Las cards muestran indicadores resumidos. Algunos ejemplos son:

| Card | Qué representa |
| --- | --- |
| Volumen Transaccional | Total procesado en el periodo consultado. |
| Operaciones Procesadas | Cantidad total de transacciones u operaciones. |
| Autorizadas | Pagos exitosos. |
| Tasa de Autorización | Relación entre operaciones procesadas y autorizadas. |
| Monto Promedio de Transacción | Valor promedio por operación. |

En vistas de detalle, las cards pueden cambiar para mostrar totales específicos, como número de registros y monto total.

### 4.4 Gráficas

El dashboard incluye gráficas operativas para interpretar el comportamiento transaccional:

| Gráfica | Descripción |
| --- | --- |
| Distribución de transacciones | Muestra la participación de los estados de transacción. |
|  Hora de la plataforma | Indica la hora y fecha operativa en UTC. |
| Pulso horario | Presenta volumen en USD y transacciones autorizadas por hora. |
|Rendimiento de éxito por hora | Muestra transacciones exitosas por hora. |

### 4.5 Tablas

Las tablas presentan información detallada por registro. Dependiendo de la sección, pueden incluir columnas como:

- ID
- ID de orden
- ID de transacción
- Comercio
- Estado
- Fecha
- Monto
- Descripción
- Tarjeta

Cuando existe una gran cantidad de registros, algunas vistas muestran el botón **Cargar más**.

### 4.6 Filtros

Las vistas de pagos incluyen filtros por periodo:

- **Hoy**
- **Ayer**
- **Desde**
- **Hasta**


Después de seleccionar fechas, se debe presionar el botón de verificación con ícono de check (✔️) para aplicar el filtro.

### 4.7 Botones de actualización

En el dashboard principal existe el botón **Actualizar**, que recarga los KPIs y las gráficas disponibles. En las vistas de detalle, aplicar nuevamente fechas o cambiar periodo también actualiza la información consultada.

### Capturas sugeridas

| Captura | Descripción sugerida |
| --- | --- |
| Dashboard principal | Vista con menú lateral, header, cards y gráficas principales. |
| Menú lateral | Opciones de navegación y botón de cerrar sesión. |
| Header | Buscador, selector de idioma, tema y datos del usuario. |
| Tabla de pagos | Vista de registros con filtros y botón Descargar CSV. |
| Centro de ayuda | Panel desplegado con correo de soporte y documentación. |

---

## 5. Funcionalidades principales

### 5.1 Consultar información general del dashboard

1. Inicie sesión.
2. Seleccione la opción **Dashboard** en el menú lateral.
3. Revise las cards informativas ubicadas en la parte superior.
4. Consulte las gráficas para analizar distribución, comportamiento horario y estado operativo.
5. Si necesita datos recientes, presione **Actualizar**.

### 5.2 Consultar intenciones de pago

1. Seleccione **Intenciones de pago** en el menú lateral.
2. Revise las cards de resumen, como registros y monto total.
3. Use los filtros **Hoy**, **Ayer**, **Desde** y **Hasta** para definir el periodo.
4. Seleccione el estado que desea consultar, si aplica.
5. Presione el botón con ícono de check (✔️) para aplicar el filtro.
6. Revise la tabla de resultados.
7. Si existe más información, presione **Cargar más**.
8. Para descargar los registros visibles, presione **Descargar CSV**.

### 5.3 Consultar pagos exitosos

1. Seleccione **Pagos exitosos**.
2. Verifique las cards de total y monto.
3. Seleccione el periodo con **Hoy**, **Ayer** o fechas personalizadas.
4. Seleccione el estado disponible en el filtro.
5. Presione el botón de check (✔️) para actualizar la consulta.
6. Revise la tabla con información de transacción, orden, descripción, tarjeta, estado, fecha y monto.
7. Use **Descargar CSV** si necesita exportar la información.

### 5.4 Consultar transacciones rechazadas

1. Seleccione **Transacciones rechazadas**.
2. Revise el total de rechazos y el monto rechazado.
3. Filtre por periodo.
4. Presione el botón de check (✔️).
5. Revise la tabla con motivo, detalle, cliente, comercio, estado, fecha y monto.
6. Descargue el CSV si requiere compartir o analizar la información fuera del sistema.

### 5.5 Consultar devoluciones

1. Seleccione **Devoluciones**.
2. Revise las cards de devoluciones procesadas y monto de devoluciones.
3. Seleccione periodo.
4. Presione el botón de check (✔️).
5. Revise la tabla con transacción, descripción, estado, fecha y monto.
6. Use **Descargar CSV** si necesita exportar la información.

### 5.6 Consultar transacciones

1. Seleccione **Transacciones**.
2. Revise la tabla general.
3. Identifique información como comercio, monto, moneda, estado, método y fecha.
4. Presione **Descargar CSV** para exportar el listado.

### 5.7 Buscar una transacción desde el header

1. Desde el dashboard principal, ubique el campo de búsqueda superior.
2. Capture un ID de transacción o ID de orden válido únicamente de Pagos exitosos.
3. Presione buscar o confirme la búsqueda.
4. El sistema abrirá un modal con el resultado.
5. Revise tipo, transacción, orden, estado, fecha, tarjeta, monto y descripción.
6. Si el resultado permite navegación, presione **Ver en la vista** para abrir la pantalla relacionada.

Si el formato no es válido, el sistema mostrará una validación indicando que no hay coincidencias.

### 5.8 Filtrar por fechas

Para filtrar por fechas:

1. Abra una vista con filtros de periodo.
2. Seleccione **Hoy** o **Ayer** para consultas rápidas.
3. Para un rango personalizado, seleccione fecha **Desde** y fecha **Hasta**.
4. Presione el botón con ícono de check (✔️).

Consideraciones:

- Las fechas se interpretan en horario UTC.
- La fecha **Desde** no puede ser mayor que la fecha **Hasta**.
- Si el rango no contiene información, la tabla mostrará un estado vacío.

### 5.9 Actualizar datos

Para actualizar información:

- En el dashboard principal, presione **Actualizar**.
- En vistas de detalle, cambie el periodo o presione el botón de check (✔️) para ejecutar nuevamente la consulta.


### 5.10 Interpretar gráficas

| Gráfica | Cómo interpretarla |
| --- | --- |
| Distribución de transacciones | Permite ver qué proporción del total corresponde a cada estado. Si un estado domina la gráfica, significa que concentra la mayor parte de las operaciones del periodo. |
| Pulso horario | Ayuda a identificar horas con mayor volumen de pagos y mayor cantidad de transacciones autorizadas. |
| Rendimiento de éxito por hora | Permite detectar horarios con más transacciones exitosas. |
| Hora de la plataforma | Confirma la referencia de tiempo UTC usada para mostrar y consultar los datos. |

### 5.11 Qué hacer cuando no existan datos

Si la tabla muestra un mensaje como **No hay datos disponibles**, **No hay pagos exitosos para mostrar** o **No se encontraron devoluciones**:

1. Revise que el periodo seleccionado sea correcto.
2. Intente consultar **Hoy** o **Ayer**.
3. Amplíe el rango de fechas.
4. Verifique que el filtro de estado no esté limitando demasiado los resultados.

### 5.12 Exportaciones

Las vistas con tablas permiten exportar información mediante el botón **Descargar CSV**.

El archivo CSV incluye los registros visibles o cargados en la tabla al momento de la descarga. Si necesita exportar más registros, primero use **Cargar más** cuando esté disponible.

---

## 6. Mensajes y validaciones

El sistema muestra mensajes para orientar al usuario cuando ocurre una validación, error o cambio de estado.

| Mensaje o situación | Significado | Acción recomendada |
| --- | --- | --- |
| No hay datos disponibles | No existen registros para el periodo o filtro seleccionado. | Cambiar fechas, estado o ampliar el rango. |
| No hay intenciones de pago para este periodo | No se encontraron intenciones de pago en el rango consultado. | Revisar filtros y volver a consultar. |
| No hay pagos exitosos para mostrar | No hay pagos exitosos con los filtros seleccionados. | Probar otro periodo o estado. |
| No se encontraron devoluciones | No existen devoluciones para el periodo consultado. | Confirmar fechas o validar con soporte. |
| No se pudieron cargar los KPIs del dashboard | El sistema no logró obtener los indicadores principales. | Presionar Actualizar o intentar nuevamente. |
| No se pudieron cargar las gráficas del dashboard | Hubo un problema al cargar las gráficas. | Revisar conexión e intentar más tarde. |
| No pudimos buscar la transacción. Inténtalo de nuevo. | La búsqueda no pudo completarse. | Revisar formato, conexión o intentar nuevamente. |
| Ingresa una transacción u orden válida | El dato escrito en búsqueda no tiene el formato esperado. | Capturar un ID de transacción u orden correcto. |
| La fecha Desde no puede ser mayor que la fecha Hasta | El rango de fechas no es válido. | Corregir las fechas y aplicar de nuevo. |
| Email o contraseña incorrectos | Las credenciales no fueron aceptadas. | Verificar usuario y contraseña. |
| No tienes permiso para iniciar sesión con estas credenciales | La cuenta no cuenta con acceso autorizado. | Contactar al administrador. |
| Datos actualizados correctamente | La consulta se actualizó de forma exitosa. | Continuar con la revisión de información. |




---

## 7. Buenas prácticas

Para utilizar el sistema de forma segura y eficiente:

- No comparta su usuario ni contraseña.
- Cierre sesión al terminar, especialmente si usa un equipo compartido.
- Verifique que está usando la URL oficial proporcionada por el administrador.
- Mantenga actualizado su navegador.
- Use una conexión a internet estable.
- Actualice periódicamente la información antes de tomar decisiones operativas.
- Revise el rango de fechas antes de interpretar datos o descargar reportes.
- Al exportar CSV, confirme que los filtros aplicados correspondan al periodo que necesita.
- No comparta archivos exportados con personas no autorizadas.
- Reporte cualquier comportamiento inesperado con evidencia clara.

---
