from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    ROLE_CHOICES = [
        ('freelancer', 'Freelancer'),
        ('client', 'Client'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.role if self.role else 'No role yet'}"

# for freelancers
class FreelancerProfile(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    bio = models.TextField()
    skills = models.CharField(max_length=250)
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    profile_picture = models.ImageField(upload_to="profile_pics/", blank=True, null=True)

    def __str__(self):
        return f"Freelancer: {self.profile.user.username}"