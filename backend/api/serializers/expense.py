from rest_framework import serializers
from api.models.expense import Expense
from api.models.base import Employee, Team, Category

class ExpenseSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    team_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = '__all__'
    
    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name() if obj.employee else None
    
    def get_team_name(self, obj):
        return obj.team.name if obj.team else None
    
    def get_category_name(self, obj):
        return obj.category.name if obj.category else None