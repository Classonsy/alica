// Класс для управления профилем пользователя
class ProfileManager {
    constructor() {
        this.apiUrl = '/api/profile';
        this.user = null;
        
        // Инициализация
        this.init();
    }
    
    // Инициализация
    async init() {
        // Проверяем авторизацию
        const token = localStorage.getItem('token');
        
        if (!token) {
            this.showAuthRequired();
            return;
        }
        
        // Загружаем данные профиля
        await this.loadProfileData();
        
        // Если пользователь авторизован, загружаем историю заказов
        if (this.user) {
            this.loadOrderHistory();
        }
        
        // Настройка обработчиков событий
        this.setupEventListeners();
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Обработчики для вкладок профиля
        const tabs = document.querySelectorAll('.profile-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Убираем активный класс со всех вкладок
                tabs.forEach(t => t.classList.remove('active'));
                // Добавляем активный класс текущей вкладке
                tab.classList.add('active');
                
                // Скрываем все контенты вкладок
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Показываем контент выбранной вкладки
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
        
        // Обработчик отправки формы профиля
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
        }
        
        // Обработчик отправки формы смены пароля
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword();
            });
        }
        
        // Обработчик клика по кнопке входа для неавторизованных пользователей
        const loginButton = document.getElementById('login-button');
        if (loginButton) {
            loginButton.addEventListener('click', () => {
                if (window.authManager) {
                    window.authManager.openAuthModal('login');
                }
            });
        }
    }
    
    // Загрузка данных профиля
    async loadProfileData() {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                return;
            }
            
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                this.user = await response.json();
                
                // Показываем контент профиля
                document.getElementById('profile-content').style.display = 'block';
                document.getElementById('auth-required').style.display = 'none';
                
                // Заполняем форму профиля
                this.fillProfileForm();
                
                // Обновляем заголовок профиля
                this.updateProfileHeader();
            } else {
                // Если токен недействителен, показываем сообщение о необходимости авторизации
                this.showAuthRequired();
                
                // Если есть менеджер авторизации, выходим из аккаунта
                if (window.authManager) {
                    window.authManager.logout();
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки данных профиля:', error);
            this.showAuthRequired();
        }
    }
    
    // Заполнение формы профиля
    fillProfileForm() {
        if (!this.user) {
            return;
        }
        
        const emailInput = document.getElementById('email');
        const firstNameInput = document.getElementById('first-name');
        const lastNameInput = document.getElementById('last-name');
        const phoneInput = document.getElementById('phone');
        
        if (emailInput) emailInput.value = this.user.email || '';
        if (firstNameInput) firstNameInput.value = this.user.firstName || '';
        if (lastNameInput) lastNameInput.value = this.user.lastName || '';
        if (phoneInput) phoneInput.value = this.user.phone || '';
    }
    
    // Обновление заголовка профиля
    updateProfileHeader() {
        if (!this.user) {
            return;
        }
        
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileAvatar = document.getElementById('profile-avatar');
        
        if (profileName) {
            profileName.textContent = `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim() || 'Пользователь';
        }
        
        if (profileEmail) {
            profileEmail.textContent = this.user.email || '';
        }
        
        if (profileAvatar) {
            if (this.user.firstName) {
                profileAvatar.textContent = this.user.firstName.charAt(0).toUpperCase();
            } else if (this.user.email) {
                profileAvatar.textContent = this.user.email.charAt(0).toUpperCase();
            } else {
                profileAvatar.textContent = 'A';
            }
        }
    }
    
    // Показ сообщения о необходимости авторизации
    showAuthRequired() {
        document.getElementById('profile-content').style.display = 'none';
        document.getElementById('auth-required').style.display = 'block';
    }
    
    // Обновление профиля
    async updateProfile() {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                this.showAuthRequired();
                return;
            }
            
            const firstName = document.getElementById('first-name').value;
            const lastName = document.getElementById('last-name').value;
            const phone = document.getElementById('phone').value;
            
            const response = await fetch(`${this.apiUrl}/update`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone
                })
            });
            
            if (response.ok) {
                // Обновляем данные пользователя
                this.user = await response.json();
                
                // Обновляем заголовок профиля
                this.updateProfileHeader();
                
                // Показываем уведомление об успешном обновлении
                this.showNotification('Профиль успешно обновлен');
                
                // Обновляем данные в менеджере авторизации
                if (window.authManager && window.authManager.user) {
                    window.authManager.user.firstName = firstName;
                    window.authManager.user.lastName = lastName;
                    window.authManager.updateUI();
                }
            } else {
                const errorData = await response.json();
                const errorMessage = document.getElementById('profile-error');
                errorMessage.textContent = errorData.message || 'Ошибка обновления профиля';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Ошибка обновления профиля:', error);
            const errorMessage = document.getElementById('profile-error');
            errorMessage.textContent = 'Ошибка обновления профиля. Пожалуйста, попробуйте позже';
            errorMessage.style.display = 'block';
        }
    }
    
    // Смена пароля
    async changePassword() {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                this.showAuthRequired();
                return;
            }
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const errorMessage = document.getElementById('password-error');
            
            // Проверяем совпадение паролей
            if (newPassword !== confirmPassword) {
                errorMessage.textContent = 'Пароли не совпадают';
                errorMessage.style.display = 'block';
                return;
            }
            
            const response = await fetch(`${this.apiUrl}/change-password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            });
            
            if (response.ok) {
                // Очищаем форму
                document.getElementById('password-form').reset();
                
                // Показываем уведомление об успешной смене пароля
                this.showNotification('Пароль успешно изменен');
            } else {
                const errorData = await response.json();
                errorMessage.textContent = errorData.message || 'Ошибка смены пароля';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Ошибка смены пароля:', error);
            const errorMessage = document.getElementById('password-error');
            errorMessage.textContent = 'Ошибка смены пароля. Пожалуйста, попробуйте позже';
            errorMessage.style.display = 'block';
        }
    }
    
    // Загрузка истории заказов
    async loadOrderHistory() {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                return;
            }
            
            const response = await fetch(`${this.apiUrl}/orders`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const orders = await response.json();
                const orderList = document.getElementById('order-list');
                
                if (!orderList) {
                    return;
                }
                
                // Очищаем список заказов
                orderList.innerHTML = '';
                
                if (orders.length === 0) {
                    orderList.innerHTML = '<div class="empty-orders">У вас пока нет заказов</div>';
                    return;
                }
                
                // Добавляем заказы в список
                orders.forEach(order => {
                    const orderDate = new Date(order.orderDate).toLocaleDateString('ru-RU');
                    const orderItem = document.createElement('div');
                    orderItem.className = 'order-item';
                    
                    // Определяем класс статуса
                    let statusClass = '';
                    let statusText = order.status;
                    
                    switch (order.status.toLowerCase()) {
                        case 'completed':
                            statusClass = 'completed';
                            statusText = 'Выполнен';
                            break;
                        case 'processing':
                            statusClass = 'processing';
                            statusText = 'В обработке';
                            break;
                        default:
                            statusClass = '';
                    }
                    
                    orderItem.innerHTML = `
                        <div class="order-header">
                            <div class="order-number">Заказ #${order.id}</div>
                            <div class="order-date">${orderDate}</div>
                            <div class="order-status ${statusClass}">${statusText}</div>
                        </div>
                        <div class="order-details">
                            <div class="order-products">
                                ${order.items.map(item => `
                                    <div class="order-product">
                                        <div class="order-product-name">${item.productName}</div>
                                        <div class="order-product-size">${item.size}</div>
                                        <div class="order-product-quantity">x${item.quantity}</div>
                                        <div class="order-product-price">${item.price * item.quantity} ₽</div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="order-total">Итого: ${order.totalAmount} ₽</div>
                        </div>
                    `;
                    
                    // Добавляем обработчик клика для раскрытия деталей заказа
                    const orderHeader = orderItem.querySelector('.order-header');
                    const orderDetails = orderItem.querySelector('.order-details');
                    
                    orderHeader.addEventListener('click', function() {
                        orderDetails.classList.toggle('show');
                    });
                    
                    orderList.appendChild(orderItem);
                });
            } else {
                console.error('Ошибка загрузки истории заказов:', response.statusText);
            }
        } catch (error) {
            console.error('Ошибка загрузки истории заказов:', error);
        }
    }
    
    // Показ уведомления
    showNotification(message, type = 'success') {
        // Если есть менеджер авторизации, используем его метод
        if (window.authManager && window.authManager.showNotification) {
            window.authManager.showNotification(message, type);
            return;
        }
        
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

// Инициализация менеджера профиля при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, находимся ли мы на странице профиля
    if (window.location.pathname === '/profile.html') {
        window.profileManager = new ProfileManager();
    }
}); 