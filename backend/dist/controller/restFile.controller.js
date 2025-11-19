"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.uploadResumeHandler = uploadResumeHandler;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("../utils/env");
const file_service_1 = require("../services/file.service");
const uploadDir = env_1.env.UPLOAD_DIR;
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path_1.default.extname(file.originalname);
        const basename = path_1.default.basename(file.originalname, ext).replace(/\s+/g, "_");
        cb(null, `${Date.now()}-${basename}${ext}`);
    }
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: env_1.env.MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        if (!env_1.env.ALLOWED_FILE_TYPES.split(",").includes(file.mimetype)) {
            return cb(new Error("Invalid file type"));
        }
        cb(null, true);
    }
}).single("file");
async function uploadResumeHandler(req, res, next) {
    (0, exports.upload)(req, res, async function (err) {
        try {
            if (err)
                return next(err);
            const file = req.file;
            const user = req.user;
            if (!user)
                return res.status(401).json({ message: "Unauthorized" });
            if (!file)
                return res.status(400).json({ message: "No file uploaded" });
            const result = await (0, file_service_1.parseAndSaveResume)(file, user.id);
            return res.json({ success: true, resume: result.resume, parsed: result.parsed });
        }
        catch (e) {
            next(e);
        }
    });
}
