"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadJDHandler = uploadJDHandler;
exports.createJDTextHandler = createJDTextHandler;
exports.analyzeHandler = analyzeHandler;
exports.generateHandler = generateHandler;
exports.getMatchHandler = getMatchHandler;
const jd_service_1 = require("../services/jd.service");
const match_service_1 = require("../services/match.service");
function uploadJDHandler(_req, res) {
    return res.status(415).json({ error: "JD must be plain text. PDF is not allowed." });
}
async function createJDTextHandler(req, res, next) {
    try {
        if ((req.headers["content-type"] || "").indexOf("application/json") === -1) {
            return res.status(415).json({ error: "Content-Type must be application/json" });
        }
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        const { jdText } = req.body || {};
        if (!jdText || typeof jdText !== "string" || jdText.trim().length === 0) {
            return res.status(400).json({ error: "Body must contain { jdText: string }" });
        }
        const jd = await (0, jd_service_1.saveJobDescription)(user.id, jdText);
        return res.json({ success: true, jd });
    }
    catch (e) {
        next(e);
    }
}
async function analyzeHandler(req, res, next) {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        const { resumeId, jdText } = req.body;
        if (!resumeId || !jdText)
            return res.status(400).json({ message: "resumeId and jdText required" });
        const result = await (0, match_service_1.analyzeMatch)({ id: user.id, role: user.role }, resumeId, jdText);
        res.json(result);
    }
    catch (e) {
        // If service threw an HttpError, forward with its status
        if (e && typeof e.status === "number")
            return res.status(e.status).json({ message: e.message, details: e.details || null });
        next(e);
    }
}
async function generateHandler(req, res, next) {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        const { resumeId, jdText } = req.body;
        if (!resumeId || !jdText)
            return res.status(400).json({ message: "resumeId and jdText required" });
        const result = await (0, match_service_1.generateForMatch)({ id: user.id, role: user.role }, resumeId, jdText);
        res.json(result);
    }
    catch (e) {
        if (e && typeof e.status === "number")
            return res.status(e.status).json({ message: e.message, details: e.details || null });
        next(e);
    }
}
async function getMatchHandler(req, res, next) {
    try {
        const id = req.params.id;
        if (!id)
            return res.status(400).json({ message: "match id required" });
        const match = await (0, match_service_1.getMatchById)(id);
        if (!match)
            return res.status(404).json({ message: "not found" });
        res.json(match);
    }
    catch (e) {
        next(e);
    }
}
