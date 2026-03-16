from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse, Http404
from django.core.files.base import ContentFile
from django.utils import timezone
from api.models.base import Employee
from api.models.reports import Report
from api.serializers.reports import ReportSerializer, GenerateReportSerializer
import logging

logger = logging.getLogger(__name__)

REPORT_TITLES = {
    'expense_summary': 'Monthly Expense Summary',
    'department_spending': 'Department Spending',
    'travel_report': 'Travel Reports',
    'category_analysis': 'Category Analysis',
    'employee_expenses': 'Employee Expenses',
    'yearly_comparison': 'Yearly Comparison',
}

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_reports(request):
    """Return the 20 most-recently generated reports for the current user."""
    try:
        employee = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response(
            {'error': 'Employee profile not found'},
            status=status.HTTP_404_NOT_FOUND,
        )
 
    if employee.role == 'admin':
        reports = Report.objects.all()[:20]
    else:
        reports = Report.objects.filter(generated_by=request.user)[:20]
 
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_report(request):
    """Validate the request body, create a Report record, and build PDF."""
    serializer = GenerateReportSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
    data = serializer.validated_data
    report_type = data['report_type']
    title = REPORT_TITLES.get(report_type, report_type.replace('_', ' ').title())
 
    pdf_bytes = _build_simple_pdf(
        title=title,
        report_type=report_type,
        date_start=data.get('date_range_start'),
        date_end=data.get('date_range_end'),
        generated_by=request.user.get_full_name() or request.user.username,
    )
 
    report = Report.objects.create(
        title=title,
        report_type=report_type,
        format=data.get('format', 'pdf'),
        status='completed',
        date_range_start=data.get('date_range_start'),
        date_range_end=data.get('date_range_end'),
        generated_by=request.user,
        filters=data.get('filters', {}),
    )
 
    filename = f"report_{report.report_id}.pdf"
    report.file.save(filename, ContentFile(pdf_bytes), save=True)
 
    return Response(
        ReportSerializer(report).data,
        status=status.HTTP_201_CREATED,
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_report(request, report_id):
    """Stream the stored PDF back to the client."""
    try:
        report = Report.objects.get(report_id=report_id)
    except (Report.DoesNotExist, ValueError):
        raise Http404
 
    try:
        employee = Employee.objects.get(user=request.user)
        if employee.role != 'admin' and report.generated_by != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN,
            )
    except Employee.DoesNotExist:
        return Response(
            {'error': 'Employee profile not found'},
            status=status.HTTP_404_NOT_FOUND,
        )
 
    if report.file:
        try:
            file_data = report.file.read()
        except Exception:
            return Response(
                {'error': 'File could not be read'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    else:
        file_data = _build_simple_pdf(
            title=report.title,
            report_type=report.report_type,
            date_start=report.date_range_start,
            date_end=report.date_range_end,
            generated_by=(
                report.generated_by.get_full_name()
                if report.generated_by
                else 'Unknown'
            ),
        )
 
    content_type_map = {
        'pdf': 'application/pdf',
        'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'csv': 'text/csv',
    }
    content_type = content_type_map.get(report.format, 'application/octet-stream')
    ext = report.format if report.format != 'excel' else 'xlsx'
 
    response = HttpResponse(file_data, content_type=content_type)
    response['Content-Disposition'] = (
        f'attachment; filename="report_{report.report_id}.{ext}"'
    )
    return response

def _build_simple_pdf(title, report_type, date_start, date_end, generated_by='') -> bytes:
    """Returns a minimal, standards-compliant PDF as bytes."""
    generated_on = timezone.now().strftime('%Y-%m-%d %H:%M')
    date_range = (
        f"{date_start} to {date_end}"
        if date_start and date_end
        else 'All dates'
    )
 
    lines = [
        f"Report: {title}",
        f"Type: {report_type}",
        f"Date Range: {date_range}",
        f"Generated by: {generated_by}",
        f"Generated on: {generated_on}",
        "",
        "This report was generated by ExpensePro.",
        "Please refer to the dashboard for interactive analytics.",
    ]
 
    objects = []
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    objects.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
 
    stream_lines = ["BT", "/F1 14 Tf", "50 780 Td", "14 TL"]
    for line in lines:
        safe = line.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
        stream_lines.append(f"({safe}) Tj T*")
    stream_lines.append("ET")
    stream_content = "\n".join(stream_lines).encode()
 
    objects.append(
        b"3 0 obj\n<< /Length " + str(len(stream_content)).encode() + b" >>\nstream\n"
        + stream_content
        + b"\nendstream\nendobj\n"
    )
 
    objects.append(
        b"4 0 obj\n"
        b"<< /Type /Page /Parent 2 0 R "
        b"/MediaBox [0 0 612 792] "
        b"/Contents 3 0 R "
        b"/Resources << /Font << /F1 5 0 R >> >> >>\n"
        b"endobj\n"
    )
 
    objects[1] = b"2 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n"
 
    objects.append(
        b"5 0 obj\n"
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n"
        b"endobj\n"
    )
 
    header = b"%PDF-1.4\n"
    body = b""
    offsets = []
    offset = len(header)
 
    for obj in objects:
        offsets.append(offset)
        body += obj
        offset += len(obj)
 
    xref_offset = len(header) + len(body)
    xref = f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    for o in offsets:
        xref += f"{o:010d} 00000 n \n"
 
    trailer = (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_offset}\n%%EOF"
    )
 
    return header + body + xref.encode() + trailer.encode()