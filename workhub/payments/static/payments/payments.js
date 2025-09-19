function releasePayment(jobId) {
    if (!confirm('Are you sure you want to claim this payment?')) return;

    const url = document.getElementById('releasePaymentUrl').value;
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ job_id: jobId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.toast) {
                window.toast.success('Success', data.message);
            } else {
                alert(data.message);
            }
            setTimeout(() => location.reload(), 1500);
        } else {
            if (window.toast) {
                window.toast.error('Error', data.error);
            } else {
                alert('Error: ' + data.error);
            }
        }
    })
    .catch(error => {
        if (window.toast) {
            window.toast.error('Error', 'An error occurred. Please try again.');
        } else {
            alert('An error occurred. Please try again.');
        }
        console.error('Error:', error);
    });
}
