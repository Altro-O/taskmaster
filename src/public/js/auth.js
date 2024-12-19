function onTelegramAuth(user) {
    console.log('Telegram auth data:', user);

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
            return res.text().then(text => {
                console.error('Auth error response:', text);
                throw new Error('Auth failed: ' + text);
            });
        }
        return res.json();
    })
    .then(data => {
        console.log('Auth success:', data);
        if (data.token) {
            localStorage.setItem('token', data.token);
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