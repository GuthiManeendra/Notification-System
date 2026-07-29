import os
import resend
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from twilio.rest import Client
from django.conf import settings
from .models import TriggerTemplateMatrix
from .serializers import MatrixSerializer

# Initialize Resend API key from Django settings
resend.api_key = getattr(settings, 'RESEND_API_KEY', os.getenv('RESEND_API_KEY'))

# --- Third-Party Sandbox Integration Services ---
def send_whatsapp_message(to_phone, message_body):
    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', os.getenv('TWILIO_ACCOUNT_SID'))
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', os.getenv('TWILIO_AUTH_TOKEN'))
    twilio_number = getattr(settings, 'TWILIO_WHATSAPP_NUMBER', os.getenv('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886'))
    
    try:
        client = Client(account_sid, auth_token)
        # Ensure recipient phone number has the 'whatsapp:' prefix required by Twilio
        formatted_to = f"whatsapp:{to_phone}" if not to_phone.startswith("whatsapp:") else to_phone
        
        message = client.messages.create(
            from_=twilio_number,
            body=message_body,
            to=formatted_to
        )
        return {"success": True, "sid": message.sid}
    except Exception as e:
        return {"success": False, "error": str(e)}

def send_resend_email(to_email, subject, body):
    from_email = getattr(settings, 'RESEND_FROM_EMAIL', os.getenv('RESEND_FROM_EMAIL', 'onboarding@resend.dev'))
    params = {
        "from": from_email,
        "to": [to_email],
        "subject": subject,
        "html": f"<p>{body}</p>",
    }
    try:
        response = resend.Emails.send(params)
        return {"success": True, "response": response}
    except Exception as e:
        return {"success": False, "error": str(e)}

def send_onesignal_push(title, body):
    app_id = getattr(settings, 'ONESIGNAL_APP_ID', os.getenv('ONESIGNAL_APP_ID'))
    api_key = getattr(settings, 'ONESIGNAL_REST_API_KEY', os.getenv('ONESIGNAL_REST_API_KEY'))
    
    url = "https://onesignal.com/api/v1/notifications"
    headers = {"Authorization": f"Basic {api_key}", "Content-Type": "application/json"}
    payload = {
        "app_id": app_id,
        "included_segments": ["All"],
        "headings": {"en": title or "Notification"},
        "contents": {"en": body}
    }
    import requests
    try:
        response = requests.post(url, json=payload, headers=headers)
        return response.json()
    except Exception as e:
        return {"success": False, "error": str(e)}

# --- ViewSets & Endpoints ---
class MatrixViewSet(viewsets.ModelViewSet):
    queryset = TriggerTemplateMatrix.objects.all()
    serializer_class = MatrixSerializer

@api_view(['POST'])
def fire_trigger(request):
    trigger_name = request.data.get('trigger')
    test_phone = request.data.get('test_phone', '')
    test_email = request.data.get('test_email', '')

    configs = TriggerTemplateMatrix.objects.filter(trigger=trigger_name, is_active=True)
    results = {}

    for config in configs:
        if config.channel == 'whatsapp' and test_phone:
            results['whatsapp'] = send_whatsapp_message(test_phone, config.body)
        elif config.channel == 'email' and test_email:
            results['email'] = send_resend_email(test_email, config.title or "Notification", config.body)
        elif config.channel == 'web_push':
            results['web_push'] = send_onesignal_push(config.title, config.body)

    return Response({"status": "Trigger processed successfully", "results": results}, status=status.HTTP_200_OK)

@api_view(['POST'])
def test_send_cell(request):
    channel = request.data.get('channel')
    title = request.data.get('title', '')
    body = request.data.get('body')
    recipient = request.data.get('recipient')

    if channel == 'whatsapp':
        res = send_whatsapp_message(recipient, body)
    elif channel == 'email':
        res = send_resend_email(recipient, title or "Test Notification", body)
    elif channel == 'web_push':
        res = send_onesignal_push(title, body)
    else:
        return Response({"error": "Invalid channel"}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"status": "Test sent", "response": res}, status=status.HTTP_200_OK)