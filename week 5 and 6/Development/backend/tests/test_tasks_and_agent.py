from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from pymongo.errors import ServerSelectionTimeoutError

from ai import task_agent


def second_account(client):
    response = client.post("/api/auth/register", json={
        "name": "Other User", "email": "other@example.com", "password": "Password123!",
    })
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json['token']}"}


def test_task_crud_and_account_isolation(client, auth_headers):
    assert client.get("/api/tasks").status_code == 401
    assert client.post("/api/tasks", headers=auth_headers, json={"title": " "}).status_code == 400
    created = client.post("/api/tasks", headers=auth_headers, json={"title": "  Report  "})
    assert created.status_code == 201
    path = created.headers["Location"]
    other = second_account(client)
    assert client.get("/api/tasks", headers=other).json == {"tasks": []}
    assert client.patch(path, headers=other, json={"title": "Other"}).status_code == 404
    assert client.delete(path, headers=other).status_code == 404
    task = client.get("/api/tasks?status=pending", headers=auth_headers).json["tasks"][0]
    assert task["title"] == "Report"
    assert task == created.json
    updated = client.patch(path, headers=auth_headers, json={"title": "Final report", "status": "completed"})
    assert updated.json["title"] == "Final report"
    assert client.get("/api/tasks?status=pending", headers=auth_headers).json == {"tasks": []}
    assert client.delete(path, headers=auth_headers).status_code == 204
    assert client.get("/api/tasks", headers=auth_headers).json == {"tasks": []}


class DemoModel(BaseChatModel):
    @property
    def _llm_type(self):
        return "test-task-assistant"

    def bind_tools(self, tools, **kwargs):
        return self

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        last = messages[-1]
        if isinstance(last, ToolMessage):
            reply = AIMessage(content=last.content)
        elif last.content == "What are my pending tasks?":
            reply = AIMessage(content="", tool_calls=[
                {"name": "list_pending_tasks", "args": {}, "id": "tasks"},
            ])
        elif last.content == "17 times 23":
            reply = AIMessage(content="", tool_calls=[
                {"name": "calculator", "args": {"operation": "multiply", "left": 17, "right": 23},
                 "id": "calc"},
            ])
        elif last.content == "What is my name?":
            remembers = any(message.content == "My name is Siddharth." for message in messages)
            reply = AIMessage(content="Siddharth" if remembers else "I don't know yet.")
        else:
            reply = AIMessage(content="Thanks.")
        return ChatResult(generations=[ChatGeneration(message=reply)])


def test_agent_tools_and_conversation_memory(client, auth_headers, monkeypatch):
    monkeypatch.setattr(task_agent, "build_model", lambda provider: DemoModel())
    client.post("/api/tasks", headers=auth_headers, json={"title": "Submit internship report"})
    other = second_account(client)
    client.post("/api/tasks", headers=other, json={"title": "Private task"})

    def send(prompt, conversation_id=None, headers=auth_headers):
        return client.post("/api/ai/task-chat", headers=headers, json={
            "prompt": prompt, "conversation_id": conversation_id,
        })

    first = send("My name is Siddharth.")
    assert first.status_code == 200
    thread = first.json["conversation_id"]
    assert send("What is my name?", thread).json["data"]["reply"] == "Siddharth"
    assert send("What is my name?").json["data"]["reply"] == "I don't know yet."
    assert send("What is my name?", thread, headers=other).status_code == 404
    tasks = send("What are my pending tasks?", thread).json["data"]["reply"]
    assert "Submit internship report" in tasks and "Private task" not in tasks
    assert "391" in send("17 times 23", thread).json["data"]["reply"]

    def unavailable(*args, **kwargs):
        raise ServerSelectionTimeoutError("Test outage")

    monkeypatch.setattr(task_agent, "list_tasks", unavailable)
    assert "Could not load tasks" in send("What are my pending tasks?", thread).json["data"]["reply"]
