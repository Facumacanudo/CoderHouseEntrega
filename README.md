# Pre entrega: API REST de servicios (Express)

Proyecto de práctica de Backend I que expone una API REST con Express para gestionar el recurso `services` de un sistema de turnos y reservas. Está desarrollado con Node.js y módulos ESM. La lógica de negocio vive en la clase `ServiceManager`, que persiste los servicios en un archivo JSON; las rutas de Express solo reciben la petición, le piden el trabajo al manager y responden con el código HTTP correspondiente.

## Requisitos

- Node.js 18.11 o superior (necesario para `node --watch`).
- npm.

## Instalación

Desde la carpeta del proyecto, instalá las dependencias:

```bash
npm install
```

Creá el archivo local `.env` a partir de la plantilla. En PowerShell:

```powershell
Copy-Item .env.example .env
```

En macOS o Linux:

```bash
cp .env.example .env
```

## Variables de entorno

El proyecto requiere las siguientes variables:

| Variable   | Descripción                                                           | Ejemplo       |
| ---------- | --------------------------------------------------------------------- | ------------- |
| `PORT`     | Puerto de la aplicación; debe ser un entero entre 1 y 65535.          | `8080`        |
| `NODE_ENV` | Entorno de ejecución permitido: `development`, `production` o `test`. | `development` |

La plantilla `.env.example` contiene los espacios para agregar los valores. El archivo `.env` es local y no debe subirse al repositorio (está incluido en `.gitignore`).

La configuración se valida al iniciar (Fail-Fast): si falta una variable o tiene un valor inválido, el proceso muestra un error y se detiene antes de arrancar.

## Ejecución

```bash
npm start
```

Para iniciar en modo de desarrollo, con reinicio automático al detectar cambios:

```bash
npm run dev
```

Ambos comandos ejecutan `src/server.js`, que carga y valida la configuración y levanta el servidor Express en el puerto indicado en `.env`:

```text
Server running on http://localhost:8080
```

Los cambios sobre los servicios se guardan en `src/data/services.json`.

## Estructura del proyecto

```text
src/
├── config/
│   └── env.config.js
├── data/
│   └── services.json
├── managers/
│   └── ServiceManager.js
├── middlewares/
│   └── routingDetector.middleware.js
├── routes/
│   └── services.router.js
├── app.js
└── server.js
package.json
.env.example
.gitignore
README.md
```

- `src/config/env.config.js`: carga `dotenv`, valida las variables de entorno y las exporta.
- `src/data/services.json`: archivo donde se persisten los servicios.
- `src/managers/ServiceManager.js`: clase con la lógica de administración de servicios (validación, id, lectura y escritura del JSON).
- `src/middlewares/routingDetector.middleware.js`: middleware que registra en consola el método y la URL de cada petición.
- `src/routes/services.router.js`: router de Express con los endpoints de `/api/services`.
- `src/app.js`: crea y configura la aplicación Express (`express.json()`, middlewares y rutas). No contiene lógica de servicios.
- `src/server.js`: punto de entrada; lee el puerto desde la configuración y pone a escuchar la aplicación.

## Recurso `services`

Cada servicio tiene la siguiente estructura (valores de ejemplo):

```js
{
  id: 1,                       // Generado internamente por ServiceManager
  name: "Consulta inicial",
  description: "Primera consulta del paciente",
  duration: 30,                // Duración en minutos
  price: 1000,
  category: "Consulta",
  available: true
}
```

| Campo         | Tipo    | Regla                                                                      |
| ------------- | ------- | -------------------------------------------------------------------------- |
| `id`          | número  | Autoincremental: se genera internamente y no se puede enviar ni modificar. |
| `name`        | string  | Obligatorio, no puede estar vacío.                                         |
| `description` | string  | Obligatorio, no puede estar vacío.                                         |
| `duration`    | número  | Obligatorio, mayor a 0 (minutos).                                          |
| `price`       | número  | Obligatorio, mayor o igual a 0.                                            |
| `category`    | string  | Obligatorio, no puede estar vacío.                                         |
| `available`   | boolean | Obligatorio, `true` o `false`.                                             |

El `id` se calcula como el mayor `id` existente más 1 (o `1` si no hay servicios). Cualquier `id` o campo desconocido que llegue en el body se ignora.

## Endpoints

Base: `/api/services`

