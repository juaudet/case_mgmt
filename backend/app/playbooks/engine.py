from bson import ObjectId

from app.playbooks.models import Branch


def evaluate_branch(
    condition_field: str,
    result_data: dict,
    branches: list[Branch],
    default_goto: str | None,
) -> str:
    value = result_data.get(condition_field)
    for branch in branches:
        op, operand = branch.when.split(":", 1)
        try:
            if op == "gte" and float(value) >= float(operand):
                return branch.goto
            if op == "lt" and float(value) < float(operand):
                return branch.goto
            if op == "eq" and str(value) == operand:
                return branch.goto
            if op == "contains" and operand in str(value):
                return branch.goto
            if op == "bool" and bool(value) == (operand == "true"):
                return branch.goto
        except (TypeError, ValueError):
            continue
    return default_goto or "END"


async def advance_playbook(db, case_id: str, step_id: str, result_data: dict) -> str:
    """Complete a step and return the next step_id."""
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        return "END"

    pb_state = case.get("playbook_state") or {}
    playbook_id = case.get("playbook_id")
    if not playbook_id:
        return "END"

    playbook = await db.playbooks.find_one({"id": playbook_id})
    if not playbook:
        return "END"

    step = next((s for s in playbook["steps"] if s["step_id"] == step_id), None)
    if not step:
        return "END"

    completed = pb_state.get("completed_steps", [])
    step_results = pb_state.get("step_results", {})
    completed.append(step_id)
    step_results[step_id] = result_data

    if step.get("condition_field") and step.get("branches"):
        branches = [Branch(**b) for b in step["branches"]]
        next_step = evaluate_branch(
            step["condition_field"], result_data, branches, step.get("default_goto")
        )
    elif step.get("default_goto"):
        next_step = step["default_goto"]
    else:
        next_step = "END"

    new_state = {
        "playbook_id": playbook_id,
        "current_step_id": next_step,
        "completed_steps": completed,
        "step_results": step_results,
    }
    await db.cases.update_one(
        {"_id": ObjectId(case_id)}, {"$set": {"playbook_state": new_state}}
    )
    return next_step
