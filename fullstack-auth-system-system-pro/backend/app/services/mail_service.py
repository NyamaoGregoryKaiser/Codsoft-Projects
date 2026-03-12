from flask_mail import Message
from flask import current_app
from backend.app.extensions import mail

def send_email(to, subject, template):
    """
    Sends an email using Flask-Mail.
    :param to: Recipient email address.
    :param subject: Email subject.
    :param template: Email body (can be HTML).
    """
    try:
        msg = Message(subject, recipients=[to], sender=current_app.config['MAIL_DEFAULT_SENDER'])
        msg.html = template
        mail.send(msg)
        current_app.logger.info(f"Email sent to {to} with subject '{subject}'")
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send email to {to}: {e}")
        return False
```