from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib import messages
from .models import Job, Application
from payments.models import Wallet, Payment, Transaction
from django.db import transaction
from django.utils import timezone
import json
from django.core.serializers import serialize

def job_list(request):
    jobs = Job.objects.filter(status='open')
    return render(request, 'jobs/job_list.html', {'jobs': jobs})

@login_required
def post_job(request):
    if request.method == 'POST':
        job = Job.objects.create(
            title=request.POST['title'],
            description=request.POST['description'],
            category=request.POST['category'],
            budget=request.POST['budget'],
            deadline=request.POST['deadline'],
            client=request.user
        )
        messages.success(request, 'Job posted successfully!')
        return redirect('job_list')
    
    return render(request, 'jobs/post_job.html')

def get_job_detail(request, job_id):
    """AJAX endpoint to get job details"""
    job = get_object_or_404(Job, id=job_id)
    
    # Check if user has already applied
    has_applied = False
    if request.user.is_authenticated:
        has_applied = Application.objects.filter(job=job, freelancer=request.user).exists()
    
    job_data = {
        'id': job.id,
        'title': job.title,
        'description': job.description,
        'category': job.get_category_display(),
        'budget': str(job.budget),
        'deadline': job.deadline.strftime('%Y-%m-%d'),
        'client': job.client.username,
        'created_at': job.created_at.strftime('%B %d, %Y'),
        'has_applied': has_applied,
        'is_owner': request.user.is_authenticated and job.client == request.user
    }
    
    return JsonResponse(job_data)

@login_required
def apply_job(request, job_id):
    job = get_object_or_404(Job, id=job_id)
    
    # Check if user already applied
    if Application.objects.filter(job=job, freelancer=request.user).exists():
        messages.warning(request, 'You have already applied to this job.')
        return redirect('job_list')
    
    # Check if user is the job owner
    if job.client == request.user:
        messages.error(request, 'You cannot apply to your own job.')
        return redirect('job_list')
    
    if request.method == 'POST':
        Application.objects.create(
            job=job,
            freelancer=request.user,
            cover_letter=request.POST['cover_letter'],
            proposed_budget=request.POST['proposed_budget'],
            estimated_duration=request.POST['estimated_duration']
        )
        messages.success(request, 'Application submitted successfully!')
        return redirect('job_list')
    
    return render(request, 'jobs/apply_job.html', {'job': job})

@login_required
def applications(request):
    # Get applications for jobs posted by the user (client view)
    client_applications = Application.objects.filter(job__client=request.user)
    
    # Get applications made by the user (freelancer view)
    freelancer_applications = Application.objects.filter(freelancer=request.user)
    
    context = {
        'client_applications': client_applications,
        'freelancer_applications': freelancer_applications
    }
    
    return render(request, 'jobs/applications.html', context)

@login_required
@require_POST
def update_application_status(request):
    """AJAX endpoint to accept/decline applications with payment integration"""
    data = json.loads(request.body)
    application_id = data.get('application_id')
    status = data.get('status')
    
    application = get_object_or_404(Application, id=application_id)
    
    # Check if user is the job owner
    if application.job.client != request.user:
        return JsonResponse({'success': False, 'error': 'Unauthorized'})
    
    if status in ['accepted', 'declined']:
        if status == 'accepted':
            # Check if client has sufficient balance before accepting
            try:
                wallet, created = Wallet.objects.get_or_create(user=request.user)
                amount = application.proposed_budget
                
                if not wallet.can_withdraw(amount):
                    return JsonResponse({
                        'success': False, 
                        'error': f'Insufficient balance. You need ${amount} but only have ${wallet.balance}. Please top up your wallet first.',
                        'insufficient_funds': True
                    })
                
                with transaction.atomic():
                    # Update application status
                    application.status = status
                    application.save()
                    
                    # Update job status and assign freelancer
                    application.job.status = 'in_progress'
                    application.job.freelancer = application.freelancer
                    application.job.save()
                    
                    # Create payment on hold
                    if not wallet.deduct_funds(amount):
                        return JsonResponse({'success': False, 'error': 'Failed to deduct funds'})
                    
                    payment = Payment.objects.create(
                        job=application.job,
                        from_user=request.user,
                        to_user=application.freelancer,
                        amount=amount,
                        status='on_hold',
                        payment_type='job_payment',
                        description=f'Payment for job: {application.job.title}'
                    )
                    
                    # Create transaction record for client (debit)
                    Transaction.objects.create(
                        wallet=wallet,
                        payment=payment,
                        amount=amount,
                        transaction_type='debit',
                        description=f'Payment on hold for job: {application.job.title}',
                        balance_after=wallet.balance
                    )
                    
                    # Decline other applications for this job
                    Application.objects.filter(job=application.job).exclude(id=application_id).update(status='declined')
                
                return JsonResponse({
                    'success': True, 
                    'message': f'Application accepted and payment of ${amount} placed on hold'
                })
                
            except Exception as e:
                return JsonResponse({'success': False, 'error': str(e)})
        else:
            # Just decline the application
            application.status = status
            application.save()
            return JsonResponse({'success': True, 'message': 'Application declined'})
    
    return JsonResponse({'success': False, 'error': 'Invalid status'})

@login_required
@require_POST
def complete_job(request, job_id):
    """Allow freelancer to mark job as completed and trigger payment release"""
    job = get_object_or_404(Job, id=job_id)
    
    # Check if user is the assigned freelancer
    if job.freelancer != request.user:
        messages.error(request, 'You are not authorized to complete this job.')
        return redirect('my_jobs')
    
    # Check if job is in progress
    if job.status != 'in_progress':
        messages.error(request, 'This job cannot be completed at this time.')
        return redirect('my_jobs')
    
    try:
        with transaction.atomic():
            # Mark job as completed
            job.status = 'completed'
            job.save()
            
            # Find and release payment
            payment = Payment.objects.filter(
                job=job, 
                status='on_hold', 
                to_user=request.user
            ).first()
            
            if payment:
                # Create or get freelancer's wallet
                freelancer_wallet, created = Wallet.objects.get_or_create(user=request.user)
                
                # Add funds to freelancer's wallet
                freelancer_wallet.add_funds(payment.amount)
                
                # Update payment status
                payment.status = 'completed'
                payment.completed_at = timezone.now()
                payment.save()
                
                # Create transaction record for freelancer (credit)
                Transaction.objects.create(
                    wallet=freelancer_wallet,
                    payment=payment,
                    amount=payment.amount,
                    transaction_type='credit',
                    description=f'Payment received for job: {job.title}',
                    balance_after=freelancer_wallet.balance
                )
                
                messages.success(request, f'Job "{job.title}" completed! Payment of ${payment.amount} has been added to your wallet.')
            else:
                messages.success(request, f'Job "{job.title}" has been marked as completed!')
            
    except Exception as e:
        messages.error(request, f'An error occurred: {str(e)}')
    
    return redirect('my_jobs')

@login_required
def my_jobs(request):
    # Jobs posted by user (client)
    posted_jobs = Job.objects.filter(client=request.user)
    
    # Jobs assigned to user (freelancer) - only in progress ones
    assigned_jobs = Job.objects.filter(freelancer=request.user, status='in_progress')
    
    # Completed jobs for freelancer
    completed_jobs = Job.objects.filter(freelancer=request.user, status='completed')
    
    context = {
        'posted_jobs': posted_jobs,
        'assigned_jobs': assigned_jobs,
        'completed_jobs': completed_jobs
    }
    
    return render(request, 'jobs/my_jobs.html', context)