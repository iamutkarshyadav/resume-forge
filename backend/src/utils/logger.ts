import morgan from "morgan"; 
import fs from "fs"; 
import path from "path"; 

export const morganMiddleware = morgan("combined");