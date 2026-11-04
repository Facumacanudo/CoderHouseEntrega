import { writeFile, readFile } from "node:fs/promises";
 

const SERVICE_FIELDS = [
    "name",
    "description",
    "duration",
    "price",
    "category",
    "available"
];
 
// Error propio para datos inválidos. Permite que el router distinga
// "el cliente mandó mal los datos" (400) de "falló el servidor" (500).
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
// Funciones auxiliares de validación (puras: solo reciben un valor y
// devuelven true/false).
const textoNoVacio = (value) =>
    typeof value === "string" && value.trim() !== "";
 
const esNumPositivo = (value) =>
    typeof value === "number" && Number.isFinite(value) && value > 0;
 
const esNumNoNegativo = (value) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0;
 
const isBoolean = (value) => typeof value === "boolean";
 

const corrertor = {
    name: [textoNoVacio, "no puede estar vacio"],
    description: [textoNoVacio, "no puede estar vacio"],
    duration: [esNumPositivo, "tiene que ser un numero positivo"],
    price: [esNumNoNegativo, "tiene que ser un numero mayor o igual a 0"],
    category: [textoNoVacio, "no puede estar vacio"],
    available: [isBoolean, "tiene que ser TRUE/FALSE"]
};


export default class ServiceManager {
    constructor(databasePath) {
        this.dbPath = databasePath;
    }
  
    async #save(services) {
        await writeFile(this.dbPath, JSON.stringify(services, null, 2));
    }
 
    
    #findId(id) {
        return (service) => service.id === Number(id);
    }
 
    // Valida los datos de un servicio y devuelve un objeto limpio, solo con
    // los campos permitidos (así se descarta el id y cualquier campo extra).
    //  - partial = false (alta): todos los campos son obligatorios.
    //  - partial = true (actualización): solo se validan los campos que vengan.
    #validar(data, { partial = false } = {}) {
        if (!data || typeof data !== "object" || Array.isArray(data)) {
            throw new ValidationError("serviceData tiene que ser un objeto");
        }
 
        const clean = {};
 
        for (const field of SERVICE_FIELDS) {
            const value = data[field];
 
            // Campo ausente: en un alta es error; en una actualización se salta.
            if (value === undefined || value === null) {
                if (partial) continue;
                throw new ValidationError(`Campo ${field} es obligatorio`);
            }
 
            // Campo presente: se valida su tipo y su rango.
            const [isValid, message] = corrertor[field];
            if (!isValid(value)) {
                throw new ValidationError(`Campo ${field} ${message}`);
            }
 
            clean[field] = value;
        }

        // En una actualización tiene que venir al menos un campo válido.
        if (partial && Object.keys(clean).length === 0) {
            throw new ValidationError("No hay campos válidos para actualizar");
        }
 
        return clean;
    }
 
    // Devuelve todos los servicios leyendo el archivo JSON.
   async getServices({ category, available } = {}) {
    const data = await readFile(this.dbPath, "utf-8");
    let services = JSON.parse(data);

    if (category !== undefined) {
        const wanted = String(category).toLowerCase();
        services = services.filter(
            (service) => service.category.toLowerCase() === wanted
        );
    }

    if (available !== undefined) {
        services = services.filter(
            (service) => service.available === available
        );
    }

    return services;   // <- el return va ÚLTIMO
}
 
    // Devuelve el servicio con ese id, o null si no existe.
    async getServiceById(idService) {
        const services = await this.getServices();
        const service = services.find(this.#findId(idService));
        return service ?? null;
    }
 
    // Agrega un servicio nuevo. No recibe id: lo genera la clase.
    async addService(serviceData) {
        // Lanza un error si falta un campo o tiene un tipo inválido.
        // 'clean' no contiene el id aunque venga en serviceData.
        const clean = this.#validar(serviceData);
 
        const services = await this.getServices();
 
        // Id autoincremental: el mayor id existente + 1 (o 1 si no hay servicios).
        const id =
            services.length > 0
                ? Math.max(...services.map((service) => service.id)) + 1
                : 1;
 
        const newService = { id, ...clean };
 
        services.push(newService);
        await this.#save(services);
        return newService;
    }
 
    // Actualiza solo los campos enviados. Nunca modifica el id.
    async updateService(idService, updatedData) {
        // Valida solo los campos que vengan (partial) y descarta el resto,
        // incluido cualquier id que se intente enviar.
        const changes = this.#validar(updatedData, { partial: true });
 
        const services = await this.getServices();
        const index = services.findIndex(this.#findId(idService));
 
        if (index === -1) {
            return { payload: null, status: "notOk", message: "serviceNotFound" };
        }
 
        // Se copian los datos actuales, se pisan con los cambios y se
        // vuelve a poner el id original al final para que sea inmodificable.
        services[index] = {
            ...services[index],
            ...changes,
            id: services[index].id
        };
 
        await this.#save(services);
        return { payload: services[index], status: "ok" };
    }
 
    // Elimina el servicio con ese id.
    async deleteService(idService) {
        const services = await this.getServices();
 
        // Se queda con todos los servicios menos el que se quiere borrar.
        const remainingServices = services.filter(
            (service) => service.id !== Number(idService)
        );
 
        // Si la cantidad no cambió, no existía ese id.
        if (remainingServices.length === services.length) {
            return { payload: idService, status: "notOk", message: "serviceNotFound" };
        }
 
        await this.#save(remainingServices);
        return { payload: idService, status: "ok" };
    }
}