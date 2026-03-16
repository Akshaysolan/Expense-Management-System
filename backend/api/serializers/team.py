from rest_framework import serializers
from api.models.base import Team

class TeamSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'created_at', 'employee_count']
        read_only_fields = ['id', 'created_at']
    
    def get_employee_count(self, obj):
        return obj.employee_set.count()