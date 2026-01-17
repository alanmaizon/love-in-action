from rest_framework import serializers
from .models import Event, EventCharity
from charities.serializers import CharityListSerializer


class EventCharitySerializer(serializers.ModelSerializer):
    charity = CharityListSerializer(read_only=True)
    charity_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = EventCharity
        fields = ['id', 'charity', 'charity_id', 'display_order', 'custom_message']


class EventSerializer(serializers.ModelSerializer):
    event_charities = EventCharitySerializer(many=True, read_only=True)
    total_raised = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    donor_count = serializers.IntegerField(read_only=True)
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'user', 'slug', 'event_type', 'title', 'story',
            'cover_photo', 'event_date', 'location', 'status',
            'goal_amount', 'is_public', 'event_charities',
            'total_raised', 'donor_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['total_raised'] = instance.total_raised()
        data['donor_count'] = instance.donor_count()
        return data


class EventListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing events"""
    total_raised = serializers.SerializerMethodField()
    donor_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'slug', 'event_type', 'title', 'cover_photo',
            'event_date', 'status', 'goal_amount', 'total_raised',
            'donor_count', 'created_at'
        ]

    def get_total_raised(self, obj):
        return obj.total_raised()

    def get_donor_count(self, obj):
        return obj.donor_count()


class EventCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating events"""
    charity_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Event
        fields = [
            'slug', 'event_type', 'title', 'story', 'cover_photo',
            'event_date', 'location', 'status', 'goal_amount',
            'is_public', 'charity_ids'
        ]

    def create(self, validated_data):
        charity_ids = validated_data.pop('charity_ids', [])
        event = Event.objects.create(**validated_data)
        for i, charity_id in enumerate(charity_ids):
            EventCharity.objects.create(
                event=event,
                charity_id=charity_id,
                display_order=i
            )
        return event

    def update(self, instance, validated_data):
        charity_ids = validated_data.pop('charity_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if charity_ids is not None:
            instance.event_charities.all().delete()
            for i, charity_id in enumerate(charity_ids):
                EventCharity.objects.create(
                    event=instance,
                    charity_id=charity_id,
                    display_order=i
                )
        return instance
