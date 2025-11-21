import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "../utils/env";
import { parseAndSaveResume } from "../services/file.service";

const uploadDir = env.UPLOAD_DIR;
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${basename}${ext}`);
  }
});

const allowedMimeTypes = env.ALLOWED_FILE_TYPES.split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const type = (file.mimetype || "").toLowerCase();
    if (!allowedMimeTypes.includes(type)) {
      const err = new Error(
        `Invalid file type: ${type}. Allowed: ${allowedMimeTypes.join(", ")}`
      ) as any;
      return cb(err);
    }
    cb(null, true);
  }
}).fields([
  { name: "file", maxCount: 1 },
  { name: "resume", maxCount: 1 }
]);

export async function uploadResumeHandler(req: Request, res: Response, next: NextFunction) {
  (upload as any)(req, res, async function (err: any) {
    try {
      if (err) return next(err);
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const files = (req as any).files as Record<string, Express.Multer.File[]> | undefined;
      const single = (req as any).file as Express.Multer.File | undefined;
      const file = single ?? files?.file?.[0] ?? files?.resume?.[0];
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const result = await parseAndSaveResume(file, user.id);
      return res.json({
        success: true,
        resumeId: result.resume.id,
        resume: result.resume,
        parsed: result.parsed
      });
    } catch (e) {
      next(e);
    }
  });
}
