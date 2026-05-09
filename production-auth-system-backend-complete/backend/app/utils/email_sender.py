from email.mime.text import MIMEText
from email.message import EmailMessage
import smtplib
from typing import List

from app.core.config import settings
from app.utils.logger import logger

class EmailSender:
    """
    Utility class for sending emails using SMTP.
    """
    def __init__(self):
        self.mail_username = settings.MAIL_USERNAME
        self.mail_password = settings.MAIL_PASSWORD
        self.mail_from_email = settings.MAIL_FROM_EMAIL
        self.mail_from_name = settings.MAIL_FROM_NAME
        self.mail_server = settings.MAIL_SERVER
        self.mail_port = settings.MAIL_PORT
        self.mail_use_tls = settings.MAIL_USE_TLS

    async def send_email(
        self,
        recipients: List[str],
        subject: str,
        body: str,
        subtype: str = "plain"
    ):
        """
        Sends an email to the specified recipients.
        :param recipients: List of recipient email addresses.
        :param subject: Email subject.
        :param body: Email body content.
        :param subtype: 'plain' or 'html'.
        """
        try:
            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = f"{self.mail_from_name} <{self.mail_from_email}>"
            msg["To"] = ", ".join(recipients)
            msg.set_content(body, subtype=subtype)

            with smtplib.SMTP(self.mail_server, self.mail_port) as server:
                if self.mail_use_tls:
                    server.starttls()
                server.login(self.mail_username, self.mail_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {recipients} for subject '{subject}'")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {recipients} for subject '{subject}': {e}", exc_info=True)
            return False

email_sender = EmailSender()
```