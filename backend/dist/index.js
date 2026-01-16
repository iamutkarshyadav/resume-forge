"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./utils/env");
const worker_1 = require("./worker");
if (process.env.WORKER === "true") {
    (0, worker_1.startWorker)().catch(err => {
        console.error("Worker failed to start:", err);
        process.exit(1);
    });
}
else {
    const port = env_1.env.PORT;
    app_1.default.listen(port, () => {
        console.log(` Server listening on http://localhost:${port}`);
    });
}
