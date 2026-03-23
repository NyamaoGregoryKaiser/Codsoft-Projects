import logging
from typing import Optional

logger = logging.getLogger(__name__)

# This is a placeholder for a more robust notification system.
# In a real-world scenario, this might integrate with:
# - Email services (SendGrid, Mailgun)
# - SMS services (Twilio)
# - WebSockets for real-time notifications
# - Dedicated notification queues (Kafka, RabbitMQ)
# - In-app notification tables/APIs

async def send_notification(
    user_id: int,
    message: str,
    link: Optional[str] = None,
    notification_type: str = "general"
) -> bool:
    """
    Sends a notification to a specific user.
    Returns True if successful, False otherwise.
    """
    try:
        # Simulate sending a notification
        logger.info(f"Notification to user {user_id} ({notification_type}): {message}")
        if link:
            logger.info(f"  Link: {link}")

        # In a real system, you'd add logic here to:
        # 1. Store notification in a database (e.g., for an in-app inbox)
        # 2. Push to a message queue for async processing (e.g., email/SMS)
        # 3. Emit via WebSocket if the user is online

        # For demonstration, we just log it.
        return True
    except Exception as e:
        logger.error(f"Failed to send notification to user {user_id}: {e}")
        return False

async def notify_task_assignment(
    assignee_id: int,
    task_title: str,
    project_title: str,
    task_link: Optional[str] = None
):
    """Sends notification when a task is assigned."""
    message = (
        f"You have been assigned a new task: '{task_title}' "
        f"in project '{project_title}'."
    )
    await send_notification(assignee_id, message, task_link, "task_assignment")
    logger.info(f"Notified user {assignee_id} about task assignment.")

async def notify_task_status_change(
    task_id: int,
    task_title: str,
    old_status: str,
    new_status: str,
    project_title: str,
    affected_user_ids: list[int],
    task_link: Optional[str] = None
):
    """Sends notification when a task's status changes."""
    message = (
        f"Task '{task_title}' in project '{project_title}' "
        f"changed status from '{old_status}' to '{new_status}'."
    )
    for user_id in affected_user_ids:
        await send_notification(user_id, message, task_link, "task_status_change")
    logger.info(f"Notified users {affected_user_ids} about task {task_id} status change.")

async def notify_comment_added(
    task_id: int,
    task_title: str,
    comment_author_name: str,
    affected_user_ids: list[int],
    task_link: Optional[str] = None
):
    """Sends notification when a comment is added to a task."""
    message = (
        f"'{comment_author_name}' added a new comment to task '{task_title}'."
    )
    for user_id in affected_user_ids:
        await send_notification(user_id, message, task_link, "comment_added")
    logger.info(f"Notified users {affected_user_ids} about new comment on task {task_id}.")