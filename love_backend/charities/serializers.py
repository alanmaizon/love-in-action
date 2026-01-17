from rest_framework import serializers
from .models import Charity


class CharitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Charity
        fields = [
            'id', 'name', 'slug', 'description', 'logo', 'website',
            'registration_number', 'registration_country', 'category',
            'is_verified', 'is_active'
        ]
        read_only_fields = ['id', 'is_verified']


class CharityListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing charities"""
    class Meta:
        model = Charity
        fields = ['id', 'name', 'slug', 'logo', 'category', 'is_verified']
