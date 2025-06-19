// Класс для работы с корзиной
class ShoppingCart {
    constructor() {
        this.apiUrl = '/api/cart';
        this.items = [];
        this.totalPrice = 0;
        this.totalItems = 0;
        this.cartModal = document.getElementById('cart-modal');
        this.cartCounter = document.querySelector('.cart-counter');
        this.cartItemsContainer = document.getElementById('cart-items');
        this.cartTotalPrice = document.getElementById('cart-total-price');
        
        // Инициализация корзины
        this.init();
        
        // Обработчики событий
        this.setupEventListeners();
    }
    
    // Инициализация корзины
    async init() {
        // Проверяем, авторизован ли пользователь
        const token = localStorage.getItem('token');
        
        if (token) {
            // Если пользователь авторизован, загружаем корзину с сервера
            await this.loadCart();
        } else {
            // Если пользователь не авторизован, загружаем корзину из localStorage
            this.loadLocalCart();
        }
        
        // Обновляем счетчик товаров в корзине
        this.updateCartCounter();
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Обработчик клика по иконке корзины
        document.querySelector('.icon.cart').addEventListener('click', (e) => {
            e.preventDefault();
            this.openCart();
        });
        
        // Обработчик клика по кнопке закрытия модального окна
        if (this.cartModal) {
            const closeButton = this.cartModal.querySelector('.modal-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    this.closeCart();
                });
            }
            
            // Закрытие модального окна при клике вне его содержимого
            this.cartModal.addEventListener('click', (e) => {
                if (e.target === this.cartModal) {
                    this.closeCart();
                }
            });
            
