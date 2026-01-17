from django.contrib import admin
from .models import Charity


@admin.register(Charity)
class CharityAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'registration_number', 'is_verified', 'is_active']
    list_filter = ['category', 'is_verified', 'is_active']
    search_fields = ['name', 'description', 'registration_number']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['name']
