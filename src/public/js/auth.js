function onTelegramAuth(user) {
    console.log('Telegram auth data:', user);

    if (!user) {
        console.error('No user data received from Telegram');
        return;
    }

    // Показываем индикатор загрузки
    const authSection = document.querySelector('.auth-section');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = 'Выполняется вход...';
    authSection.appendChild(loadingDiv);

    // Отправляем запрос на сервер
    fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(user)
    })
    .then(res => {
        console.log('Auth response:', res.status);
        return res.json().then(data => {
            if (!res.ok) throw new Error(data.error || 'Authentication failed');
            return data;
        });
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
        loadingDiv.remove();
        alert('Ошибка авторизации: ' + err.message);
    });
}

// Добавляем отладочную информацию
console.log('Auth script loaded');
window.addEventListener('load', () => {
    console.log('Page loaded');
    if (window.Telegram) {
        console.log('Telegram widget available');
    }
}); 