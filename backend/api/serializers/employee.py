from rest_framework import serializers
from api.models.base import Employee
from .auth import UserSerializer

class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    team_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = ['id', 'employee_id', 'full_name', 'department', 'team', 'team_name', 
                  'position', 'role', 'phone', 'hire_date', 'is_active', 'user']
        read_only_fields = ['id', 'employee_id', 'hire_date']
    
    def get_full_name(self, obj):
        return obj.user.get_full_name() if obj.user else ''
    
    def get_team_name(self, obj):
        return obj.team.name if obj.team else None

class EmployeeDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    team = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Employee
        fields = ['id', 'employee_id', 'full_name', 'department', 'team', 'position', 
                  'role', 'phone', 'hire_date', 'is_active', 'user', 'created_at', 'updated_at']
        read_only_fields = ['id', 'employee_id', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.user.get_full_name() if obj.user else ''