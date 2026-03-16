from rest_framework import serializers
from api.models.reports import Report

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            'id',
            'report_id',
            'title',
            'report_type',
            'format',
            'status',
            'date_range_start',
            'date_range_end',
            'created_at',
        ]
        read_only_fields = ['id', 'report_id', 'created_at']

class GenerateReportSerializer(serializers.Serializer):
    REPORT_TYPE_CHOICES = [
        'expense_summary',
        'department_spending',
        'travel_report',
        'category_analysis',
        'employee_expenses',
        'yearly_comparison',
    ]
 
    FORMAT_CHOICES = ['pdf', 'excel', 'csv']
 
    report_type = serializers.ChoiceField(choices=REPORT_TYPE_CHOICES)
    date_range_start = serializers.DateField(required=False, allow_null=True)
    date_range_end = serializers.DateField(required=False, allow_null=True)
    format = serializers.ChoiceField(choices=FORMAT_CHOICES, default='pdf')
    filters = serializers.DictField(required=False, default=dict)