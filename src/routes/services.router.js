import { Router } from "express";
import ServiceManager, { ValidationError } from "../managers/ServiceManager.js";

const router = Router();

// new URL(..., import.meta.url) hace que la ruta funcione sin importar
// desde qué carpeta ejecutes `node`
const serviceManager = new ServiceManager(
    new URL("../data/services.json", import.meta.url)
);

const handleError = (res, error, message) => {
    if (error instanceof ValidationError) {
        return res.status(400).json({ status: "notOk", message: error.message });
    }
    console.error(error);
    res.status(500).json({ status: "notOk", message });
};

router.get("/", async (req, res) => {
    try {
        const { category, available } = req.query;

        // req.query siempre trae strings: "true" hay que pasarlo a booleano
        if (available !== undefined && !["true", "false"].includes(available)) {
            return res.status(400).json({
                status: "notOk",
                message: "available debe ser true o false",
            });
        }

        const services = await serviceManager.getServices({
            category,
            available: available === undefined ? undefined : available === "true",
        });

        res.status(200).json({ status: "ok", payload: services });
    } catch (error) {
        handleError(res, error, "Error al obtener los servicios");
    }
});

router.get("/:sid", async (req, res) => {
    try {
        const service = await serviceManager.getServiceById(req.params.sid);
        if (!service) {
            return res.status(404).json({ status: "notOk", message: "Servicio no encontrado" });
        }
        res.status(200).json({ status: "ok", payload: service });
    } catch (error) {
        handleError(res, error, "Error al obtener el servicio");
    }
});

router.post("/", async (req, res) => {
    try {
        const service = await serviceManager.addService(req.body);
        res.status(201).json({ status: "ok", payload: service });
    } catch (error) {
        handleError(res, error, "Error al crear el servicio");
    }
});

router.put("/:sid", async (req, res) => {
    try {
        const result = await serviceManager.updateService(req.params.sid, req.body);
        if (result.status === "notOk") {
            return res.status(404).json(result);
        }
        res.status(200).json(result);
    } catch (error) {
        handleError(res, error, "Error al actualizar el servicio");
    }
});

router.delete("/:sid", async (req, res) => {
    try {
        const result = await serviceManager.deleteService(req.params.sid);
        if (result.status === "notOk") {
            return res.status(404).json(result);
        }
        res.status(200).json(result);
    } catch (error) {
        handleError(res, error, "Error al eliminar el servicio");
    }
});

export default router;