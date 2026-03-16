from rest_framework import serializers
from api.models.trip import Trip

class TripSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Trip
        fields = '__all__'
    
    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name() if obj.employee else None