| Método   | Ruta                | Descripción                                                   | Códigos     |
| -------- | ------------------- | ------------------------------------------------------------- | ----------- |
| `GET`    | `/api/services`     | Devuelve todos los servicios. Acepta filtros por query params. | 200, 400    |
| `GET`    | `/api/services/:sid` | Devuelve el servicio con ese id.                              | 200, 404    |
| `POST`   | `/api/services`     | Crea un servicio con los datos del body.                      | 201, 400    |
| `PUT`    | `/api/services/:sid` | Actualiza los campos enviados de un servicio existente.       | 200, 400, 404 |
| `DELETE` | `/api/services/:sid` | Elimina el servicio con ese id.                               | 200, 404    |

Cualquier error inesperado del servidor responde `500`.

### Cómo se lee cada dato de la petición

- `req.params`: el id en `/:sid` (GET por id, PUT y DELETE).
- `req.query`: los filtros en `GET /api/services`.
- `req.body`: los datos del servicio en POST y PUT (JSON, con el header `Content-Type: application/json`).

### Formato de las respuestas

Respuesta exitosa:

```json
{ "status": "ok", "payload": { "id": 1, "name": "..." } }
```

Respuesta con error:

```json
{ "status": "notOk", "message": "Descripción del error" }
```

### `GET /api/services`

Devuelve un array con todos los servicios. Se puede filtrar con query params (se pueden combinar):

| Parámetro   | Valores            | Descripción                                                           |
| ----------- | ------------------ | --------------------------------------------------------------------- |
| `category`  | texto              | Servicios de esa categoría (no distingue mayúsculas de minúsculas).   |
| `available` | `true` o `false`   | Servicios disponibles o no disponibles.                               |

Ejemplos:

```text
GET /api/services
GET /api/services?category=masajes
GET /api/services?available=true
GET /api/services?category=masajes&available=true
```

- Si ningún servicio coincide con los filtros, responde `200` con `payload: []`.
- Si `available` tiene un valor distinto de `true` o `false`, responde `400`:

```json
{ "status": "notOk", "message": "available debe ser true o false" }
```

### `GET /api/services/:sid`

```text
GET /api/services/1
```

Responde `200` con el servicio:

```json
{ "status": "ok", "payload": { "id": 1, "name": "Consulta inicial", "...": "..." } }
```

Si no existe (o el id no es un número), responde `404`:

```json
{ "status": "notOk", "message": "Servicio no encontrado" }
```

### `POST /api/services`

No se envía `id`: lo genera el servidor.

```text
POST /api/services
Content-Type: application/json

{
  "name": "Consulta de prueba",
  "description": "Servicio agregado como ejemplo",
  "duration": 30,
  "price": 1000,
  "category": "Consulta",
  "available": true
}
```

Responde `201` con el servicio creado, incluido el `id` asignado:

```json
{
  "status": "ok",
  "payload": {
    "id": 5,
    "name": "Consulta de prueba",
    "description": "Servicio agregado como ejemplo",
    "duration": 30,
    "price": 1000,
    "category": "Consulta",
    "available": true
  }
}
```

Si falta un campo obligatorio o tiene un tipo o valor inválido, responde `400` y no guarda nada:

```json
{ "status": "notOk", "message": "Campo price es obligatorio" }
```

### `PUT /api/services/:sid`

Actualiza solo los campos enviados; el resto queda igual. El `id` nunca se modifica, aunque venga en el body.

```text
PUT /api/services/1
Content-Type: application/json

{ "price": 1200, "available": false }
```

Responde `200` con el servicio actualizado:

```json
{ "payload": { "id": 1, "price": 1200, "available": false, "...": "..." }, "status": "ok" }
```

- Si el servicio no existe, responde `404`:

```json
{ "payload": null, "status": "notOk", "message": "serviceNotFound" }
```

- Si los datos son inválidos (por ejemplo `price: "gratis"`) o el body no trae ningún campo válido, responde `400` con el mensaje del error.

### `DELETE /api/services/:sid`

```text
DELETE /api/services/5
```

Responde `200` con el id eliminado:

```json
{ "payload": "5", "status": "ok" }
```

Si el servicio no existe, responde `404`:

```json
{ "payload": "999", "status": "notOk", "message": "serviceNotFound" }
```

### Resumen de códigos de estado

| Código | Cuándo                                                                       |
| ------ | ---------------------------------------------------------------------------- |
| `200`  | Consulta, actualización o eliminación exitosa.                               |
| `201`  | Servicio creado.                                                             |
| `400`  | Datos inválidos o faltantes (POST/PUT) o filtro `available` inválido (GET).  |
| `404`  | El servicio con ese id no existe (GET por id, PUT, DELETE).                  |
| `500`  | Error inesperado del servidor.                                               |

