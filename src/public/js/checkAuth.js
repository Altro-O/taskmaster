function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Добавляем проверку при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
}); 