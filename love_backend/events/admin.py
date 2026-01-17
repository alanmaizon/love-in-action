from django.contrib import admin
from .models import Event, EventCharity


class EventCharityInline(admin.TabularInline):
    model = EventCharity
    extra = 1
    autocomplete_fields = ['charity']


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_type', 'user', 'status', 'event_date', 'created_at']
    list_filter = ['event_type', 'status', 'is_public']
    search_fields = ['title', 'story', 'slug']
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'created_at'
    inlines = [EventCharityInline]
    autocomplete_fields = ['user']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(EventCharity)
class EventCharityAdmin(admin.ModelAdmin):
    list_display = ['event', 'charity', 'display_order']
    list_filter = ['event__event_type']
    autocomplete_fields = ['event', 'charity']
