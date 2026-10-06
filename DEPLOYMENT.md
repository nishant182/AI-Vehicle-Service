# AI Vehicle Service — Deployment Checklist

## 1. Local development

From the repository root:

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```

Local API:
- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/docs`

## 2. Render

Use:

**Build Command**
```text
pip install -r requirements.txt
```

**Start Command**
```text
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

Required environment variables:

```text
ENVIRONMENT=production
SECRET_KEY=<long-random-secret>
DATABASE_URL=<Render Postgres connection string>
OPENROUTER_API_KEY=<optional-but-required-for-real-OpenRouter-AI>
OPENROUTER_MODEL=openai/gpt-4o-mini
FRONTEND_ORIGIN=https://nishant182.github.io
```

If `OPENROUTER_API_KEY` is absent, the AI Assistant intentionally falls back to the built-in demo response logic.

### Database

Do not depend on the local SQLite database for production. Render's default filesystem is ephemeral.

Recommended:
- Create Render Postgres.
- Put its connection string into `DATABASE_URL`.
- Deploy.
- The application automatically creates missing tables.
- The application seeds a minimum service/service-center catalog when those tables are empty.

For a temporary SQLite deployment, the API can still start, but data can disappear after a Render restart/redeploy unless persistent storage is configured.

## 3. GitHub Pages

The production frontend is the repository-root `index.html`.

GitHub Pages:
```text
https://nishant182.github.io/AI-Vehicle-Service/
```

The frontend calls:
```text
https://ai-vehicle-service.onrender.com
```

CORS is configured for the GitHub Pages origin.

## 4. Git cleanup

Do not commit:
- `.env`
- `venv/`
- `__pycache__/`
- `*.db`
- runtime `uploads/`

If these files were previously tracked, remove them from Git's index once:

```powershell
git rm -r --cached backend/__pycache__
git rm -r --cached backend/database/__pycache__
git rm -r --cached backend/models/__pycache__
git rm -r --cached backend/routes/__pycache__
git rm -r --cached backend/schemas/__pycache__
git rm -r --cached backend/utils/__pycache__
git rm --cached ai_vehicle_service.db
git rm --cached backend/ai_vehicle_service.db
```

Then:

```powershell
git add .
git commit -m "Fix deployment and frontend backend integration"
git push origin main
```

## 5. Post-deploy smoke test

Check:

```text
GET /
GET /health
GET /docs
```

Then from GitHub Pages:

1. Register a new user.
2. Login.
3. Add a vehicle.
4. Open Vehicle Health.
5. Open AI Assistant.
6. Open Predictive Maintenance.
7. Open Service Centers.
8. Create a booking.
9. Open Booking History.
10. Open Notifications.
11. Open Service History.
12. Login as admin and open Admin Dashboard.

The browser Network tab should show requests to `https://ai-vehicle-service.onrender.com/...`, not localhost.
