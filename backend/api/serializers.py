# api/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Team, Employee, Category, Expense, Trip, PDFUpload

# ========== USER AUTH SERIALIZERS ==========

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}
    )
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    department = serializers.CharField(required=True)
    role = serializers.ChoiceField(
        choices=['employee', 'manager', 'finance', 'admin'],
        required=False, 
        default='employee'
    )

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 'password2', 
                  'phone', 'department', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists."})
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        phone = validated_data.pop('phone', '')
        department = validated_data.pop('department')
        role = validated_data.pop('role', 'employee')
        
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        
        import random
        while True:
            employee_id = f"EMP{random.randint(1000, 9999)}"
            if not Employee.objects.filter(employee_id=employee_id).exists():
                break
        
        Employee.objects.create(
            user=user,
            employee_id=employee_id,
            department=department,
            position='Employee',
            phone=phone,
            role=role
        )
        
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True, 
        write_only=True,
        style={'input_type': 'password'}
    )

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = ['id', 'employee_id', 'department', 'position', 'phone', 'role', 
                  'hire_date', 'is_active', 'user', 'full_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'employee_id', 'hire_date', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()

class ProfileUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    email = serializers.EmailField(source='user.email', required=False)
    
    class Meta:
        model = Employee
        fields = ['first_name', 'last_name', 'email', 'phone', 'department', 'position']
    
    def validate_email(self, value):
        if value:
            current_user = self.instance.user if self.instance else None
            if User.objects.filter(email=value).exclude(pk=current_user.pk).exists():
                raise serializers.ValidationError("Email already exists.")
        return value
    
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        
        if user_data:
            user = instance.user
            if 'first_name' in user_data:
                user.first_name = user_data['first_name']
            if 'last_name' in user_data:
                user.last_name = user_data['last_name']
            if 'email' in user_data:
                user.email = user_data['email']
                user.username = user_data['email']
            user.save()
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "New passwords don't match."})
        return attrs

# ========== EMPLOYEE SERIALIZERS ==========

class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    team_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = ['id', 'employee_id', 'full_name', 'department', 'team', 'team_name', 
                  'position', 'role', 'phone', 'hire_date', 'is_active', 'user']
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()
    
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
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()

# ========== TEAM SERIALIZERS ==========

class TeamSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'created_at', 'employee_count']
    
    def get_employee_count(self, obj):
        return obj.employee_set.count()

# ========== CATEGORY SERIALIZERS ==========

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'code', 'description', 'is_active']

# ========== EXPENSE SERIALIZERS ==========

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

# ========== TRIP SERIALIZERS ==========

class TripSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Trip
        fields = '__all__'
    
    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name() if obj.employee else None

# ========== PDF UPLOAD SERIALIZERS ==========

class PDFUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PDFUpload
        fields = '__all__'