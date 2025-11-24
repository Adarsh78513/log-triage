# Log Triage Backend

Python FastAPI backend for AI-powered log analysis and triage.

## Features

- **Description Validation**: Ensures user problem descriptions contain sufficient detail
- **Async Log Triage**: Background processing of log analysis with polling support
- **Multi-log Comparison**: Supports comparing good vs bad logs or multiple bad logs
- **CORS Enabled**: Configured for local development with frontend

## Architecture

```
backend/
├── main.py              # FastAPI application entry point
├── config.py            # Configuration and settings management
├── requirements.txt     # Python dependencies
├── models/              # Pydantic schemas
│   ├── schemas.py       # Request/response models
│   └── __init__.py
├── routes/              # API endpoints
│   ├── api.py           # Main API routes
│   └── __init__.py
└── services/            # Business logic
    ├── gemini_service.py    # Gemini AI integration
    ├── task_manager.py      # Async task management
    ├── base.py              # Base service classes
    └── __init__.py
```

## Setup

### Prerequisites
- Python 3.9 or higher
- Gemini API key ([Get one here](https://ai.google.dev/))

### Installation

1. **Create a virtual environment** (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your GEMINI_API_KEY
   ```

### Running the Server

**Development mode** (with auto-reload):
```bash
python -m uvicorn main:app --reload --port 8000
```

**Production mode**:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /
GET /api/health
```
Returns server status.

### Validate Description
```
POST /api/validate
```
**Request Body**:
```json
{
  "user_answers": {
    "environment": "production",
    "service": "auth-service"
  },
  "current_description": "The login endpoint is failing"
}
```
**Response**:
```json
{
  "is_sufficient": false,
  "clarifying_question": "What error are you seeing?",
  "summary": ""
}
```

### Submit Triage
```
POST /api/triage
```
**Request Body**:
```json
{
  "logs": [
    {
      "content": "log file content here",
      "type": "bad1"
    }
  ],
  "user_answers": {
    "usecase_description": "Login failing with 500 error"
  }
}
```
**Response**:
```json
{
  "task_id": "task_1234567890_abc123"
}
```

### Poll Triage Status
```
GET /api/triage/status/{task_id}
```
**Response**:
```json
{
  "status": "SUCCESS",
  "message": "Complete",
  "result": {
    "summary": "Brief analysis summary",
    "potential_issues": ["Issue 1", "Issue 2"],
    "suggested_actions": ["Action 1", "Action 2"]
  }
}
```

### Cancel Triage
```
POST /api/triage/cancel/{task_id}
```

## Configuration

Environment variables (in `.env.local`):

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Gemini API key | *Required* |
| `MODEL_NAME` | Gemini model to use | `gemini-2.5-flash` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `RELOAD` | Enable auto-reload | `true` |

## Development

### Running Tests
```bash
# Add pytest when tests are implemented
pytest
```

### Code Style
This project follows PEP 8 guidelines. Format with:
```bash
black .
```

## Troubleshooting

### "Error loading settings"
- Ensure `.env.local` exists in the backend directory
- Verify `GEMINI_API_KEY` is set in `.env.local`

### CORS Errors
- Check `cors_origins` in `config.py` matches your frontend URL
- Default allowed origins: `http://localhost:5173`, `http://localhost:3000`, `http://localhost:8080`

### Import Errors
- Ensure you're in the backend directory when running
- Activate your virtual environment
- Reinstall dependencies: `pip install -r requirements.txt`

## Dependencies

- **FastAPI**: Modern web framework
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation
- **google-genai**: Gemini API client
- **python-dotenv**: Environment management
