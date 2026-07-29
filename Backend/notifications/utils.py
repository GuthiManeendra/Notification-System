# notifications/utils.py (or your respective app folder)
import resend
from django.conf import settings

# Initialize Resend with your API key from settings/.env
resend.api_key = settings.RESEND_API_KEY

def send_notification_email(to_email, subject, message_body):
    params = {
        "from": settings.RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": f"<p>{message_body}</p>",
    }
    
    try:
        email = resend.Emails.send(params)
        print("Email sent successfully! ID:", email.get("id"))
        return {"success": True, "id": email.get("id")}
    except Exception as e:
        print(f"Failed to send email via Resend: {str(e)}")
        raise e