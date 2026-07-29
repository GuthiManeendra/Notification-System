# Backend/notifications/models.py
from django.db import models

class TriggerTemplateMatrix(models.Model):
    TRIGGER_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('inactive_1day', 'Not logged in for 1 day'),
        ('inactive_1week', 'Not logged in for 1 week'),
    ]
    
    CHANNEL_CHOICES = [
        ('whatsapp', 'WhatsApp'),
        ('email', 'Email'),
        ('web_push', 'Web Push'),
    ]

    trigger = models.CharField(max_length=50, choices=TRIGGER_CHOICES)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    title = models.CharField(max_length=255, blank=True, null=True) # Subject for Email / Title for Web Push
    body = models.TextField()                                     # Message text
    is_active = models.BooleanField(default=True)                 # On/Off Toggle
    
    class Meta:
        unique_together = ('trigger', 'channel')

    def __str__(self):
        return f"{self.get_trigger_display()} -> {self.get_channel_display()} (Active: {self.is_active})"