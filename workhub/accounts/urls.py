from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.register_view, name="register"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("choose-role/", views.choose_role, name="choose_role"),
    path("freelancer/setup/", views.freelancer_setup, name="freelancer_setup"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("edit-profile/", views.edit_profile, name="edit_profile"),
 ] 