import express from "express";
import servicesRouter from "./routes/services.routes.js";
import routingDetector from "./middlewares/routingDetector.middleware.js";

const app = express();

app.use(express.json());
app.use(routingDetector);
app.use("/api/services", servicesRouter);

export default app;