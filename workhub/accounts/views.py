from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .models import Profile, FreelancerProfile

# Register view
def register_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password1 = request.POST.get("password1")
        password2 = request.POST.get("password2")

        # Check passwords match
        if password1 != password2:
            messages.error(request, "Passwords do not match.")
            return redirect("register")

        # Check if username exists
        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already taken.")
            return redirect("register")

        # Create user
        user = User.objects.create_user(username=username, email=email, password=password1)
        login(request, user)
        messages.success(request, "Account created successfully.")
        return redirect("choose_role")

    return render(request, "accounts/register.html")


# Login view
def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, "Logged in successfully.")
            return redirect("dashboard")  # Change this to where you want user to go after login
        else:
            messages.error(request, "Invalid username or password.")
            return redirect("login")

    return render(request, "accounts/login.html")


# Logout view
def logout_view(request):
    logout(request)
    return render(request, "accounts/logout.html")

@login_required
def choose_role(request):
    if request.method == "POST":
        role = request.POST.get("role")

        profile, created = Profile.objects.get_or_create(user=request.user)
        profile.role = role
        profile.save()

        if role == "freelancer":
            return redirect("freelancer_setup")
        else:  # client
            messages.success(request, "You are registered as a Client.")
            return redirect("dashboard")

    return render(request, "accounts/choose_role.html")

@login_required
def freelancer_setup(request):
    if request.method == "POST":
        title = request.POST.get("title")
        bio = request.POST.get("bio")
        skills = request.POST.get("skills")
        hourly_rate = request.POST.get("hourly_rate")
        profile_picture = request.FILES.get("profile_picture")  # <-- added

        profile = Profile.objects.get(user=request.user)
        profile.bio = bio
        profile.skills = skills
        profile.hourly_rate = hourly_rate
        if profile_picture:
            profile.profile_picture = profile_picture
        profile.save()

        FreelancerProfile.objects.create(
            profile=profile,
            title=title
        )

        messages.success(request, "Freelancer profile created successfully!")
        return redirect("dashboard")

    return render(request, "accounts/freelancer_setup.html")


# dashboard
@login_required
def dashboard(request):
    profile = Profile.objects.filter(user=request.user).first()

    if profile:
        if profile.role == "freelancer":
            return render(request, "accounts/freelancer_dashboard.html", {"profile": profile})
        elif profile.role == "client":
            return render(request, "accounts/client_dashboard.html", {"profile": profile})
    else:
        # if no profile found, send them to choose role
        return redirect("choose_role")

# edit profile
@login_required
def edit_profile(request):
    profile = Profile.objects.filter(user=request.user).first()

    if not profile:
        return redirect("choose_role")

    if request.method == "POST":
        bio = request.POST.get("bio")
        skills = request.POST.get("skills")
        hourly_rate = request.POST.get("hourly_rate")
        experience = request.POST.get("experience")
        profile_picture = request.FILES.get("profile_picture")  # ✅ handle file upload

        profile.bio = bio
        profile.skills = skills
        profile.hourly_rate = hourly_rate
        profile.experience = experience

        if profile_picture:
            profile.profile_picture = profile_picture

        profile.save()

        messages.success(request, "Profile updated successfully!")
        return redirect("dashboard")

    return render(request, "accounts/edit_profile.html", {"profile": profile})
