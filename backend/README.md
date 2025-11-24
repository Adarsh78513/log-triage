# Python Backend Migration

## Backend Structure

The backend is now implemented in Python using FastAPI. Here's the structure:

```
backend/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration management
├── requirements.txt       # Python dependencies
├── models/
│   ├── __init__.py
│   └── schemas.py         # Pydantic models for API contracts
├── services/
│   ├── __init__.py
│   ├── base.py           # Abstract AI service interface
│   ├── gemini_service.py # Gemini AI implementation
│   └── task_manager.py   # Task management service
└── routes/
    ├── __init__.py
    └── api.py            # API endpoints
```

## Running the Application

### Prerequisites

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Make sure your `.env.local` file has the API_KEY set

### Development Mode

**Option 1: Run separately** (recommended for development)

Terminal 1 - Backend:
```bash
npm run backend
# or
cd backend && python -m uvicorn main:app --reload --port 8000
```

Terminal 2 - Frontend:
```bash
npm run dev
```

**Option 2: Use a process manager like concurrently** (install separately)

### Production Mode

1. Build frontend:
```bash
npm run build
```

2. Run backend (serves both API and static files):
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /` - Root endpoint
- `GET /api/health` - Health check
- `POST /api/validate` - Validate issue description
- `POST /api/triage` - Submit triage request
- `GET /api/triage/status/{taskId}` - Poll triage status
- `POST /api/triage/cancel/{taskId}` - Cancel triage

## Architecture Benefits

1. **Modular Design**: Abstract service interfaces make it easy to swap AI providers
2. **Type Safety**: Pydantic models ensure strong typing on the backend
3. **Scalability**: Easily replace in-memory storage with Redis/database
4. **Security**: API keys stay on the backend, never exposed to frontend
5. **Flexibility**: Frontend and backend can be deployed separately

## Swapping AI Models

To use a different AI provider (e.g., OpenAI, Anthropic):

1. Create a new service class implementing `BaseAIService` in `services/`
2. Update `routes/api.py` to use the new service in the dependency injection
3. No changes needed in the frontend!

Example:
```python
# services/openai_service.py
from .base import BaseAIService

class OpenAIService(BaseAIService):
    async def validate_description(self, ...):
        # OpenAI implementation
        pass
    
    async def perform_triage(self, ...):
        # OpenAI implementation
        pass
```
