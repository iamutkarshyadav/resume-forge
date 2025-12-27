"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
exports.getErrorStatus = getErrorStatus;
exports.isHttpError = isHttpError;
class HttpError extends Error {
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}
exports.HttpError = HttpError;
function getErrorStatus(err) {
    if (err instanceof HttpError)
        return err.status;
    if (typeof err.status === 'number')
        return err.status;
    if (typeof err.statusCode === 'number')
        return err.statusCode;
    return 500;
}
function isHttpError(err) {
    return err instanceof HttpError;
}
