// Класс для управления авторизацией
class AuthManager {
    constructor() {
        this.apiUrl = '/api/auth';
        this.token = localStorage.getItem('token');
        this.user = null;
        this.authModal = document.getElementById('auth-modal');
        
        // Инициализация
        this.init();
        
        // Настройка обработчиков событий
        this.setupEventListeners();
    }
    
    // Инициализация
    async init() {
        // Проверяем, авторизован ли пользователь
        if (this.token) {
            await this.loadUserInfo();
        }
        
        // Обновляем интерфейс
        this.updateUI();
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Обработчик клика по иконке пользователя
        document.querySelector('.icon.user').addEventListener('click', (e) => {
            e.preventDefault();
            
            if (this.user) {
                // Если пользователь авторизован, открываем профиль
                window.location.href = '/profile.html';
            } else {
                // Если пользователь не авторизован, открываем модальное окно авторизации
                this.openAuthModal('login');
            }
        });
        
        // Обработчик клика по кнопке закрытия модального окна
        if (this.authModal) {
            const closeButton = this.authModal.querySelector('.modal-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    this.closeAuthModal();
                });
            }
            
            // Закрытие модального окна при клике вне его содержимого
            this.authModal.addEventListener('click', (e) => {
                if (e.target === this.authModal) {
                    this.closeAuthModal();
                }
            });
            
            // Обработчик переключения между формами входа и регистрации
            const switchToRegister = this.authModal.querySelector('.switch-to-register');
            const switchToLogin = this.authModal.querySelector('.switch-to-login');
            