            // Обработчик клика по кнопке "Оформить заказ"
            const checkoutButton = document.getElementById('checkout-button');
            if (checkoutButton) {
                checkoutButton.addEventListener('click', () => {
                    this.checkout();
                });
            }
        }
    }
    
    // Загрузка корзины с сервера
    async loadCart() {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                return;
            }
            
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.items = data.items || [];
                this.totalPrice = data.totalPrice || 0;
                this.totalItems = data.totalItems || 0;
                
                // Обновляем счетчик товаров
                this.updateCartCounter();
            } else {
                console.error('Ошибка загрузки корзины:', response.statusText);
            }
        } catch (error) {
            console.error('Ошибка загрузки корзины:', error);
        }
    }
    
    // Загрузка корзины из localStorage
    loadLocalCart() {
        const localCart = localStorage.getItem('cart');
        
        if (localCart) {
            try {
                const cartData = JSON.parse(localCart);
                this.items = cartData.items || [];
                this.totalPrice = cartData.totalPrice || 0;
                this.totalItems = cartData.totalItems || 0;
            } catch (error) {
                console.error('Ошибка загрузки локальной корзины:', error);
                this.items = [];
                this.totalPrice = 0;
                this.totalItems = 0;
            }
        } else {
            this.items = [];
            this.totalPrice = 0;
            this.totalItems = 0;
        }
    }
    
    // Сохранение корзины в localStorage
    saveLocalCart() {
        const cartData = {
            items: this.items,
            totalPrice: this.totalPrice,
            totalItems: this.totalItems
        };
        
        localStorage.setItem('cart', JSON.stringify(cartData));
    }
    
    // Добавление товара в корзину
    async addToCart(productId, quantity, size) {
        const token = localStorage.getItem('token');
        
        if (token) {
            // Если пользователь авторизован, добавляем товар на сервер
            try {
                const response = await fetch(`${this.apiUrl}/add`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        productId: productId,
                        quantity: quantity,
                        size: size
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.items = data.items || [];
                    this.totalPrice = data.totalPrice || 0;
                    this.totalItems = data.totalItems || 0;
                    
                    // Обновляем счетчик товаров
                    this.updateCartCounter();
                    
                    // Показываем уведомление
                    this.showNotification('Товар добавлен в корзину');
                } else {
                    console.error('Ошибка добавления товара в корзину:', response.statusText);
                }
            } catch (error) {
                console.error('Ошибка добавления товара в корзину:', error);
            }
        } else {
            // Если пользователь не авторизован, добавляем товар в localStorage
            // Получаем информацию о товаре
            const product = await this.getProductInfo(productId);
            
            if (!product) {
                console.error('Товар не найден');
                return;
            }
            
            // Проверяем, есть ли уже такой товар в корзине
            const existingItemIndex = this.items.findIndex(item => 
                item.productId === productId && item.size === size);
            
            if (existingItemIndex !== -1) {
                // Если товар уже есть, увеличиваем количество
                this.items[existingItemIndex].quantity += quantity;
            } else {
                // Если товара нет, добавляем новый элемент
                const productSize = product.sizes.find(s => s.size === size) || { price: product.price };
                
                this.items.push({
                    id: Date.now(), // Временный ID
                    productId: productId,
                    productName: product.name,
                    imagePath: product.imagePath,
                    quantity: quantity,
                    size: size,
                    price: productSize.price
                });
            }
            
            // Пересчитываем общую сумму и количество товаров
            this.recalculateCart();
            
            // Сохраняем корзину в localStorage
            this.saveLocalCart();
            
            // Обновляем счетчик товаров
            this.updateCartCounter();
            
            // Показываем уведомление
            this.showNotification('Товар добавлен в корзину');
        }
    }
    
    // Получение информации о товаре
    async getProductInfo(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            
            if (response.ok) {
                return await response.json();
            } else {
                console.error('Ошибка получения информации о товаре:', response.statusText);
                return null;
            }
        } catch (error) {
            console.error('Ошибка получения информации о товаре:', error);
            return null;
        }
    }
    
    // Обновление количества товара в корзине
    async updateCartItem(cartItemId, quantity) {
        const token = localStorage.getItem('token');
        
        if (token) {
            // Если пользователь авторизован, обновляем товар на сервере
            try {
                const response = await fetch(`${this.apiUrl}/update`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        cartItemId: cartItemId,
                        quantity: quantity
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.items = data.items || [];
                    this.totalPrice = data.totalPrice || 0;
                    this.totalItems = data.totalItems || 0;
                    
                    // Обновляем счетчик товаров
                    this.updateCartCounter();
                    
                    // Обновляем отображение корзины
                    this.renderCart();
                } else {
                    console.error('Ошибка обновления товара в корзине:', response.statusText);
                }
            } catch (error) {
                console.error('Ошибка обновления товара в корзине:', error);
            }
        } else {
            // Если пользователь не авторизован, обновляем товар в localStorage
            const itemIndex = this.items.findIndex(item => item.id === cartItemId);
            
            if (itemIndex !== -1) {
                if (quantity <= 0) {
                    // Если количество равно 0, удаляем товар из корзины
                    this.items.splice(itemIndex, 1);
                } else {
                    // Иначе обновляем количество
                    this.items[itemIndex].quantity = quantity;
                }
                
                // Пересчитываем общую сумму и количество товаров
                this.recalculateCart();
                
                // Сохраняем корзину в localStorage
                this.saveLocalCart();
                
                // Обновляем счетчик товаров
                this.updateCartCounter();
                
                // Обновляем отображение корзины
                this.renderCart();
            }
        }
    }
    
    // Удаление товара из корзины
    async removeFromCart(cartItemId) {
        const token = localStorage.getItem('token');
        
        if (token) {
            // Если пользователь авторизован, удаляем товар на сервере
            try {
                const response = await fetch(`${this.apiUrl}/remove/${cartItemId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.items = data.items || [];
                    this.totalPrice = data.totalPrice || 0;
                    this.totalItems = data.totalItems || 0;
                    
                    // Обновляем счетчик товаров
                    this.updateCartCounter();
                    
                    // Обновляем отображение корзины
                    this.renderCart();
                } else {
                    console.error('Ошибка удаления товара из корзины:', response.statusText);
                }
            } catch (error) {
                console.error('Ошибка удаления товара из корзины:', error);
            }
        } else {
            // Если пользователь не авторизован, удаляем товар из localStorage
            const itemIndex = this.items.findIndex(item => item.id === cartItemId);
            
            if (itemIndex !== -1) {
                this.items.splice(itemIndex, 1);
                
                // Пересчитываем общую сумму и количество товаров
                this.recalculateCart();
                
                // Сохраняем корзину в localStorage
                this.saveLocalCart();
                
                // Обновляем счетчик товаров
                this.updateCartCounter();
                
                // Обновляем отображение корзины
                this.renderCart();
            }
        }
    }
    
    // Очистка корзины
    async clearCart() {
        const token = localStorage.getItem('token');
        
        if (token) {
            // Если пользователь авторизован, очищаем корзину на сервере
            try {
                const response = await fetch(`${this.apiUrl}/clear`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    this.items = [];
                    this.totalPrice = 0;
                    this.totalItems = 0;
                    
                    // Обновляем счетчик товаров
                    this.updateCartCounter();
                    
                    // Обновляем отображение корзины
                    this.renderCart();
                } else {
                    console.error('Ошибка очистки корзины:', response.statusText);
                }
            } catch (error) {
                console.error('Ошибка очистки корзины:', error);
            }
        } else {
            // Если пользователь не авторизован, очищаем корзину в localStorage
            this.items = [];
            this.totalPrice = 0;
            this.totalItems = 0;
            
            // Сохраняем корзину в localStorage
            this.saveLocalCart();
            
            // Обновляем счетчик товаров
            this.updateCartCounter();
            
            // Обновляем отображение корзины
            this.renderCart();
        }
    }
    
    // Пересчет общей суммы и количества товаров
    recalculateCart() {
        this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
        this.totalPrice = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    // Обновление счетчика товаров в корзине
    updateCartCounter() {
        if (this.cartCounter) {
            this.cartCounter.textContent = this.totalItems > 0 ? this.totalItems : '';
            this.cartCounter.style.display = this.totalItems > 0 ? 'block' : 'none';
        }
    }
    
    // Открытие модального окна корзины
    openCart() {
        if (this.cartModal) {
            // Отображаем товары в корзине
            this.renderCart();
            
            // Показываем модальное окно
            this.cartModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Закрытие модального окна корзины
    closeCart() {
        if (this.cartModal) {
            this.cartModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
    
    // Отображение товаров в корзине
    renderCart() {
        if (!this.cartItemsContainer) {
            return;
        }
        
        // Очищаем контейнер
        this.cartItemsContainer.innerHTML = '';
        
        if (this.items.length === 0) {
            // Если корзина пуста, показываем сообщение
            this.cartItemsContainer.innerHTML = '<div class="empty-cart">Ваша корзина пуста</div>';
            
            if (this.cartTotalPrice) {
                this.cartTotalPrice.textContent = '0 ₽';
            }
            
            return;
        }
        
        // Добавляем товары
        this.items.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-image" style="background-image: url('${item.imagePath}')"></div>
                <div class="cart-item-details">
                    <h3>${item.productName}</h3>
                    <div class="cart-item-size">${item.size}</div>
                    <div class="cart-item-price">${item.price} ₽</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn minus">-</button>
                    <input type="number" value="${item.quantity}" min="1" max="99">
                    <button class="quantity-btn plus">+</button>
                </div>
                <div class="cart-item-total">${item.price * item.quantity} ₽</div>
                <button class="cart-item-remove">×</button>
            `;
            
            // Добавляем обработчики событий
            const quantityInput = cartItem.querySelector('input');
            const minusButton = cartItem.querySelector('.minus');
            const plusButton = cartItem.querySelector('.plus');
            const removeButton = cartItem.querySelector('.cart-item-remove');
            
            quantityInput.addEventListener('change', () => {
                const newQuantity = parseInt(quantityInput.value, 10);
                if (newQuantity >= 1) {
                    this.updateCartItem(item.id, newQuantity);
                }
            });
            
            minusButton.addEventListener('click', () => {
                const newQuantity = parseInt(quantityInput.value, 10) - 1;
                if (newQuantity >= 1) {
                    quantityInput.value = newQuantity;
                    this.updateCartItem(item.id, newQuantity);
                }
            });
            
            plusButton.addEventListener('click', () => {
                const newQuantity = parseInt(quantityInput.value, 10) + 1;
                if (newQuantity <= 99) {
                    quantityInput.value = newQuantity;
                    this.updateCartItem(item.id, newQuantity);
                }
            });
            
            removeButton.addEventListener('click', () => {
                this.removeFromCart(item.id);
            });
            
            this.cartItemsContainer.appendChild(cartItem);
        });
        
        // Обновляем общую сумму
        if (this.cartTotalPrice) {
            this.cartTotalPrice.textContent = `${this.totalPrice} ₽`;
        }
    }
    
    // Оформление заказа
    async checkout() {
        const token = localStorage.getItem('token');
        
        if (!token) {
            // Если пользователь не авторизован, показываем окно авторизации
            if (window.authManager) {
                window.authManager.openAuthModal('login');
                this.closeCart();
            } else {
                alert('Для оформления заказа необходимо авторизоваться');
            }
            return;
        }
        
        if (this.items.length === 0) {
            this.showNotification('Корзина пуста', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: this.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        size: item.size
                    }))
                })
            });
            
            if (response.ok) {
                // Очищаем корзину
                this.clearCart();
                
                // Закрываем модальное окно корзины
                this.closeCart();
                
                // Показываем уведомление об успешном оформлении заказа
                this.showNotification('Заказ успешно оформлен');
            } else {
                const errorData = await response.json();
                this.showNotification(`Ошибка оформления заказа: ${errorData.message || response.statusText}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка оформления заказа:', error);
            this.showNotification('Ошибка оформления заказа', 'error');
        }
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

// Инициализация корзины при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.cart = new ShoppingCart();
}); 