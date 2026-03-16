from rest_framework import serializers
from api.models.base import Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'code', 'description', 'is_active']
        read_only_fields = ['id']