            if (switchToRegister) {
                switchToRegister.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchForm('register');
                });
            }
            
            if (switchToLogin) {
                switchToLogin.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchForm('login');
                });
            }
            
            // Обработчик отправки формы входа
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.login();
                });
            }
            
            // Обработчик отправки формы регистрации
            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                registerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.register();
                });
            }
        }
        
        // Обработчик клика по кнопке выхода
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }
    
    // Загрузка информации о пользователе
    async loadUserInfo() {
        try {
            const response = await fetch(`${this.apiUrl}/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                this.user = await response.json();
            } else {
                // Если токен недействителен, выходим из аккаунта
                this.logout();
            }
        } catch (error) {
            console.error('Ошибка загрузки информации о пользователе:', error);
            this.logout();
        }
    }
    
    // Обновление интерфейса
    updateUI() {
        const userIcon = document.querySelector('.icon.user');
        
        if (this.user) {
            // Если пользователь авторизован
            if (userIcon) {
                userIcon.classList.add('logged-in');
                userIcon.setAttribute('title', `${this.user.firstName || 'Пользователь'}`);
            }
            
            // Обновляем элементы профиля, если они есть на странице
            const profileName = document.getElementById('profile-name');
            const profileEmail = document.getElementById('profile-email');
            
            if (profileName) {
                profileName.textContent = `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim() || 'Пользователь';
            }
            
            if (profileEmail) {
                profileEmail.textContent = this.user.email || '';
            }
            
            // Показываем кнопку выхода
            const logoutButton = document.getElementById('logout-button');
            if (logoutButton) {
                logoutButton.style.display = 'block';
            }
        } else {
            // Если пользователь не авторизован
            if (userIcon) {
                userIcon.classList.remove('logged-in');
                userIcon.setAttribute('title', 'Войти');
            }
            
            // Скрываем кнопку выхода
            const logoutButton = document.getElementById('logout-button');
            if (logoutButton) {
                logoutButton.style.display = 'none';
            }
        }
    }
    
    // Открытие модального окна авторизации
    openAuthModal(formType = 'login') {
        if (this.authModal) {
            // Показываем нужную форму
            this.switchForm(formType);
            
            // Показываем модальное окно
            this.authModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Закрытие модального окна авторизации
    closeAuthModal() {
        if (this.authModal) {
            this.authModal.classList.remove('show');
            document.body.style.overflow = '';
            
            // Очищаем формы
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            
            if (loginForm) loginForm.reset();
            if (registerForm) registerForm.reset();
            
            // Скрываем сообщения об ошибках
            const errorMessages = this.authModal.querySelectorAll('.error-message');
            errorMessages.forEach(message => {
                message.textContent = '';
                message.style.display = 'none';
            });
        }
    }
    
    // Переключение между формами входа и регистрации
    switchForm(formType) {
        const loginForm = document.getElementById('login-form-container');
        const registerForm = document.getElementById('register-form-container');
        
        if (loginForm && registerForm) {
            if (formType === 'login') {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
            }
        }
    }
    
    // Вход в аккаунт
    async login() {
        const loginForm = document.getElementById('login-form');
        const errorMessage = document.getElementById('login-error');
        
        if (!loginForm || !errorMessage) {
            return;
        }
        
        // Получаем данные формы
        const email = loginForm.querySelector('input[name="email"]').value;
        const password = loginForm.querySelector('input[name="password"]').value;
        
        // Проверяем заполнение полей
        if (!email || !password) {
            errorMessage.textContent = 'Пожалуйста, заполните все поля';
            errorMessage.style.display = 'block';
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Сохраняем токен и информацию о пользователе
                this.token = data.token;
                this.user = {
                    id: data.userId,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    isAdmin: data.isAdmin
                };
                
                localStorage.setItem('token', this.token);
                
                // Закрываем модальное окно
                this.closeAuthModal();
                
                // Обновляем интерфейс
                this.updateUI();
                
                // Показываем уведомление об успешном входе
                this.showNotification('Вы успешно вошли в аккаунт');
                
                // Перенаправляем на главную страницу
                if (window.location.pathname === '/login.html') {
                    window.location.href = '/';
                }
                
                // Если есть корзина, обновляем ее
                if (window.cart) {
                    window.cart.init();
                }
            } else {
                const errorData = await response.json();
                errorMessage.textContent = errorData.message || 'Неверный email или пароль';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            errorMessage.textContent = 'Ошибка входа. Пожалуйста, попробуйте позже';
            errorMessage.style.display = 'block';
        }
    }
    
    // Регистрация
    async register() {
        const registerForm = document.getElementById('register-form');
        const errorMessage = document.getElementById('register-error');
        
        if (!registerForm || !errorMessage) {
            return;
        }
        
        // Получаем данные формы
        const email = registerForm.querySelector('input[name="email"]').value;
        const password = registerForm.querySelector('input[name="password"]').value;
        const confirmPassword = registerForm.querySelector('input[name="confirm-password"]').value;
        const firstName = registerForm.querySelector('input[name="first-name"]').value;
        const lastName = registerForm.querySelector('input[name="last-name"]').value;
        const phone = registerForm.querySelector('input[name="phone"]').value;
        
        // Проверяем заполнение обязательных полей
        if (!email || !password || !confirmPassword) {
            errorMessage.textContent = 'Пожалуйста, заполните все обязательные поля';
            errorMessage.style.display = 'block';
            return;
        }
        
        // Проверяем совпадение паролей
        if (password !== confirmPassword) {
            errorMessage.textContent = 'Пароли не совпадают';
            errorMessage.style.display = 'block';
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Сохраняем токен и информацию о пользователе
                this.token = data.token;
                this.user = {
                    id: data.userId,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    isAdmin: data.isAdmin
                };
                
                localStorage.setItem('token', this.token);
                
                // Закрываем модальное окно
                this.closeAuthModal();
                
                // Обновляем интерфейс
                this.updateUI();
                
                // Показываем уведомление об успешной регистрации
                this.showNotification('Вы успешно зарегистрировались');
                
                // Перенаправляем на главную страницу
                if (window.location.pathname === '/register.html') {
                    window.location.href = '/';
                }
                
                // Если есть корзина, обновляем ее
                if (window.cart) {
                    window.cart.init();
                }
            } else {
                const errorData = await response.json();
                errorMessage.textContent = errorData.message || 'Ошибка регистрации';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            errorMessage.textContent = 'Ошибка регистрации. Пожалуйста, попробуйте позже';
            errorMessage.style.display = 'block';
        }
    }
    
    // Выход из аккаунта
    logout() {
        // Удаляем токен и информацию о пользователе
        this.token = null;
        this.user = null;
        
        localStorage.removeItem('token');
        
        // Обновляем интерфейс
        this.updateUI();
        
        // Показываем уведомление о выходе
        this.showNotification('Вы вышли из аккаунта');
        
        // Если текущая страница - профиль, перенаправляем на главную
        if (window.location.pathname === '/profile.html') {
            window.location.href = '/';
        }
        
        // Если есть корзина, обновляем ее
        if (window.cart) {
            window.cart.init();
        }
    }
    
    // Проверка авторизации
    isAuthenticated() {
        return !!this.token && !!this.user;
    }
    
    // Проверка роли администратора
    isAdmin() {
        return this.isAuthenticated() && this.user.isAdmin;
    }
    
    // Показ уведомления
    showNotification(message, type = 'success') {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Добавляем уведомление на страницу
        document.body.appendChild(notification);
        
        // Показываем уведомление
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Скрываем уведомление через 3 секунды
        setTimeout(() => {
            notification.classList.remove('show');
            
            // Удаляем уведомление после анимации скрытия
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Инициализация менеджера авторизации при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
}); 