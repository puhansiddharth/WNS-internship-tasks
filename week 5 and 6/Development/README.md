# Weeks 5 and 6 Task Assistant

The Angular task screen and chatbot share a Flask backend and MongoDB database. The app builds on the Week 4 login, registration, dashboard, and provider configuration.

## Run locally on Windows

Install Python 3.12, Node.js 22.12 or later in the Node 22 series, and MongoDB. Start MongoDB locally or use a development MongoDB connection string. In PowerShell, from this project folder:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `MONGODB_URI` and a unique `JWT_SECRET_KEY` in `backend/.env`. Leaving the JWT key blank creates a temporary key and invalidates existing logins when Flask restarts. The default database is `week56_task_assistant`. Set `GROQ_API_KEY` in `backend/.env`. The default model is `qwen/qwen3.8-27b`, served by Groq. Task management can run without an AI key. Keep credentials in `.env`.

```powershell
.\.venv\Scripts\python.exe app.py
```

From a second terminal, open this project folder and run:

```powershell
cd frontend
npm ci
npm start
```

Open http://localhost:4200 and register. Select **My tasks** in the chat sidebar.

## Demo

1. Create **Submit internship report**, reload the task page, and verify it still appears.
2. Open the chatbot and ask **What are my pending tasks?**
3. Say **My name is Siddharth and I prefer short answers.** Then ask **What's my name and how do I like answers?**
4. Ask **What is 17 times 23?** The calculator returns 391.
5. Select **New Chat** to start a separate conversation. Editing and deleting tasks happen in the task screen.

## API

Send the login token as `Authorization: Bearer <token>`.

| Request | Purpose |
| --- | --- |
| `GET /api/tasks?status=pending` | List the signed-in user's pending tasks. Omit status for all tasks. The API returns up to 100 tasks, newest first. |
| `POST /api/tasks` | Create a task with JSON such as `{"title":"Submit internship report"}`. |
| `PATCH /api/tasks/{id}` | Change the title or set status to `pending` or `completed`. |
| `DELETE /api/tasks/{id}` | Delete an owned task. |
| `POST /api/ai/task-chat` | Send `{"prompt":"What are my pending tasks?"}`. Reuse the returned `conversation_id` to continue the chat. |

The task tool uses the same account-scoped query as the Task API inside Flask. It returns up to 20 pending titles and indicates when more exist. MongoDB stores the latest 12 successful turns for each conversation. The dashboard starts a fresh chat when it is opened again.

## Tests and deployment

- Backend, from `backend`: `python -m pytest -q` using the virtual environment. Tests use an in-memory MongoDB substitute and a deterministic model.
- Frontend, from `frontend`: `npm test -- --watch=false` and `npm run build`.
- Use the local app for the checkpoint. Cloud deployment requires approval.
