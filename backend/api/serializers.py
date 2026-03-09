# backend/api/serializers.py
from rest_framework import serializers
from .models import Expense, PendingTask, UploadedPDF

class ExpenseSerializer(serializers.ModelSerializer):
    amount = serializers.SerializerMethodField()
    formatted_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = ['id', 'subject', 'employee', 'team', 'amount', 'category', 
                 'date', 'formatted_date', 'description', 'created_at']
    
    def get_amount(self, obj):
        return float(obj.amount)
    
    def get_formatted_date(self, obj):
        return obj.date.strftime('%Y-%m-%d') if obj.date else None

class PendingTaskSerializer(serializers.ModelSerializer):
    task_name = serializers.SerializerMethodField()
    display_value = serializers.SerializerMethodField()
    
    class Meta:
        model = PendingTask
        fields = ['id', 'task_type', 'task_name', 'count', 'value', 'display_value']
    
    def get_task_name(self, obj):
        return obj.get_task_type_display()
    
    def get_display_value(self, obj):
        if obj.value is not None:
            return f"€{float(obj.value):.2f}"
        return str(obj.count)

class PDFUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedPDF
        fields = ['id', 'file', 'uploaded_at', 'processed', 'expenses_found']