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

## Docker

### Build the Image
```bash
docker build -t log-triage .
```

### Run the Container
```bash
docker run -d -p 8080:80 --name log-triage-app log-triage
```
Access the app at [http://localhost:8080](http://localhost:8080).

### Stop the Container
```bash
docker stop log-triage-app
```
To remove the container:
```bash
docker rm log-triage-app
```
