function onTelegramAuth(user) {
    console.log('Telegram auth:', user); // Для отладки

    fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    })
    .then(res => {
        if (!res.ok) {
            throw new Error('Auth failed');
        }
        return res.json();
    })
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            window.location.href = '/dashboard.html';
        } else {
            throw new Error('No token received');
        }
    })
    .catch(err => {
        console.error('Auth error:', err);
        alert('Ошибка авторизации. Попробуйте позже.');
    });
}

// Проверка авторизации на защищенных страницах
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token && !window.location.pathname.includes('index.html')) {
        window.location.href = '/';
    }
} 