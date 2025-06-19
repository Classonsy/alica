// Общий JavaScript для всех страниц

document.addEventListener('DOMContentLoaded', function() {
    // Обработка кнопки cookie
    const cookiePopup = document.querySelector('.cookie-popup');
    if (cookiePopup) {
        const cookieButton = cookiePopup.querySelector('button');
        cookieButton.addEventListener('click', function() {
            cookiePopup.style.display = 'none';
            localStorage.setItem('cookieAccepted', 'true');
        });
        
        // Проверка, была ли уже принята политика cookie
        if (localStorage.getItem('cookieAccepted') === 'true') {
            cookiePopup.style.display = 'none';
        }
    }
    
    // Обработка табов в меню
    const filterTabs = document.querySelectorAll('.filter-tab');
    if (filterTabs.length > 0) {
        filterTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Удаляем активный класс у всех табов
                filterTabs.forEach(t => t.classList.remove('active'));
                // Добавляем активный класс к нажатому табу
                this.classList.add('active');
                
                // Фильтрация элементов меню
                const category = this.textContent.trim();
                filterMenuItems(category);
            });
        });
    }
    
    // Функция для фильтрации элементов меню
    function filterMenuItems(category) {
        const menuItems = document.querySelectorAll('.menu-item');
        
        if (category === 'ВСЕ') {
            menuItems.forEach(item => {
                item.style.display = 'block';
            });
            return;
        }
        
        menuItems.forEach(item => {
            const itemCategory = item.getAttribute('data-category');
            if (itemCategory === category) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // Функция для мобильного меню (гамбургер)
    const menuIcon = document.querySelector('.icon.menu');
    if (menuIcon) {
        menuIcon.addEventListener('click', function() {
            const nav = document.querySelector('nav');
            nav.classList.toggle('mobile-open');
        });
    }
    
    // Анимация появления элементов при скролле
    function animateOnScroll() {
        const elements = document.querySelectorAll('.menu-item, .news-card, .coffee-shop-item');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('visible');
            }
        });
    }
    
    // Вызываем функцию при загрузке и скролле
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll();
    
    // Модальные окна для товаров
    const menuItems = document.querySelectorAll('.menu-item');
    const productModals = document.querySelectorAll('.product-modal');
    
    if (menuItems.length > 0) {
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                // Получаем ID товара из атрибута
                const productId = this.getAttribute('data-product');
                
                if (!productId) {
                    console.error('Отсутствует атрибут data-product для товара');
                    return;
                }
                
                // Находим соответствующее модальное окно
                const modal = document.getElementById(`${productId}-modal`);
                
                // Показываем модальное окно
                if (modal) {
                    modal.classList.add('show');
                    document.body.style.overflow = 'hidden';
                } else {
                    console.error(`Модальное окно для продукта ${productId} не найдено`);
                }
            });
        });
    }
    
    // Обработка иконок в хедере (корзина и профиль)
    const cartIcon = document.querySelector('.icon.cart');
    if (cartIcon) {
        cartIcon.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Проверяем, инициализирована ли корзина
            if (window.cart) {
                window.cart.openCart();
            } else {
                console.error('Корзина не инициализирована');
                
                // Если корзина не инициализирована, попробуем открыть модальное окно напрямую
                const cartModal = document.getElementById('cart-modal');
                if (cartModal) {
                    cartModal.classList.add('show');
                    document.body.style.overflow = 'hidden';
                }
            }
        });
    }
    
    const userIcon = document.querySelector('.icon.user');
    if (userIcon) {
        userIcon.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Проверяем, авторизован ли пользователь
            const token = localStorage.getItem('token');
            
            if (token) {
                // Если пользователь авторизован, перенаправляем на страницу профиля
                window.location.href = 'profile.html';
            } else {
                // Если пользователь не авторизован, открываем модальное окно авторизации
                if (window.authManager) {
                    window.authManager.openAuthModal('login');
                } else {
                    console.error('Менеджер авторизации не инициализирован');
                    
                    // Если менеджер авторизации не инициализирован, попробуем открыть модальное окно напрямую
                    const authModal = document.getElementById('auth-modal');
                    if (authModal) {
                        authModal.classList.add('show');
                        document.body.style.overflow = 'hidden';
                    }
                }
            }
        });
    }
    
    // Закрытие модальных окон
    const closeButtons = document.querySelectorAll('.modal-close');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Находим ближайшее модальное окно
            const modal = this.closest('.modal, .product-modal');
            if (modal) {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Закрытие модальных окон по клику вне их содержимого
    const modals = document.querySelectorAll('.modal, .product-modal');
    
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Обработка кнопок изменения количества
    const quantitySelectors = document.querySelectorAll('.quantity-selector');
    
    quantitySelectors.forEach(selector => {
        const minusBtn = selector.querySelector('.minus');
        const plusBtn = selector.querySelector('.plus');
        const input = selector.querySelector('input');
        
        if (minusBtn && plusBtn && input) {
            minusBtn.addEventListener('click', function() {
                let value = parseInt(input.value, 10);
                value = Math.max(1, value - 1);
                input.value = value;
            });
            
            plusBtn.addEventListener('click', function() {
                let value = parseInt(input.value, 10);
                value = Math.min(99, value + 1);
                input.value = value;
            });
        }
    });
    
    // Обработка выбора размера товара
    const sizeOptions = document.querySelectorAll('.modal-sizes .size');
    
    sizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Убираем выделение со всех размеров
            const sizes = this.parentElement.querySelectorAll('.size');
            sizes.forEach(size => {
                size.classList.remove('selected');
            });
            
            // Выделяем выбранный размер
            this.classList.add('selected');
            
            // Обновляем атрибут data-size у кнопки "Добавить в корзину"
            const addToCartBtn = this.closest('.modal-product-info').querySelector('.add-to-cart-btn');
            if (addToCartBtn) {
                const sizeText = this.querySelector('.volume').textContent.split(' ')[0];
                addToCartBtn.setAttribute('data-size', sizeText);
                
                // Обновляем цену
                const price = this.querySelector('.price').textContent;
                const priceDisplay = this.closest('.modal-product-info').querySelector('.modal-product-price');
                if (priceDisplay) {
                    priceDisplay.textContent = price;
                }
            }
        });
    });
    
    // Выделяем первый размер по умолчанию
    const defaultSizes = document.querySelectorAll('.modal-sizes .size:first-child');
    defaultSizes.forEach(size => {
        size.classList.add('selected');
    });
    
    // Обработка кнопок "Добавить в корзину"
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            const size = this.getAttribute('data-size');
            const quantityInput = this.parentElement.querySelector('input');
            const quantity = parseInt(quantityInput.value, 10);
            
            // Добавляем товар в корзину
            if (window.cart) {
                window.cart.addToCart(productId, quantity, size);
            }
            
            // Закрываем модальное окно товара
            const modal = this.closest('.modal, .product-modal');
            modal.classList.remove('show');
            document.body.style.overflow = '';
        });
    });
    
    // Обработка форм
    const forms = document.querySelectorAll('form:not(#login-form):not(#register-form):not(#profile-form):not(#password-form)');
    if (forms.length > 0) {
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Валидация формы
                const isValid = validateForm(this);
                
                if (isValid) {
                    // Имитация отправки формы
                    const formData = new FormData(this);
                    console.log('Отправка формы:', Object.fromEntries(formData));
                    
                    // Показываем сообщение об успешной отправке
                    const successMessage = document.createElement('div');
                    successMessage.className = 'success-message';
                    successMessage.textContent = 'Форма успешно отправлена!';
                    
                    form.appendChild(successMessage);
                    
                    // Очищаем форму
                    form.reset();
                    
                    // Удаляем сообщение через 3 секунды
                    setTimeout(() => {
                        successMessage.remove();
                    }, 3000);
                }
            });
        });
    }
    
    // Функция валидации формы
    function validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea');
        let isValid = true;
        
        inputs.forEach(input => {
            // Удаляем предыдущие сообщения об ошибках
            const errorMessage = input.nextElementSibling;
            if (errorMessage && errorMessage.classList.contains('error-message')) {
                errorMessage.remove();
            }
            
            if (input.hasAttribute('required') && !input.value.trim()) {
                isValid = false;
                showError(input, 'Это поле обязательно для заполнения');
            }
            
            // Проверка email
            if (input.type === 'email' && input.value.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value.trim())) {
                    isValid = false;
                    showError(input, 'Введите корректный email');
                }
            }
            
            // Проверка телефона
            if (input.type === 'tel' && input.value.trim()) {
                const phoneRegex = /^[+]?[\s0-9]{10,15}$/;
                if (!phoneRegex.test(input.value.trim())) {
                    isValid = false;
                    showError(input, 'Введите корректный номер телефона');
                }
            }
        });
        
        return isValid;
    }
    
    // Функция отображения ошибки
    function showError(input, message) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        
        input.parentNode.insertBefore(errorMessage, input.nextSibling);
    }
    
    // Инициализация корзины
    if (typeof ShoppingCart !== 'undefined') {
        window.cart = new ShoppingCart();
    }
    
    // Инициализация менеджера авторизации
    if (typeof AuthManager !== 'undefined') {
        window.authManager = new AuthManager();
    }
    
    // Инициализация менеджера профиля
    if (typeof ProfileManager !== 'undefined' && window.location.pathname === '/profile.html') {
        window.profileManager = new ProfileManager();
    }
});

// Имитация загрузки карты для страницы "Наши кофейни"
function initMap() {
    const mapElement = document.getElementById('map');
    if (mapElement) {
        // В реальном проекте здесь будет инициализация Яндекс.Карт или Google Maps
        console.log('Инициализация карты');
    }
}

// Вызов функции инициализации карты
window.onload = function() {
    initMap();
}; 