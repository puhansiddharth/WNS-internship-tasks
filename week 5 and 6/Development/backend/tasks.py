"""Authenticated task operations and their shared read query."""

from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, current_app, g, jsonify, request
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError

from auth.services import token_required
from database.connection import get_db

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")
STATUSES = ("pending", "completed")


def utc_iso(timestamp):
    # MongoDB BSON dates persist at millisecond precision.
    return timestamp.replace(tzinfo=timezone.utc).isoformat(timespec="milliseconds")


def serialize_task(task):
    return {
        "id": str(task["_id"]),
        "title": task["title"],
        "status": task["status"],
        "created_at": utc_iso(task["created_at"]),
        "updated_at": utc_iso(task["updated_at"]),
    }


def list_tasks(user_id, status=None, *, limit=100):
    query = {"user_id": user_id}
    if status is not None:
        query["status"] = status
    cursor = get_db().tasks.find(query).sort([("created_at", -1), ("_id", -1)]).limit(limit)
    return [serialize_task(task) for task in cursor]


def read_changes(*, creating=False):
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not payload or payload.keys() - {"title", "status"}:
        raise ValueError("Supply a title or status as a JSON object.")
    changes = {}
    if creating or "title" in payload:
        title = payload.get("title")
        if not isinstance(title, str) or not 1 <= len(title.strip()) <= 160:
            raise ValueError("Enter a task title between 1 and 160 characters.")
        changes["title"] = title.strip()
    if creating or "status" in payload:
        status = payload.get("status", "pending")
        if status not in STATUSES:
            raise ValueError("Status must be pending or completed.")
        changes["status"] = status
    changes["updated_at"] = datetime.now(timezone.utc)
    return changes


@tasks_bp.errorhandler(PyMongoError)
def database_error(error):
    current_app.logger.warning("Task database operation failed: %s", type(error).__name__)
    return jsonify(error="Tasks are unavailable. Please try again."), 503


@tasks_bp.route("", methods=["GET", "POST"])
@token_required
def collection():
    user_id = g.current_user["_id"]
    if request.method == "GET":
        status = request.args.get("status")
        if status is not None and status not in STATUSES:
            return jsonify(error="Status must be pending or completed."), 400
        return jsonify(tasks=list_tasks(user_id, status))

    try:
        task = read_changes(creating=True)
    except ValueError as error:
        return jsonify(error=str(error)), 400
    task["user_id"] = user_id
    task["created_at"] = task["updated_at"]
    task["_id"] = get_db().tasks.insert_one(task).inserted_id
    return jsonify(serialize_task(task)), 201, {"Location": f"/api/tasks/{task['_id']}"}


@tasks_bp.route("/<task_id>", methods=["PATCH", "DELETE"])
@token_required
def item(task_id):
    if not ObjectId.is_valid(task_id):
        return jsonify(error="Task not found."), 404
    owned_task = {"_id": ObjectId(task_id), "user_id": g.current_user["_id"]}
    tasks = get_db().tasks
    if request.method == "DELETE":
        if tasks.delete_one(owned_task).deleted_count:
            return "", 204
        return jsonify(error="Task not found."), 404

    try:
        changes = read_changes()
    except ValueError as error:
        return jsonify(error=str(error)), 400
    updated = tasks.find_one_and_update(
        owned_task, {"$set": changes}, return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        return jsonify(error="Task not found."), 404
    return jsonify(serialize_task(updated))
