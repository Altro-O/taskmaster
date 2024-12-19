function onTelegramAuth(user) {
    console.log('Telegram auth data:', user);

    if (!user) {
        console.error('No user data received from Telegram');
        return;
    }

    fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    })
    .then(res => {
        console.log('Auth response status:', res.status);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        console.log('Auth success:', data);
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/dashboard.html';
        } else {
            throw new Error('No token received');
        }
    })
    .catch(err => {
        console.error('Auth error:', err);
        alert('Ошибка авторизации: ' + err.message);
    });
}

// Проверка авторизации на защищенных страницах
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token && !window.location.pathname.includes('index.html')) {
        window.location.href = '/';
    }
} 