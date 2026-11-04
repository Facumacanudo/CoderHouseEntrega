import "dotenv/config";

const port = Number(process.env.PORT);
if (!process.env.PORT || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT debe ser un número entero entre 1 y 65535");
}

const nodeEnv = process.env.NODE_ENV;

const envPermitidos = ["development", "production", "test"];
if (!envPermitidos.includes(nodeEnv)) {
    throw new Error(`NODE_ENV debe ser uno de los siguientes valores: ${envPermitidos.join(", ")}`
    );
}

export const PORT = port;
export const NODE_ENV = nodeEnv;