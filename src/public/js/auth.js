function onTelegramAuth(user) {
    console.log('Telegram auth data:', user);

    if (!user) {
        console.error('No user data received from Telegram');
        return;
    }

    document.querySelector('.auth-section').innerHTML += '<div class="loading">Выполняется вход...</div>';

    fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(user),
        credentials: 'include'
    })
    .then(res => {
        console.log('Auth response status:', res.status);
        if (!res.ok) {
            return res.json().then(err => {
                throw new Error(err.error || 'Authentication failed');
            });
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
        document.querySelector('.loading')?.remove();
        alert('Ошибка авторизации: ' + err.message);
    });
}

// Проверка авторизации на защищенных страницах
function checkAuth() {
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;
    
    // Список защищенных страниц
    const protectedPages = ['/dashboard.html', '/tasks.html', '/projects.html', '/stats.html'];
    
    if (!token && protectedPages.includes(currentPath)) {
        window.location.href = '/';
    }
}

// Добавляем слушатель для отладки
window.addEventListener('load', () => {
    console.log('Auth script loaded');
    if (window.Telegram) {
        console.log('Telegram widget available');
    }
}); 