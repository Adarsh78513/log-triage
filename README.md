<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1K_w1C8XXadPkGBHGVNHJlzHJZ7KcwByj

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Running with Docker

> **Note**: The frontend runs in Docker, but you need to run the Python backend separately on your host machine.

### 1. Start the Backend
First, ensure the Python backend is running:
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### 2. Build the Docker Image
```bash
docker build -t log-triage .
```

### 3. Run the Container
```bash
docker run -d -p 8080:80 --name log-triage-app log-triage
```
Access the app at [http://localhost:8080](http://localhost:8080).

The container uses Nginx as a reverse proxy - requests to `/api/*` are forwarded to your backend running on `localhost:8000`.

### 4. Stop the Container
```bash
docker stop log-triage-app
```
To remove the container:
```bash
docker rm log-triage-app
```

## Development Setup (Alternative)

If you prefer to run everything locally without Docker:

1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   python -m uvicorn main:app --reload --port 8000
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   npm run dev
   ```
   Access at [http://localhost:5173](http://localhost:5173)
