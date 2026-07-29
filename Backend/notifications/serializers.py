from rest_framework import serializers
from .models import TriggerTemplateMatrix

class MatrixSerializer(serializers.ModelSerializer):
    class Meta:
        model = TriggerTemplateMatrix
        fields = '__all__'