## Uso de `ServiceManager`

El router usa estos métodos, pero también se pueden usar directamente. Los ejemplos se pueden ejecutar desde la raíz del proyecto, por ejemplo en un archivo temporal `prueba.mjs` que no hace falta subir al repositorio:

```js
import path from "node:path";
import { fileURLToPath } from "node:url";
import ServiceManager, { ValidationError } from "./src/managers/ServiceManager.js";

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const servicesFile = path.join(projectDirectory, "src", "data", "services.json");
const manager = new ServiceManager(servicesFile);
```

> Los ejemplos de alta, actualización y eliminación modifican `src/data/services.json`. Ejecutalos solo si querés probar esos cambios en los datos.

Todos los métodos leen o escriben el archivo JSON, por lo que son asíncronos y deben usarse con `await`.

### `getServices(filters)`

Devuelve un array de servicios. Sin argumentos devuelve todos. Acepta un objeto opcional con filtros:

- `category` (string): compara sin distinguir mayúsculas de minúsculas.
- `available` (boolean): `true` o `false`. Es un booleano real; la conversión desde el texto `"true"` de la URL la hace el router.

```js
const all = await manager.getServices();
const massages = await manager.getServices({ category: "Masajes" });
const availableMassages = await manager.getServices({ category: "Masajes", available: true });
```

### `getServiceById(id)`

Devuelve el servicio con ese `id`, o `null` si no existe.

```js
const service = await manager.getServiceById(1);
const missing = await manager.getServiceById(999);
console.log(missing);
// null
```

### `addService(serviceData)`

Agrega un servicio nuevo y devuelve el servicio creado, con su `id` generado. No se envía `id`: si llega uno, se ignora.

```js
const createdService = await manager.addService({
  name: "Consulta de prueba",
  description: "Servicio agregado como ejemplo",
  duration: 30,
  price: 1000,
  category: "Consulta",
  available: true
});
```

Si falta un campo obligatorio o tiene un tipo o valor inválido, lanza un `ValidationError` que indica el campo, y no guarda nada. `ValidationError` extiende de `Error`; el router lo distingue de otros errores para responder `400` en lugar de `500`:

```js
try {
  await manager.addService({ name: "Sin precio" });
} catch (error) {
  console.log(error instanceof ValidationError); // true
  console.log(error.message);
  // Mensaje que indica el primer campo faltante o inválido
}
```

### `updateService(id, updatedData)`

Actualiza solo los campos enviados de un servicio existente. El `id` nunca se modifica, aunque se envíe en `updatedData`.

```js
const updateResult = await manager.updateService(createdService.id, {
  price: 1200,
  available: false
});
// { payload: { id: 5, ..., price: 1200, available: false }, status: "ok" }
```

- Si el servicio no existe, devuelve `{ payload: null, status: "notOk", message: "serviceNotFound" }`.
- Si los datos son inválidos (por ejemplo `price: "gratis"`) o no hay ningún campo válido para actualizar, lanza un `ValidationError`, igual que `addService`.

### `deleteService(id)`

Elimina el servicio con ese `id`. Devuelve el `id` recibido en `payload` y el resultado en `status`.

```js
const deleteResult = await manager.deleteService(createdService.id);
// { payload: 5, status: "ok" }
```

Si el servicio no existe, devuelve `{ payload: 999, status: "notOk", message: "serviceNotFound" }`.

### Resumen de respuestas

| Método                    | Éxito                           | Servicio inexistente                                              | Datos inválidos       |
| ------------------------- | ------------------------------- | ----------------------------------------------------------------- | --------------------- |
| `getServices(filters)`    | Array de servicios              | No aplica                                                         | No aplica             |
| `getServiceById(id)`      | El servicio                     | `null`                                                            | No aplica             |
| `addService(data)`        | El servicio creado (con `id`)   | No aplica                                                         | Lanza `ValidationError` |
| `updateService(id, data)` | `{ payload, status: "ok" }`     | `{ payload: null, status: "notOk", message: "serviceNotFound" }`  | Lanza `ValidationError` |
| `deleteService(id)`       | `{ payload: id, status: "ok" }` | `{ payload: id, status: "notOk", message: "serviceNotFound" }`    | No aplica             |
