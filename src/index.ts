import { Elysia } from "elysia";
import { userAuth } from "./routes/user.auth";
import { adminAuth } from "./routes/admin.auth";
import { imageTools } from "./routes/image.tools";
import { pdfTools } from "./routes/pdf.tools";
import { usageStats, adminUsageStats } from "./routes/usage.stats";

const app = new Elysia()
  // Handle OPTIONS preflight requests
  .options('/*', ({ set }) => {
    set.headers['Access-Control-Allow-Origin'] = 'http://localhost:3001';
    set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Disposition';
    set.headers['Access-Control-Allow-Credentials'] = 'true';
    set.status = 200;
    return '';
  })
  // Add CORS headers to all responses
  .onAfterHandle(({ set }) => {
    set.headers['Access-Control-Allow-Origin'] = 'http://localhost:3001';
    set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Disposition';
    set.headers['Access-Control-Allow-Credentials'] = 'true';
  })
  .get("/", () => ({
    message: "Welcome to Toolur Backend API",
    version: "1.0.0",
    endpoints: {
      user: {
        register: "POST /api/user/register",
        login: "POST /api/user/login",
      },
      admin: {
        register: "POST /api/admin/register",
        login: "POST /api/admin/login",
      },
      image: {
        compress: "POST /api/image/compress",
        resize: "POST /api/image/resize",
        crop: "POST /api/image/crop",
        jpgToWord: "POST /api/image/jpg-to-word",
        imageTextConverter: "POST /api/image/image-text-converter",
        wordCounter: "POST /api/image/word-counter",
      },
      pdf: {
        pdfToJpg: "POST /api/pdf/pdf-to-jpg",
        compress: "POST /api/pdf/compress",
        split: "POST /api/pdf/split",
        pdfToWord: "POST /api/pdf/pdf-to-word",
        crop: "POST /api/pdf/crop",
        wordToPdf: "POST /api/pdf/word-to-pdf",
      },
    },
  }))
  .group("/api/user", (app) => app.use(userAuth))
  .group("/api/admin", (app) => app.use(adminAuth))
  .group("/api/image", (app) => app.use(imageTools))
  .group("/api/pdf", (app) => app.use(pdfTools))
  .group("/api/usage", (app) => app.use(usageStats))
  .group("/api/usage", (app) => app.use(adminUsageStats))
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
