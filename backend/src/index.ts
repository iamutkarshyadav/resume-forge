import app from "./app";
import { env } from "./utils/env";

const port = env.PORT;
app.listen(port, () => {
  console.log(` Server listening on http://localhost:${port}`);
});
