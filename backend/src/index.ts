import app from "./app";
import { env } from "./utils/env";
import { startWorker } from "./worker";

if (process.env.WORKER === "true") {
  startWorker().catch(err => {
    console.error("Worker failed to start:", err);
    process.exit(1);
  });
} else {
  const port = env.PORT || 3001; // Fallback to 3001 if undefined
  app.listen(port, () => {
    console.log(` Server listening on http://localhost:${port}`);
    
    // In development, automatically start the worker so "npm run dev" just works.
    // Unless we strictly say API_ONLY=true
    if (process.env.NODE_ENV !== "production" && process.env.API_ONLY !== "true") {
      console.log("🔧 Development Mode detected: Starting embedded Worker...");
      startWorker().catch(err => {
        console.error("Embedded worker failed to start:", err);
      });
    }
  });
}
