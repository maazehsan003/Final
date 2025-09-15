// Job List JavaScript functionality - FIXED VERSION

document.addEventListener('DOMContentLoaded', function() {
    const jobCards = document.querySelectorAll('.job-card');
    const detailPanel = document.getElementById('job-detail-panel');
    const detailContent = document.getElementById('job-detail-content');
    const closeDetailBtn = document.getElementById('close-detail');
    const loadingOverlay = document.getElementById('loading-overlay');

    // Initialize job list functionality
    initJobList();
    
    // Initialize application functionality
    initApplications();
    
    // Initialize search functionality
    initSearchFeatures();

    function initJobList() {
        // Add click listeners to job cards
        jobCards.forEach(card => {
            card.addEventListener('click', function() {
                const jobId = this.dataset.jobId;
                loadJobDetail(jobId);
                
                // Update selected state
                jobCards.forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
            });
        });

        // Close detail panel
        if (closeDetailBtn) {
            closeDetailBtn.addEventListener('click', function() {
                detailPanel.style.display = 'none';
                jobCards.forEach(c => c.classList.remove('selected'));
            });
        }
    }

    function initApplications() {
        // Add event listeners for accept buttons
        document.querySelectorAll('.accept-btn').forEach(button => {
            button.addEventListener('click', function() {
                const applicationId = this.getAttribute('data-application-id');
                updateApplicationStatus(applicationId, 'accepted');
            });
        });

        // Add event listeners for decline buttons
        document.querySelectorAll('.decline-btn').forEach(button => {
            button.addEventListener('click', function() {
                const applicationId = this.getAttribute('data-application-id');
                updateApplicationStatus(applicationId, 'declined');
            });
        });
    }

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

        // Check if search elements exist (only on job list page)
        if (!searchInput || !categoryFilter) {
            console.log('Search elements not found - search functionality disabled');
            return;
        }

        console.log('Initializing search features...');
        console.log('Job cards found:', jobCards.length);

        let searchTimeout;

        // Search functionality - FIXED VERSION
        function performSearch() {
            console.log('Performing search...');
            const searchTerm = searchInput.value.toLowerCase().trim();
            const selectedCategory = categoryFilter.value;
            let visibleCount = 0;

            console.log('Search term:', searchTerm);
            console.log('Selected category:', selectedCategory);

            jobCards.forEach((card, index) => {
                // Get text content directly from DOM elements instead of data attributes
                const titleElement = card.querySelector('.job-title');
                const descriptionElement = card.querySelector('.job-description');
                const categoryElement = card.querySelector('.job-category');
                
                const title = titleElement ? titleElement.textContent.toLowerCase() : '';
                const description = descriptionElement ? descriptionElement.textContent.toLowerCase() : '';
                const categoryText = categoryElement ? categoryElement.textContent.toLowerCase() : '';
                
                // Also get data attribute for category matching
                const categoryValue = card.getAttribute('data-category') || '';
                
                console.log(`Card ${index}:`, { title, description, categoryText, categoryValue });
                
                // Check if search term matches title, description, or category display text
                const titleMatch = title.includes(searchTerm);
                const descriptionMatch = description.includes(searchTerm);
                const categoryDisplayMatch = categoryText.includes(searchTerm);
                
                const textMatch = searchTerm === '' || titleMatch || descriptionMatch || categoryDisplayMatch;
                const categoryMatch = selectedCategory === '' || categoryValue === selectedCategory;
                
                console.log(`Card ${index} matches:`, { textMatch, categoryMatch, titleMatch, descriptionMatch, categoryDisplayMatch });
                
                if (textMatch && categoryMatch) {
                    card.style.display = 'block';
                    card.classList.remove('d-none');
                    highlightSearchTerm(card, searchTerm);
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                    card.classList.add('d-none');
                    removeHighlights(card);
                }
            });

            console.log('Visible jobs:', visibleCount);
            
            // Update results info
            updateSearchResults(visibleCount, searchTerm, selectedCategory);
        }

        // Highlight search terms in job cards - IMPROVED VERSION
        function highlightSearchTerm(card, searchTerm) {
            // First remove any existing highlights
            removeHighlights(card);
            
            if (!searchTerm) {
                return;
            }

            const title = card.querySelector('.job-title');
            const description = card.querySelector('.job-description');
            const category = card.querySelector('.job-category');

            [title, description, category].forEach(element => {
                if (element && element.textContent) {
                    const originalText = element.textContent;
                    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
                    
                    if (regex.test(originalText)) {
                        const highlightedText = originalText.replace(regex, '<mark class="search-highlight">$1</mark>');
                        element.innerHTML = highlightedText;
                    }
                }
            });
        }

        // Remove highlights from job cards - IMPROVED VERSION
        function removeHighlights(card) {
            const highlights = card.querySelectorAll('.search-highlight');
            highlights.forEach(highlight => {
                const parent = highlight.parentNode;
                const textNode = document.createTextNode(highlight.textContent);
                parent.replaceChild(textNode, highlight);
                parent.normalize();
            });
        }

        // Update search results information - FIXED VERSION
        function updateSearchResults(count, searchTerm, category) {
            console.log('Updating search results:', { count, searchTerm, category });
            
            if (resultsCount) {
                resultsCount.textContent = count;
            }
            
            let searchInfo = '';
            if (searchTerm) {
                searchInfo += ` for "${searchTerm}"`;
            }
            if (category) {
                const categorySelect = document.getElementById('category-filter');
                if (categorySelect) {
                    const selectedOption = categorySelect.querySelector(`option[value="${category}"]`);
                    if (selectedOption) {
                        const categoryDisplay = selectedOption.textContent;
                        searchInfo += ` in ${categoryDisplay}`;
                    }
                }
            }
            
            if (searchTermDisplay) {
                searchTermDisplay.textContent = searchInfo;
            }
            
            if (searchResultsInfo) {
                if (searchTerm || category) {
                    searchResultsInfo.style.display = 'block';
                } else {
                    searchResultsInfo.style.display = 'none';
                }
            }

            // Show/hide no results message
            if (count === 0 && (searchTerm || category)) {
                if (noResultsMessage) {
                    noResultsMessage.classList.remove('d-none');
                }
                if (jobListings) {
                    jobListings.style.display = 'none';
                }
            } else {
                if (noResultsMessage) {
                    noResultsMessage.classList.add('d-none');
                }
                if (jobListings) {
                    jobListings.style.display = 'block';
                }
            }
        }

        // Escape regex special characters
        function escapeRegex(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        // Event listeners
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                console.log('Search input changed:', this.value);
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(performSearch, 300); // Debounce search
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', function() {
                console.log('Category filter changed:', this.value);
                performSearch();
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                console.log('Clear search clicked');
                searchInput.value = '';
                categoryFilter.value = '';
                performSearch();
                searchInput.focus();
            });
        }

        if (resetSearchBtn) {
            resetSearchBtn.addEventListener('click', function() {
                console.log('Reset search clicked');
                searchInput.value = '';
                categoryFilter.value = '';
                performSearch();
                searchInput.focus();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
            
            // Escape to clear search
            if (e.key === 'Escape' && (searchInput === document.activeElement)) {
                searchInput.value = '';
                categoryFilter.value = '';
                performSearch();
                searchInput.blur();
            }
        });

        // Add search hint
        if (searchInput) {
            searchInput.addEventListener('focus', function() {
                if (!this.getAttribute('data-hint-shown')) {
                    showSearchHint();
                    this.setAttribute('data-hint-shown', 'true');
                }
            });
        }

        function showSearchHint() {
            if (!searchInput.parentNode) return;
            
            const hint = document.createElement('div');
            hint.className = 'alert alert-info alert-dismissible fade show mt-2';
            hint.innerHTML = `
                <i class="fas fa-lightbulb"></i> 
                <strong>Search Tips:</strong> Use keywords from job titles, descriptions, or categories. 
                Use <kbd>Ctrl+K</kbd> to quickly focus the search box.
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            const container = searchInput.closest('.card-body');
            if (container) {
                container.appendChild(hint);
                
                // Auto-hide hint after 8 seconds
                setTimeout(() => {
                    if (hint.parentNode) {
                        hint.remove();
                    }
                }, 8000);
            }
        }

        // Initialize with any existing search parameters
        const urlParams = new URLSearchParams(window.location.search);
        const initialSearch = urlParams.get('search');
        const initialCategory = urlParams.get('category');
        
        if (initialSearch && searchInput) {
            searchInput.value = initialSearch;
        }
        if (initialCategory && categoryFilter) {
            categoryFilter.value = initialCategory;
        }
        
        if (initialSearch || initialCategory) {
            performSearch();
        }

        // Test search functionality on page load
        console.log('Search functionality initialized successfully');
        
        // Run initial search to ensure everything works
        setTimeout(() => {
            console.log('Running initial search test...');
            performSearch();
        }, 100);
    }

    // Load job details via AJAX
    function loadJobDetail(jobId) {
        showLoading(true);
        
        fetch(`/job/${jobId}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                displayJobDetail(data);
                if (detailPanel) {
                    detailPanel.style.display = 'block';
                }
                showLoading(false);
            })
            .catch(error => {
                console.error('Error loading job details:', error);
                showError('Failed to load job details. Please try again.');
                showLoading(false);
            });
    }

    // Display job details in the panel
    function displayJobDetail(job) {
        if (!detailContent) return;

        const applyButton = job.is_owner 
            ? '' 
            : job.has_applied 
                ? '<button class="btn btn-secondary" disabled><i class="fas fa-check"></i> Already Applied</button>'
                : `<a href="/apply/${job.id}/" class="btn btn-success"><i class="fas fa-paper-plane"></i> Apply Now</a>`;

        const content = `
            <div class="fade-in">
                <h5 class="mb-3">${escapeHtml(job.title)}</h5>
                
                <div class="mb-3">
                    <h6>Description:</h6>
                    <p class="text-muted">${escapeHtml(job.description).replace(/\n/g, '<br>')}</p>
                </div>
                
                <div class="row mb-3">
                    <div class="col-sm-6">
                        <strong>Category:</strong><br>
                        <span class="badge bg-light text-dark">
                            <i class="fas fa-tag"></i> ${escapeHtml(job.category)}
                        </span>
                    </div>
                    <div class="col-sm-6">
                        <strong>Budget:</strong><br>
                        <span class="badge bg-success">
                            <i class="fas fa-dollar-sign"></i> $${job.budget}
                        </span>
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-sm-6">
                        <strong>Deadline:</strong><br>
                        <i class="fas fa-calendar"></i> ${job.deadline}
                    </div>
                    <div class="col-sm-6">
                        <strong>Posted by:</strong><br>
                        <i class="fas fa-user"></i> ${escapeHtml(job.client)}
                    </div>
                </div>
                
                <div class="mb-3">
                    <small class="text-muted">
                        <i class="fas fa-clock"></i> Posted on ${job.created_at}
                    </small>
                </div>
                
                <hr>
                
                <div class="d-grid">
                    ${applyButton}
                </div>
                
                ${job.is_owner ? `
                    <div class="mt-3">
                        <small class="text-muted">
                            <i class="fas fa-info-circle"></i> This is your job posting
                        </small>
                    </div>
                ` : ''}
            </div>
        `;
        
        detailContent.innerHTML = content;
    }

    // Show/hide loading overlay
    function showLoading(show) {
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'block' : 'none';
        }
    }

    // Show error message
    function showError(message) {
        // Create and show toast or alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Handle responsive behavior
    function handleResize() {
        if (detailPanel) {
            if (window.innerWidth <= 768) {
                // On mobile, make detail panel non-sticky
                detailPanel.classList.remove('sticky-top');
            } else {
                // On desktop, make it sticky
                detailPanel.classList.add('sticky-top');
            }
        }
    }

    // Initial call and event listener
    handleResize();
    window.addEventListener('resize', handleResize);

    // Add smooth scrolling to apply button clicks
    document.addEventListener('click', function(e) {
        if (e.target.matches('a[href^="/apply/"]')) {
            showLoading(true);
        }
    });
});

