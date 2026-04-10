import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { ServicesClient } from '@google-cloud/run';
import { ServiceUsageClient } from '@google-cloud/service-usage';
import { CloudBuildClient } from '@google-cloud/cloudbuild';
import compute from '@google-cloud/compute';
import aiplatform from '@google-cloud/aiplatform';
import archiver from 'archiver';
import fs from 'fs';

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

  // GCP OAuth URL Endpoint
  app.get("/api/auth/gcp/url", (req, res) => {
    // In production, this comes from process.env.GOOGLE_CLIENT_ID
    const clientId = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
    const redirectUri = `https://${req.headers.host}/auth/callback`;
    const scope = "https://www.googleapis.com/auth/cloud-platform";
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    res.json({ url: authUrl });
  });

  // Generic OAuth Callback Endpoint for AI Studio iframe
  app.get("/auth/callback", (req, res) => {
    const { code, state } = req.query;
    // In a real app, you exchange 'code' for tokens here using your CLIENT_SECRET.
    // For this demo, we pass the code back to the frontend to simulate a successful handshake.
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: 'gcp', code: '${code}' }, '*');
              window.close();
            } else {
              document.write("Authentication successful. You can close this window.");
            }
          </script>
        </body>
      </html>
    `);
  });

  // OAuth / In-App Key Generation Endpoint (Mock for others)
  app.post("/api/oauth/generate", async (req, res) => {
    try {
      const { serviceId } = req.body;
      await new Promise(resolve => setTimeout(resolve, 2000));

      const randHex = (len: number) => Array.from({length: len}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const randAlphanum = (len: number) => Array.from({length: len}, () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return chars.charAt(Math.floor(Math.random() * chars.length));
      }).join('');

      let key = '';
      if (serviceId === 'github') {
        key = 'ghp_' + randAlphanum(36);
      } else if (serviceId === 'shopify') {
        key = 'shpat_' + randHex(32);
      } else if (serviceId === 'stripe') {
        key = 'sk_test_' + randAlphanum(24);
      } else if (serviceId === 'facebook' || serviceId === 'instagram') {
        key = 'EAA' + randAlphanum(60);
      } else if (serviceId === 'gcp') {
        key = 'ya29.a0' + randAlphanum(100);
      } else {
        return res.status(400).json({ success: false, error: "Service not supported for auto-generation" });
      }

      res.json({ success: true, key });
    } catch (error: any) {
      console.error("OAuth Generation Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to generate key." });
    }
  });

  // Cloud Run Deployment Endpoint (with Build Step)
  app.post("/api/cloud/deploy", async (req, res) => {
    try {
      const { serviceAccountJson } = req.body;
      
      if (!serviceAccountJson) {
        return res.status(400).json({ success: false, error: "Service Account JSON is required" });
      }

      let credentials;
      try {
        credentials = JSON.parse(serviceAccountJson);
      } catch (e) {
        return res.status(400).json({ success: false, error: "Invalid JSON format" });
      }

      const projectId = credentials.project_id;
      if (!projectId) {
        return res.status(400).json({ success: false, error: "Service Account JSON must contain project_id" });
      }

      // --- STEP 1: ZIP THE CODEBASE ---
      console.log("Step 1: Zipping codebase...");
      // In a real environment, we would zip the directory and upload to Cloud Storage.
      // const output = fs.createWriteStream('workspace.zip');
      // const archive = archiver('zip', { zlib: { level: 9 } });
      // archive.pipe(output);
      // archive.directory('./src/', 'src');
      // archive.file('package.json', { name: 'package.json' });
      // await archive.finalize();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate zip time

      // --- STEP 2: CLOUD BUILD ---
      console.log("Step 2: Submitting to Cloud Build...");
      const cbClient = new CloudBuildClient({ credentials });
      // In production, we would trigger a build using the uploaded zip:
      // const [buildOp] = await cbClient.createBuild({
      //   projectId,
      //   build: {
      //     source: { storageSource: { bucket: 'my-bucket', object: 'workspace.zip' } },
      //     steps: [{ name: 'gcr.io/cloud-builders/docker', args: ['build', '-t', `gcr.io/${projectId}/novaura-app`, '.'] }],
      //     images: [`gcr.io/${projectId}/novaura-app`]
      //   }
      // });
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate build time

      // --- STEP 3: CLOUD RUN DEPLOY ---
      console.log("Step 3: Deploying to Cloud Run...");
      const runClient = new ServicesClient({ credentials });
      const region = 'us-central1';
      const parent = `projects/${projectId}/locations/${region}`;
      const serviceId = `novaura-app-${Date.now().toString().slice(-6)}`;

      // Create a Cloud Run service using the built image
      const [operation] = await runClient.createService({
        parent,
        serviceId,
        service: {
          template: {
            containers: [
              {
                // We use a placeholder image here for the sandbox, 
                // but in prod this is `gcr.io/${projectId}/novaura-app`
                image: 'gcr.io/cloudrun/hello' 
              }
            ]
          }
        }
      });

      console.log("Waiting for Cloud Run deployment operation to complete...");
      const [response] = await operation.promise();
      const deployedUrl = response.uri;

      res.json({ success: true, url: deployedUrl });
    } catch (error: any) {
      console.error("Deployment Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to deploy application." });
    }
  });

  // GCP Admin Services (API Toggling) Endpoint
  app.post("/api/cloud/toggle-api", async (req, res) => {
    try {
      const { serviceAccountJson, apiName, action } = req.body;
      
      if (!serviceAccountJson || !apiName || !action) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      let credentials;
      try {
        credentials = JSON.parse(serviceAccountJson);
      } catch (e) {
        return res.status(400).json({ success: false, error: "Invalid JSON format" });
      }

      const projectId = credentials.project_id;
      const suClient = new ServiceUsageClient({ credentials });
      const serviceName = `projects/${projectId}/services/${apiName}`;

      console.log(`${action === 'enable' ? 'Enabling' : 'Disabling'} API: ${apiName}`);

      if (action === 'enable') {
        const [operation] = await suClient.enableService({ name: serviceName });
        await operation.promise();
      } else {
        const [operation] = await suClient.disableService({ name: serviceName });
        await operation.promise();
      }

      res.json({ success: true, message: `Successfully ${action}d ${apiName}` });
    } catch (error: any) {
      console.error("API Toggle Error:", error);
      res.status(500).json({ success: false, error: error.message || `Failed to ${req.body.action} API.` });
    }
  });

  // Alibaba Cloud Deployment Endpoint
  app.post("/api/alibaba/deploy", async (req, res) => {
    try {
      const { accessKeyId, accessKeySecret, region } = req.body;
      
      if (!accessKeyId || !accessKeySecret) {
        return res.status(400).json({ success: false, error: "Alibaba Cloud credentials are required" });
      }

      // Simulate deployment process to Alibaba Function Compute
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      const randId = Array.from({length: 8}, () => Math.floor(Math.random()*36).toString(36)).join('');
      const deployRegion = region || 'cn-hangzhou';
      const mockUrl = `https://novaura-${randId}.${deployRegion}.fc.aliyuncs.com`;

      res.json({ success: true, url: mockUrl });
    } catch (error: any) {
      console.error("Alibaba Deployment Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to deploy application to Alibaba Cloud." });
    }
  });

  // Stripe Checkout Endpoint
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Missing or invalid Stripe API Key in Authorization header." });
      }

      const stripeKey = authHeader.split(' ')[1];
      const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any });

      const { items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Items array is required." });
      }

      const lineItems = items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      }));

      const domain = req.headers.origin || `http://localhost:${PORT}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${domain}/stripe-demo?success=true`,
        cancel_url: `${domain}/stripe-demo?canceled=true`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout session." });
    }
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
  // VERTEX AI ENDPOINTS
  // ==========================================
  app.post("/api/vertex/provision-vm", async (req, res) => {
    try {
      const { serviceAccountJson, machineType, gpuType, gpuCount } = req.body;
      if (!serviceAccountJson) return res.status(400).json({ success: false, error: "Service Account JSON is required" });

      let credentials;
      try {
        credentials = JSON.parse(serviceAccountJson);
      } catch (e) {
        return res.status(400).json({ success: false, error: "Invalid JSON format" });
      }

      const projectId = credentials.project_id;
      const zone = 'us-central1-a';
      
      const instancesClient = new compute.InstancesClient({ credentials });
      
      const [response] = await instancesClient.insert({
        project: projectId,
        zone,
        instanceResource: {
          name: `novaura-vm-${Date.now()}`,
          machineType: `zones/${zone}/machineTypes/${machineType}`,
          disks: [{
            boot: true,
            initializeParams: {
              sourceImage: 'projects/debian-cloud/global/images/family/debian-11'
            }
          }],
          networkInterfaces: [{
            network: 'global/networks/default',
            accessConfigs: [{ type: 'ONE_TO_ONE_NAT', name: 'External NAT' }]
          }],
          guestAccelerators: gpuCount && gpuCount > 0 ? [{
            acceleratorType: `zones/${zone}/acceleratorTypes/${gpuType}`,
            acceleratorCount: gpuCount
          }] : []
        }
      });

      res.json({ 
        success: true, 
        message: `Successfully initiated provisioning of Vertex AI VM (${machineType}) with ${gpuCount || 0}x ${gpuType || 'No GPU'} in project ${projectId}. Operation ID: ${response.name}` 
      });
    } catch (error: any) {
      console.error("Vertex VM Provision Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to provision VM." });
    }
  });

  app.post("/api/vertex/deploy-model", async (req, res) => {
    try {
      const { serviceAccountJson, modelId, region } = req.body;
      if (!serviceAccountJson) return res.status(400).json({ success: false, error: "Service Account JSON is required" });

      let credentials;
      try {
        credentials = JSON.parse(serviceAccountJson);
      } catch (e) {
        return res.status(400).json({ success: false, error: "Invalid JSON format" });
      }

      const projectId = credentials.project_id;
      const location = region || 'us-central1';
      
      const { EndpointServiceClient, ModelServiceClient } = aiplatform.v1;
      const endpointClient = new EndpointServiceClient({ 
        credentials,
        apiEndpoint: `${location}-aiplatform.googleapis.com`
      });
      
      // Create endpoint
      const [endpoint] = await endpointClient.createEndpoint({
        parent: `projects/${projectId}/locations/${location}`,
        endpoint: {
          displayName: `novaura-endpoint-${modelId.replace(/[^a-zA-Z0-9-]/g, '-')}-${Date.now()}`
        }
      });

      // We would then deploy the model to this endpoint, but for safety and cost reasons 
      // (deploying a model can cost $$/hour), we'll return success on endpoint creation.
      // To fully deploy: endpointClient.deployModel({ endpoint: endpoint.name, deployedModel: { model: modelId } })

      res.json({ 
        success: true, 
        message: `Successfully created Model Garden endpoint for ${modelId} in ${location}. Endpoint ID: ${endpoint.name}` 
      });
    } catch (error: any) {
      console.error("Vertex Deploy Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to deploy model." });
    }
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
