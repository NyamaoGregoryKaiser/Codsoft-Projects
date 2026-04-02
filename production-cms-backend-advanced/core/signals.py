import logging
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from core.models import Content, ContentRevision

logger = logging.getLogger(__name__)
User = get_user_model()

@receiver(pre_save, sender=Content)
def create_content_revision(sender, instance, **kwargs):
    """
    Creates a revision history entry before a Content instance is updated.
    This signal needs to be connected carefully, e.g., in apps.py.
    """
    if instance.pk: # Only on update, not creation
        try:
            original_instance = sender.objects.get(pk=instance.pk)
            # Only create a revision if 'content' or 'title' has changed
            if original_instance.content != instance.content or original_instance.title != instance.title:
                # We need to pass the user who made the change. This is tricky in signals
                # as request.user is not directly available. It's often passed via a custom `update` method
                # or a middleware, or defaults to a system user. For simplicity, we'll assume
                # the `author` field of the Content is the one making the revision for now.
                # In a real app, you'd track the actual user who made the API call.
                revision_author = instance.author if instance.author else User.objects.first() # Fallback for demo

                ContentRevision.objects.create(
                    content_item=instance,
                    previous_title=original_instance.title,
                    previous_content=original_instance.content,
                    revision_author=revision_author,
                    revision_message="Content updated via API/Admin"
                )
                logger.info(f"Revision created for Content ID: {instance.pk}")
        except sender.DoesNotExist:
            logger.warning(f"Content with ID {instance.pk} not found during pre_save signal for revision.")
        except Exception as e:
            logger.error(f"Error creating content revision for Content ID {instance.pk}: {e}")

# This signal needs to be imported in core/apps.py to be registered.