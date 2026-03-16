from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from api.models.base import Employee
import logging

logger = logging.getLogger(__name__)

ALL_ACTIONS = [
    {
        "id": "new-expense",
        "label": "New Expense",
        "description": "Log a business expense",
        "icon": "Plus",
        "color": "indigo",
        "shortcut": "N",
        "route": "/expenses/new",
        "allowed_roles": ["employee", "manager", "finance", "admin"],
    },
    {
        "id": "add-receipt",
        "label": "Add Receipt",
        "description": "Upload receipt or PDF",
        "icon": "Receipt",
        "color": "emerald",
        "shortcut": "R",
        "route": "/receipts/upload",
        "allowed_roles": ["employee", "manager", "finance", "admin"],
    },
    {
        "id": "create-report",
        "label": "Create Report",
        "description": "Generate expense report",
        "icon": "FileText",
        "color": "amber",
        "shortcut": "P",
        "route": "/reports/new",
        "allowed_roles": ["manager", "finance", "admin"],
    },
    {
        "id": "create-trip",
        "label": "Create Trip",
        "description": "Plan a business trip",
        "icon": "Plane",
        "color": "rose",
        "shortcut": "T",
        "route": "/trips/new",
        "allowed_roles": ["employee", "manager", "finance", "admin"],
    },
]

def _build_action(raw: dict, role: str) -> dict:
    """Return a serialisable action dict for the given role."""
    return {
        "id": raw["id"],
        "label": raw["label"],
        "description": raw["description"],
        "icon": raw["icon"],
        "color": raw["color"],
        "shortcut": raw["shortcut"],
        "route": raw["route"],
        "enabled": role in raw["allowed_roles"],
    }

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def quick_access_actions(request):
    """Return quick-access actions available to the authenticated user."""
    try:
        employee = Employee.objects.select_related("team").get(user=request.user)
    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee profile not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
 
    role = employee.role or "employee"
    actions = [_build_action(a, role) for a in ALL_ACTIONS]
 
    return Response(actions)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def log_quick_access_action(request):
    """Record that a user clicked a quick-access tile."""
    action_id = request.data.get("action_id", "").strip()
 
    valid_ids = {a["id"] for a in ALL_ACTIONS}
    if action_id not in valid_ids:
        return Response(
            {"error": f"Unknown action_id '{action_id}'"},
            status=status.HTTP_400_BAD_REQUEST,
        )
 
    return Response(
        {
            "status": "logged",
            "action_id": action_id,
            "timestamp": timezone.now().isoformat(),
        },
        status=status.HTTP_200_OK,
    )