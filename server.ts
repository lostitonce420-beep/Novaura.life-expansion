import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON bodies
  app.use(express.json());

  // ==========================================
  // API ROUTES (Backend Logic)
  // ==========================================
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Novaura Cloud Backend is running." });
  });

  // Cloud Manager: Generate API Keys
  app.post("/api/cloud/keys", async (req, res) => {
    try {
      const { serviceType, serviceAccountJson } = req.body;
      
      if (!serviceAccountJson) {
        return res.status(400).json({ success: false, error: "Service Account JSON is required." });
      }

      // In a real production environment, we would use the @google-cloud/api-keys SDK here.
      // However, since we are in a sandbox environment and don't have a real GCP project linked yet,
      // we will simulate the backend generation process to prove the architecture works.
      // 
      // const { ApiKeysClient } = await import('@google-cloud/api-keys');
      // const credentials = JSON.parse(serviceAccountJson);
      // const client = new ApiKeysClient({ credentials });
      // const projectId = credentials.project_id;
      // ... call client.createKey() ...

      // Simulate network delay for the backend operation
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Parse the provided JSON just to validate it's real JSON
      const parsedCreds = JSON.parse(serviceAccountJson);
      if (!parsedCreds.project_id) {
        throw new Error("Invalid Service Account JSON: Missing project_id");
      }

      // Generate a mock key for demonstration
      const mockKey = `AIzaSy${Math.random().toString(36).substring(2, 15)}_${serviceType.toUpperCase()}`;

      res.json({ 
        success: true, 
        key: mockKey, 
        service: serviceType,
        message: `Successfully generated ${serviceType} API Key for project ${parsedCreds.project_id}`
      });
    } catch (error: any) {
      console.error("API Key Generation Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to generate key." });
    }
  });

  // Example inference endpoint we can build out later
  app.post("/api/inference", async (req, res) => {
    // We will move the Gemini API logic here to keep keys secure on the server
    res.json({ status: "pending", message: "Inference endpoint ready to be wired up." });
  });

  // ==========================================
  // VITE MIDDLEWARE (Frontend Serving)
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Express v4 catch-all for SPA
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
