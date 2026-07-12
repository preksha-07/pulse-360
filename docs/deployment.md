# Deployment & Containerization Guide — Pulse360

This document outlines local running guidelines and container configurations for deploying Pulse360 to cloud hosting providers.

---

## 1. Local Run Guidelines

### Running the Services Separately
1.  **Clone and Install Workspace Dependencies**:
    ```bash
    npm install
    ```
2.  **Environment Variables setup**:
    Create `.env` inside `server/` containing:
    ```ini
    PORT=5000
    GEMINI_API_KEY=your_gemini_api_key_here
    ```
3.  **Start Backend API**:
    ```bash
    cd server
    npm run dev
    ```
4.  **Start Frontend Dev Server**:
    ```bash
    cd client
    npm run dev
    ```

---

## 2. Docker Containerization

To run the full stack inside containers, create Dockerfiles for both services and control them using a `docker-compose.yml` file.

### Backend Dockerfile (`server/Dockerfile`)
```dockerfile
# Stage 1: Build ts-node output
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production release
FROM node:18-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
ENV PORT=5000
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

### Frontend Dockerfile (`client/Dockerfile`)
```dockerfile
# Stage 1: Compile static files
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve files using static server (nginx)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Multi-Container Configuration (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: always

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always
```

To run this topology in one go:
```bash
docker-compose up --build
```

---

## 3. Production Cloud Hosting (PaaS)

### Google Cloud Run
Pulse360 is stateless, making it ideal for containerized hosting on Google Cloud Run.
1.  **Build and Push Backend Image to Artifact Registry**:
    ```bash
    gcloud builds submit --tag gcr.io/your-project-id/pulse360-backend ./server
    ```
2.  **Deploy Backend Container**:
    ```bash
    gcloud run deploy pulse360-backend \
      --image gcr.io/your-project-id/pulse360-backend \
      --platform managed \
      --allow-unauthenticated \
      --set-env-vars GEMINI_API_KEY="your-gemini-key"
    ```
3.  **Build and Push Frontend Image**:
    ```bash
    gcloud builds submit --tag gcr.io/your-project-id/pulse360-frontend ./client
    ```
4.  **Deploy Frontend Container**:
    ```bash
    gcloud run deploy pulse360-frontend \
      --image gcr.io/your-project-id/pulse360-frontend \
      --platform managed \
      --allow-unauthenticated
    ```

### Vercel (Client) + Render (Server)

For quick, serverless-grade hosting, you can host the client statically on Vercel and the Express server on Render (which supports long-running SSE streams):

#### 1. Deploy Backend Server to Render:
1. Log in to [Render](https://render.com/) and click **New +** ➜ **Web Service**.
2. Connect your GitHub repository.
3. In the Settings, configure:
   * **Root Directory**: `server`
   * **Build Command**: `npm run build`
   * **Start Command**: `npm start`
4. Add the following **Environment Variables**:
   * `GEMINI_API_KEY`: *your-gemini-api-key*
   * `NODE_ENV`: `production`

#### 2. Deploy Frontend Client to Vercel:
1. Log in to [Vercel](https://vercel.com/) and click **Add New** ➜ **Project**.
2. Import your GitHub repository.
3. Vercel will automatically read the [vercel.json](file:///c:/Users/pk07p/Desktop/Antigravity/PromptWars/3rd/vercel.json) file.
4. Add the following **Environment Variables**:
   * **Key**: `VITE_API_URL`
   * **Value**: Your Render Web Service URL (e.g. `https://pulse360-backend.onrender.com`)
5. Click **Deploy**.