// Application status update functionality
function updateApplicationStatus(applicationId, status) {
    if (!confirm(`Are you sure you want to ${status} this application?`)) {
        return;
    }

    // Get CSRF token from multiple sources
    function getCSRFToken() {
        // Try meta tag first
        const metaToken = document.querySelector('meta[name="csrf-token"]');
        if (metaToken) {
            return metaToken.getAttribute('content');
        }
        
        // Try cookie
        function getCookie(name) {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }
        
        return getCookie('csrftoken');
    }

    const csrftoken = getCSRFToken();
    const updateUrl = document.querySelector('#application-data [data-update-url]')?.getAttribute('data-update-url') || '/update-application-status/';

    fetch(updateUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({
            application_id: applicationId,
            status: status
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show success message before reload
            showSuccessMessage(`Application ${status} successfully!`);
            setTimeout(() => location.reload(), 1000);
        } else {
            alert('Error updating application status: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating the application status.');
    });
}

// Function to refresh job listings (can be called from other scripts)
function refreshJobListings() {
    location.reload();
}

// Function to show success message
function showSuccessMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        <i class="fas fa-check-circle"></i> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Handle form submissions with loading states
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            }
        });
    });
});

// Auto-hide alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
    const alerts = document.querySelectorAll('.alert:not(.alert-dismissible)');
    
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.transition = 'opacity 0.5s ease';
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 500);
            }
        }, 5000);
    });
});