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

function getCSRFTokenFromDOM() {
    const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
    if (csrfInput) {
        return csrfInput.value;
    }
    return getCookie('csrftoken');
}

let csrftoken = getCookie('csrftoken');

document.addEventListener('DOMContentLoaded', function() {
    csrftoken = getCookie('csrftoken');    
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const registerBtn = document.getElementById('registerBtn');
        
        registerBtn.disabled = true;
        registerBtn.innerHTML = 'Creating Account...';
        
        try {
            const response = await fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrftoken   
                },
                credentials: 'same-origin'
            });

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.error("Unexpected non-JSON response:", text);  
                alert("Server error – check logs.");
                registerBtn.disabled = false;
                registerBtn.innerHTML = 'Create Account';
                return;
            }
            
            if (data.success) {
                if (data.csrfToken) {
                    csrftoken = data.csrfToken;  
                    console.log("🔑 Updated CSRF token from backend:", csrftoken);
                    
                    const roleFormCSRF = document.querySelector('#roleForm [name=csrfmiddlewaretoken]');
                    if (roleFormCSRF) {
                        roleFormCSRF.value = csrftoken;
                    }
                } else {
                    csrftoken = getCookie('csrftoken');
                }

                const roleModal = new bootstrap.Modal(document.getElementById('roleModal'));
                roleModal.show();
            } else {
                alert(data.message || 'Registration failed');
                registerBtn.disabled = false;
                registerBtn.innerHTML = 'Create Account';
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
            registerBtn.disabled = false;
            registerBtn.innerHTML = 'Create Account';
        }
    });
});

let selectedRoleValue = '';

function selectRole(role, el) {
    document.querySelectorAll('.role-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    el.classList.add('selected');
    selectedRoleValue = role;
    document.getElementById('selectedRole').value = role;
    document.getElementById('continueBtn').disabled = false;
}

async function submitRole() {
    if (!selectedRoleValue) return;

    const continueBtn = document.getElementById('continueBtn');
    continueBtn.disabled = true;
    continueBtn.innerHTML = 'Setting up...';

    try {
        const roleForm = document.getElementById('roleForm');
        const formData = new FormData(roleForm);

        const currentCSRFToken = getCSRFTokenFromDOM() || csrftoken;
        
        const response = await fetch(roleForm.action, {
            method: 'POST',
            body: formData,
            headers: { 
                'X-CSRFToken': currentCSRFToken 
            },
            credentials: 'same-origin'
        });

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error("Unexpected non-JSON response:", text);
            alert("Server error – check logs.");
            continueBtn.disabled = false;
            continueBtn.innerHTML = 'Continue';
            return;
        }

        if (data.success) {
            window.location.href = data.redirect;
        } else {
            alert(data.message || 'Failed to save role');
            continueBtn.disabled = false;
            continueBtn.innerHTML = 'Continue';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
        continueBtn.disabled = false;
        continueBtn.innerHTML = 'Continue';
    }
}