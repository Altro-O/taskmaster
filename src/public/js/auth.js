const telegramAuth = (user) => {
    fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    })
    .then(res => res.json())
    .then(data => {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard.html';
    });
}; 