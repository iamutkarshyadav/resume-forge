import { Request, Response, NextFunction } from "express";
import { saveJobDescription } from "../services/jd.service";
import { analyzeMatch, generateForMatch, getMatchById } from "../services/match.service";
import { HttpError } from "../utils/httpError";

export function uploadJDHandler(_req: Request, res: Response) {
  return res.status(415).json({ error: "JD must be plain text. PDF is not allowed." });
}

export async function createJDTextHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if ((req.headers["content-type"] || "").indexOf("application/json") === -1) {
      return res.status(415).json({ error: "Content-Type must be application/json" });
    }
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { jdText } = req.body || {};
    if (!jdText || typeof jdText !== "string" || jdText.trim().length === 0) {
      return res.status(400).json({ error: "Body must contain { jdText: string }" });
    }

    const jd = await saveJobDescription(user.id, jdText);
    return res.json({ success: true, jd });
  } catch (e) {
    next(e);
  }
}

export async function analyzeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { resumeId, jdText } = req.body;
    if (!resumeId || !jdText) return res.status(400).json({ message: "resumeId and jdText required" });

    const result = await analyzeMatch({ id: user.id, role: user.role }, resumeId, jdText);
    res.json(result);
  } catch (e: any) {
    // If service threw an HttpError, forward with its status
    if (e && typeof e.status === "number") return res.status(e.status).json({ message: e.message, details: e.details || null });
    next(e);
  }
}

export async function generateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { resumeId, jdText } = req.body;
    if (!resumeId || !jdText) return res.status(400).json({ message: "resumeId and jdText required" });

    const result = await generateForMatch({ id: user.id, role: user.role }, resumeId, jdText);
    res.json(result);
  } catch (e: any) {
    if (e && typeof e.status === "number") return res.status(e.status).json({ message: e.message, details: e.details || null });
    next(e);
  }
}

export async function getMatchHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "match id required" });
    const match = await getMatchById(id);
    if (!match) return res.status(404).json({ message: "not found" });
    res.json(match);
  } catch (e) {
    next(e);
  }
}
