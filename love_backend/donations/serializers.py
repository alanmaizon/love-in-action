from rest_framework import serializers
from .models import Donation
from charities.serializers import CharityListSerializer


class DonationSerializer(serializers.ModelSerializer):
    charity = CharityListSerializer(read_only=True)
    charity_id = serializers.IntegerField(write_only=True)
    event_slug = serializers.SlugRelatedField(
        source='event',
        slug_field='slug',
        read_only=True
    )

    class Meta:
        model = Donation
        fields = [
            'id', 'event_slug', 'charity', 'charity_id', 'donor_name',
            'donor_email', 'amount', 'currency', 'message', 'is_anonymous',
            'status', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'created_at']


class DonationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing donations"""
    charity_name = serializers.CharField(source='charity.name', read_only=True)
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Donation
        fields = [
            'id', 'donor_name', 'display_name', 'charity_name',
            'amount', 'message', 'is_anonymous', 'status', 'created_at'
        ]

    def get_display_name(self, obj):
        if obj.is_anonymous:
            return 'Anonymous'
        return obj.donor_name


class CreateDonationSessionSerializer(serializers.Serializer):
    """Serializer for creating Stripe checkout session"""
    event_slug = serializers.CharField()
    charity_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=1)
    donor_name = serializers.CharField(max_length=200, required=False, default='Anonymous')
    donor_email = serializers.EmailField(required=False, allow_blank=True)
    message = serializers.CharField(required=False, allow_blank=True, default='')
    is_anonymous = serializers.BooleanField(required=False, default=False)
