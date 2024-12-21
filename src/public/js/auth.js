function onTelegramAuth(user) {
    console.log('Telegram auth data received:', user);

    if (!user) {
        console.error('No user data received from Telegram');
        showAuthError('Ошибка получения данных пользователя');
        return;
    }

    // Предотвращаем обновление страницы
    event.preventDefault();

    showLoading();
    
    fetch('https://mytasks.store/api/auth/telegram', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(user),
        credentials: 'include'
    })
    .then(response => {
        console.log('Auth response status:', response.status);
        return response.json().then(data => {
            if (!response.ok) throw new Error(data.error || 'Authentication failed');
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
    .catch(error => {
        console.error('Auth error:', error);
        showAuthError(error.message);
    })
    .finally(hideLoading);
}

function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'auth-loading';
    loadingDiv.className = 'loading';
    loadingDiv.textContent = 'Выполняется вход...';
    document.querySelector('.auth-section').appendChild(loadingDiv);
}

function hideLoading() {
    const loadingDiv = document.getElementById('auth-loading');
    if (loadingDiv) loadingDiv.remove();
}

function showAuthError(message) {
    const authStatus = document.getElementById('auth-status');
    authStatus.textContent = 'Ошибка авторизации: ' + message;
    authStatus.style.backgroundColor = '#fee2e2';
    authStatus.style.color = '#dc2626';
    authStatus.style.padding = '10px';
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Добавляем отладочную информацию
console.log('Auth script loaded');
window.addEventListener('load', () => {
    console.log('Page loaded');
    if (window.Telegram) {
        console.log('Telegram widget available');
    }
}); 