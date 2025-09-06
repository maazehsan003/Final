from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.middleware.csrf import get_token
from .models import Profile, FreelancerProfile, ClientProfile
from django.http import JsonResponse
from django.urls import reverse

def register(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
        
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password1 = request.POST.get("password1")
        password2 = request.POST.get("password2")

        if password1 != password2:
            messages.error(request, "Passwords do not match")
            return render(request, "accounts/register.html")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already taken")
            return render(request, "accounts/register.html")

        # Create user
        user = User.objects.create_user(username=username, email=email, password=password1)
        Profile.objects.create(user=user)
        login(request, user)

        csrf_token = get_token(request)

        return JsonResponse({
            "success": True,
            "message": "Account created successfully!",
            "csrfToken": csrf_token 
        })

    if request.method == "GET":
        return render(request, "accounts/register.html")

def save_role(request):
    if request.method == "POST":
        role = request.POST.get("role")
        
        if not role:
            return JsonResponse({"success": False, "message": "Please select a role"})
        
        # Update profile with role
        profile = Profile.objects.get(user=request.user)
        profile.role = role
        profile.save()
        
        return JsonResponse({"success": True, "redirect": reverse("setup_profile")})

@login_required  
def setup_profile(request):
    profile = Profile.objects.filter(user=request.user).first()
    
    if not profile or not profile.role:
        return redirect("register")

    if request.method == "POST":
        if profile.role == "freelancer":
            title = request.POST.get("title")
            bio = request.POST.get("bio")
            skills = request.POST.get("skills")
            hourly_rate = request.POST.get("hourly_rate")
            picture = request.FILES.get("profile_picture")

            FreelancerProfile.objects.create(
                profile=profile,
                title=title,
                bio=bio,
                skills=skills,
                hourly_rate=hourly_rate,
                profile_picture=picture
            )
            
        elif profile.role == "client":
            first_name = request.POST.get("first_name")
            last_name = request.POST.get("last_name")
            company_name = request.POST.get("company_name")

            ClientProfile.objects.create(
                profile=profile,
                first_name=first_name,
                last_name=last_name,
                company_name=company_name
            )

        messages.success(request, "Profile setup completed!")
        return redirect("dashboard")

    return render(request, "accounts/setup_profile.html", {"role": profile.role})

def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
        
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, "Logged in successfully.")
            return redirect("dashboard")
        else:
            messages.error(request, "Invalid username or password.")

    return render(request, "accounts/login.html")

def logout_view(request):
    logout(request)
    messages.success(request, "You have been logged out.")
    return render(request, "accounts/logout.html")

@login_required
def dashboard(request):
    profile = Profile.objects.filter(user=request.user).first()

    if not profile or not profile.role:
        return redirect("register")
    
    # Check if profile setup is complete
    if profile.role == "freelancer":
        freelancer_profile = FreelancerProfile.objects.filter(profile=profile).first()
        if not freelancer_profile:
            return redirect("setup_profile")
        return render(request, "accounts/freelancer_dashboard.html", {"profile": profile, "freelancer_profile": freelancer_profile})
    
    elif profile.role == "client":
        client_profile = ClientProfile.objects.filter(profile=profile).first()
        if not client_profile:
            return redirect("setup_profile")
        return render(request, "accounts/client_dashboard.html", {"profile": profile, "client_profile": client_profile})

@login_required
def edit_profile(request):
    profile = Profile.objects.filter(user=request.user).first()

    if not profile:
        return redirect("register")

    context = {"profile": profile}
    
    if profile.role == "freelancer":
        freelancer_profile = FreelancerProfile.objects.filter(profile=profile).first()
        if not freelancer_profile:
            return redirect("setup_profile")
        context["freelancer_profile"] = freelancer_profile
        
    elif profile.role == "client":
        client_profile = ClientProfile.objects.filter(profile=profile).first()
        if not client_profile:
            return redirect("setup_profile")
        context["client_profile"] = client_profile

    if request.method == "POST":
        if profile.role == "freelancer":
            freelancer_profile = FreelancerProfile.objects.get(profile=profile)
            
            freelancer_profile.first_name = request.POST.get("first_name", freelancer_profile.first_name) 
            freelancer_profile.last_name = request.POST.get("last_name", freelancer_profile.last_name) 
            freelancer_profile.title = request.POST.get("title", freelancer_profile.title)
            freelancer_profile.bio = request.POST.get("bio", freelancer_profile.bio)
            freelancer_profile.skills = request.POST.get("skills", freelancer_profile.skills)
            freelancer_profile.phone_number = request.POST.get("phone_number", freelancer_profile.phone_number) 
            
            hourly_rate = request.POST.get("hourly_rate")
            if hourly_rate:
                freelancer_profile.hourly_rate = hourly_rate
            profile_picture = request.FILES.get("profile_picture")
            if profile_picture:
                freelancer_profile.profile_picture = profile_picture
            
            freelancer_profile.save()
            
        elif profile.role == "client":
            client_profile = ClientProfile.objects.get(profile=profile)
            
            client_profile.first_name = request.POST.get("first_name", client_profile.first_name)
            client_profile.last_name = request.POST.get("last_name", client_profile.last_name)
            client_profile.company_name = request.POST.get("company_name", client_profile.company_name)
            client_profile.phone_number = request.POST.get("phone_number", client_profile.phone_number)
            profile_picture = request.FILES.get("profile_picture")
            if profile_picture:
                client_profile.profile_picture = profile_picture
            
            client_profile.save()

        messages.success(request, "Profile updated successfully!")
        return redirect("dashboard")

    return render(request, "accounts/edit_profile.html", context)