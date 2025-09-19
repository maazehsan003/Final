// Job List + Applications Management JavaScript - FINAL FIXED VERSION

document.addEventListener('DOMContentLoaded', function() {
    console.log('Job & Applications JavaScript loaded');

    const jobCards = document.querySelectorAll('.job-card');
    const detailPanel = document.getElementById('job-detail-panel');
    const detailContent = document.getElementById('job-detail-content');
    const closeDetailBtn = document.getElementById('close-detail');
    const loadingOverlay = document.getElementById('loading-overlay');

    // Initialize all features
    initJobList();
    initSearchFeatures();
    initApplicationsPage();
    initFormHandling();
    initLoadingStates();
    initAlerts();
    initKeyboardShortcuts();
    initPageVisibility();
    handleResponsive();

    window.addEventListener('resize', handleResponsive);

    /** ---------------- JOB LIST ---------------- **/
    function initJobList() {
        jobCards.forEach(card => {
            card.addEventListener('click', function() {
                const jobId = this.dataset.jobId;
                loadJobDetail(jobId);

                jobCards.forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
            });
        });

        if (closeDetailBtn) {
            closeDetailBtn.addEventListener('click', function() {
                detailPanel.style.display = 'none';
                jobCards.forEach(c => c.classList.remove('selected'));
            });
        }
    }

    function loadJobDetail(jobId) {
        showLoading(true);

        fetch(`/job/${jobId}/`)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                displayJobDetail(data);
                if (detailPanel) detailPanel.style.display = 'block';
                showLoading(false);
            })
            .catch(error => {
                console.error('Error loading job details:', error);
                showErrorMessage('Failed to load job details. Please try again.');
                showLoading(false);
            });
    }

    function displayJobDetail(job) {
        if (!detailContent) return;

        const applyButton = job.is_owner
            ? ''
            : job.has_applied
                ? '<button class="btn btn-secondary" disabled><i class="fas fa-check"></i> Already Applied</button>'
                : `<a href="/apply/${job.id}/" class="btn btn-success"><i class="fas fa-paper-plane"></i> Apply Now</a>`;

        detailContent.innerHTML = `
            <div class="fade-in">
                <h5 class="mb-3">${escapeHtml(job.title)}</h5>
                <p class="text-muted">${escapeHtml(job.description).replace(/\n/g, '<br>')}</p>
                <div class="d-grid">${applyButton}</div>
                ${job.is_owner ? '<small class="text-muted"><i class="fas fa-info-circle"></i> This is your job posting</small>' : ''}
            </div>
        `;
    }

    /** ---------------- SEARCH ---------------- **/
    function initSearchFeatures() {
        const searchInput = document.getElementById('job-search');
        const categoryFilter = document.getElementById('category-filter');
        const clearSearchBtn = document.getElementById('clear-search');
        const resetSearchBtn = document.getElementById('reset-search');
        const noResultsMessage = document.getElementById('no-results-message');
        const searchResultsInfo = document.getElementById('search-results-info');
        const resultsCount = document.getElementById('results-count');
        const searchTermDisplay = document.getElementById('search-term-display');
        const jobListings = document.getElementById('job-listings');

        if (!searchInput || !categoryFilter) return;

        let searchTimeout;
        function performSearch() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const selectedCategory = categoryFilter.value;
            let visibleCount = 0;

            jobCards.forEach(card => {
                const title = card.querySelector('.job-title')?.textContent.toLowerCase() || '';
                const description = card.querySelector('.job-description')?.textContent.toLowerCase() || '';
                const categoryText = card.querySelector('.job-category')?.textContent.toLowerCase() || '';
                const categoryValue = card.getAttribute('data-category') || '';

                const textMatch = !searchTerm || title.includes(searchTerm) || description.includes(searchTerm) || categoryText.includes(searchTerm);
                const categoryMatch = !selectedCategory || categoryValue === selectedCategory;

                if (textMatch && categoryMatch) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            if (resultsCount) resultsCount.textContent = visibleCount;

            if (searchResultsInfo) searchResultsInfo.style.display = (searchTerm || selectedCategory) ? 'block' : 'none';
            if (noResultsMessage) noResultsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
            if (jobListings) jobListings.style.display = visibleCount === 0 ? 'none' : 'block';
        }

        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, 300);
        });
        categoryFilter.addEventListener('change', performSearch);
        clearSearchBtn?.addEventListener('click', () => { searchInput.value = ''; categoryFilter.value = ''; performSearch(); });
        resetSearchBtn?.addEventListener('click', () => { searchInput.value = ''; categoryFilter.value = ''; performSearch(); });

        performSearch();
    }

    /** ---------------- APPLICATIONS ---------------- **/
    function initApplicationsPage() {
        const applicationCards = document.querySelectorAll('.application-card');
        applicationCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });

        if (typeof bootstrap !== 'undefined') {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
        }
    }

    // Export globally
    window.updateApplicationStatus = updateApplicationStatus;
    window.refreshApplications = refreshApplications;

    /** ---------------- UTILS ---------------- **/
    function getCSRFToken() {
        return document.querySelector('meta[name="csrf-token"]')?.content || getCookie('csrftoken') || document.querySelector('input[name="csrfmiddlewaretoken"]')?.value || null;
    }

    function getCookie(name) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) return decodeURIComponent(cookie.substring(name.length + 1));
        }
        return null;
    }

    function escapeHtml(text) {
        return text.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[m]));
    }

    function showLoading(show) {
        if (loadingOverlay) loadingOverlay.style.display = show ? 'block' : 'none';
    }

    function showCustomAlert(type, title, message, duration = 5000) {
        const alertDiv = document.createElement('div');
        const alertClass = `alert-${type === 'error' ? 'danger' : type}`;
        alertDiv.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top:20px;right:20px;z-index:9999;min-width:350px;max-width:500px;';
        const icons = {success:'fas fa-check-circle',error:'fas fa-exclamation-triangle',warning:'fas fa-exclamation-triangle',info:'fas fa-info-circle'};
        alertDiv.innerHTML = `<div class="d-flex align-items-center"><i class="${icons[type]} me-2"></i><div class="flex-grow-1"><strong>${title}:</strong> ${message}</div><button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button></div>`;
        document.body.appendChild(alertDiv);
        setTimeout(() => { if (alertDiv.parentNode) { alertDiv.style.opacity='0'; setTimeout(() => alertDiv.remove(),300);} }, duration);
    }

    function showSuccessMessage(msg){ showCustomAlert('success','Success',msg); }
    function showErrorMessage(msg){ showCustomAlert('error','Error',msg); }

    /** ---------------- ACTIONS ---------------- **/
    function updateApplicationStatus(applicationId, status) {
        const action = status === 'accepted' ? 'accept' : 'decline';
        if (!confirm(`Are you sure you want to ${action} this application?`)) return;

        const button = event?.target;
        const originalText = button?.innerHTML;
        if (button) { button.disabled = true; button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...'; }

        const csrfToken = getCSRFToken();
        const applicationData = document.getElementById('application-data');
        const updateUrl = applicationData?.dataset.updateUrl || '/update-application-status/';
        const walletUrl = applicationData?.dataset.walletUrl || '/wallet/';

        fetch(updateUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json','X-CSRFToken': csrfToken},
            body: JSON.stringify({ application_id: applicationId, status })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showSuccessMessage(data.message || `Application ${status} successfully!`);
                setTimeout(() => window.location.reload(), 1500);
            } else if (data.insufficient_funds) {
                showErrorMessage(data.error || 'Insufficient funds in wallet.');
                if (confirm('Go to your wallet to add funds?')) window.location.href = walletUrl;
                if (button) { button.disabled = false; button.innerHTML = originalText; }
            } else {
                showErrorMessage(data.error || 'Unknown error occurred.');
                if (button) { button.disabled = false; button.innerHTML = originalText; }
            }
        })
        .catch(err => {
            console.error(err);
            showErrorMessage('An error occurred while updating the application.');
            if (button) { button.disabled = false; button.innerHTML = originalText; }
        });
    }

    function refreshApplications() {
        showCustomAlert('info','Refreshing','Updating applications list...');
        setTimeout(() => window.location.reload(), 1000);
    }

    /** ---------------- EXTRAS ---------------- **/
    function initFormHandling() {
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', function() {
                const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
                if (submitBtn) {
                    const originalText = submitBtn.innerHTML || submitBtn.value;
                    submitBtn.disabled = true;
                    if (submitBtn.innerHTML !== undefined) submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                    else submitBtn.value = 'Processing...';
                    setTimeout(() => { submitBtn.disabled = false; if (submitBtn.innerHTML !== undefined) submitBtn.innerHTML = originalText; else submitBtn.value = originalText; }, 30000);
                }
            });
        });
    }

    function initLoadingStates() {
        document.querySelectorAll('.wallet-topup-link').forEach(link => {
            link.addEventListener('click', function() {
                const originalText = this.textContent;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirecting...';
                setTimeout(() => this.textContent = originalText, 5000);
            });
        });
    }

    function initAlerts() {
        document.querySelectorAll('.alert:not(.alert-dismissible)').forEach(alert => {
            setTimeout(() => { alert.style.opacity='0'; setTimeout(() => alert.remove(),500); }, 5000);
        });
    }

    function initKeyboardShortcuts() {
        document.addEventListener('keydown', e => {
            if (e.altKey && e.key === 'r') { e.preventDefault(); refreshApplications(); }
            if (e.key === 'Escape') document.querySelectorAll('.alert .btn-close').forEach(btn => btn.click());
        });
    }

    function initPageVisibility() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) console.log('Page became visible');
        });
    }

    function handleResponsive() {
        const isMobile = window.innerWidth <= 768;
        document.querySelectorAll('.application-card').forEach(card => {
            if (isMobile) card.classList.add('mobile-card'); else card.classList.remove('mobile-card');
        });
    }
});