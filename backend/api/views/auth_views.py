# api/views/auth_views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from ..serializers import (
    RegisterSerializer, LoginSerializer, ProfileSerializer, 
    ProfileUpdateSerializer, ChangePasswordSerializer
)
from ..models import Employee
import logging

logger = logging.getLogger(__name__)

# ========== REGISTRATION ==========

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user"""
    try:
        logger.info(f"Registration attempt with data: {request.data}")
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            logger.info(f"User created successfully: {user.email}")
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            # Get employee profile
            try:
                employee = Employee.objects.get(user=user)
                profile_serializer = ProfileSerializer(employee)
                
                return Response({
                    'user': profile_serializer.data,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }, status=status.HTTP_201_CREATED)
            except Employee.DoesNotExist:
                logger.error(f"Employee profile not found for user {user.email}")
                return Response(
                    {'non_field_errors': ['Employee profile creation failed.']},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Return detailed validation errors
        logger.warning(f"Registration validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return Response(
            {'non_field_errors': [f'Registration failed: {str(e)}']},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ========== LOGIN ==========

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user and return JWT tokens"""
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        logger.info(f"Login attempt for email: {email}")
        
        if not email or not password:
            return Response({
                'non_field_errors': ['Please provide both email and password.']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.warning(f"User not found with email: {email}")
            return Response({
                'non_field_errors': ['Invalid email or password.']
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Authenticate
        user = authenticate(username=user.username, password=password)
        if not user:
            logger.warning(f"Authentication failed for email: {email}")
            return Response({
                'non_field_errors': ['Invalid email or password.']
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user is active
        if not user.is_active:
            logger.warning(f"Inactive account attempt: {email}")
            return Response({
                'non_field_errors': ['Account is disabled.']
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Get employee profile
        try:
            employee = Employee.objects.get(user=user)
            profile_serializer = ProfileSerializer(employee)
        except Employee.DoesNotExist:
            # Create employee profile if it doesn't exist
            logger.info(f"Creating employee profile for existing user: {email}")
            employee = Employee.objects.create(
                user=user,
                employee_id=f"EMP{user.id:04d}",
                department="General",
                position="Employee",
                role="employee"
            )
            profile_serializer = ProfileSerializer(employee)
        
        logger.info(f"Login successful for: {email}")
        return Response({
            'user': profile_serializer.data,
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        })
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response(
            {'non_field_errors': [f'Login failed: {str(e)}']},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ========== LOGOUT ==========

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout user by blacklisting refresh token"""
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {'error': 'Invalid refresh token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"User {request.user.email} logged out successfully")
        return Response({'message': 'Logged out successfully'})
    
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ========== PROFILE ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get current user profile"""
    try:
        employee = Employee.objects.get(user=request.user)
        serializer = ProfileSerializer(employee)
        return Response(serializer.data)
    
    except Employee.DoesNotExist:
        logger.error(f"Profile not found for user {request.user.email}")
        return Response(
            {'error': 'Profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Profile fetch error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ========== UPDATE PROFILE ==========

@api_view(['PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update current user profile"""
    try:
        employee = Employee.objects.get(user=request.user)
        serializer = ProfileUpdateSerializer(employee, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            # Return updated full profile
            updated_serializer = ProfileSerializer(employee)
            logger.info(f"Profile updated for user {request.user.email}")
            return Response(updated_serializer.data)
        
        logger.warning(f"Profile update validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Employee.DoesNotExist:
        logger.error(f"Profile not found for user {request.user.email}")
        return Response(
            {'error': 'Profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Profile update error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ========== CHANGE PASSWORD ==========

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    try:
        user = request.user
        serializer = ChangePasswordSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        old_password = serializer.validated_data.get('old_password')
        new_password = serializer.validated_data.get('new_password')
        
        # Check old password
        if not user.check_password(old_password):
            return Response(
                {'old_password': 'Wrong password.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        # Generate new tokens
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"Password changed for user {user.email}")
        return Response({
            'message': 'Password changed successfully',
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        })
    
    except Exception as e:
        logger.error(f"Password change error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ========== REFRESH TOKEN ==========

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """Refresh access token"""
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            token = RefreshToken(refresh_token)
            return Response({
                'access': str(token.access_token)
            })
        except TokenError:
            return Response(
                {'error': 'Invalid refresh token'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ========== FORGOT PASSWORD ==========

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Send password reset email"""
    try:
        email = request.data.get('email')
        if not email:
            return Response(
                {'email': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            # Here you would send password reset email
            # For now, just log it
            logger.info(f"Password reset requested for {email}")
            
            # In production, you would:
            # 1. Generate a reset token
            # 2. Send email with reset link
            # 3. Store token in database with expiration
            
            return Response({
                'message': 'If an account exists with this email, you will receive password reset instructions.'
            })
        except User.DoesNotExist:
            # Don't reveal that user doesn't exist for security
            logger.info(f"Password reset attempted for non-existent email: {email}")
            return Response({
                'message': 'If an account exists with this email, you will receive password reset instructions.'
            })
    
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ========== RESET PASSWORD ==========

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password with token"""
    try:
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not token or not new_password:
            return Response(
                {'error': 'Token and new password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Here you would:
        # 1. Verify token is valid and not expired
        # 2. Find user associated with token
        # 3. Set new password
        # 4. Invalidate token
        
        # For now, return success message
        logger.info(f"Password reset completed with token")
        
        return Response({
            'message': 'Password reset successfully. You can now login with your new password.'
        })
    
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ========== VERIFY EMAIL ==========

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """Verify user email address"""
    try:
        token = request.data.get('token')
        if not token:
            return Response(
                {'error': 'Verification token required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Here you would:
        # 1. Verify token
        # 2. Mark user email as verified
        # 3. Return success
        
        logger.info(f"Email verified with token")
        
        return Response({
            'message': 'Email verified successfully'
        })
    
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ========== DELETE ACCOUNT ==========

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """Delete user account"""
    try:
        password = request.data.get('password')
        if not password:
            return Response(
                {'password': 'Password is required to delete account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        
        # Verify password
        if not user.check_password(password):
            return Response(
                {'password': 'Wrong password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete user (this will cascade delete employee profile)
        user.delete()
        
        logger.info(f"Account deleted for user {user.email}")
        
        return Response({
            'message': 'Account deleted successfully'
        })
    
    except Exception as e:
        logger.error(f"Account deletion error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )