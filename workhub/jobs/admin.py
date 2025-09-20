from django.contrib import admin
from .models import Job, Application


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'budget', 'deadline', 'status', 'client', 'freelancer', 'created_at')
    list_filter = ('status', 'category', 'deadline', 'created_at')
    search_fields = ('title', 'description', 'client__username', 'freelancer__username')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('job', 'freelancer', 'proposed_budget', 'estimated_duration', 'status', 'applied_at')
    list_filter = ('status', 'applied_at')
    search_fields = ('job__title', 'freelancer__username', 'cover_letter')
    ordering = ('-applied_at',)
