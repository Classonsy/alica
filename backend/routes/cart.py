from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from db import db
from models import Cart, CartItem, Product, ProductSize

cart_routes = Blueprint('cart', __name__, url_prefix='/api/cart')

@cart_routes.route('/', methods=['GET'])
@jwt_required()
def get_cart():
    # Получение ID пользователя из JWT токена
    user_id = get_jwt_identity()
    
    # Поиск корзины пользователя
    cart = Cart.query.filter_by(user_id=user_id).first()
    
    if not cart:
        return jsonify({"error": "Корзина не найдена"}), 404
    
    # Получение элементов корзины с информацией о продуктах
    cart_items = []
    total_price = 0
    
    for item in cart.items:
        product = Product.query.get(item.product_id)
        
        if not product:
            continue
        
        # Поиск размера продукта по названию
        size_info = ProductSize.query.filter_by(
            product_id=product.id,
            size=item.size
        ).first()
        
        price = size_info.price if size_info else product.price
        item_total = price * item.quantity
        total_price += item_total
        
        cart_items.append({
            "id": item.id,
            "productId": product.id,
            "name": product.name,
            "size": item.size,
            "price": price,
            "quantity": item.quantity,
            "imagePath": product.image_path,
            "total": item_total
        })
    
    return jsonify({
        "cartId": cart.id,
        "items": cart_items,
        "totalPrice": total_price,
        "itemCount": len(cart_items)
    }), 200

@cart_routes.route('/add', methods=['POST'])
@jwt_required()
def add_to_cart():
    # Получение ID пользователя из JWT токена
    user_id = get_jwt_identity()
    
    # Получение данных из запроса
    data = request.get_json()
    
    if not data or not data.get('productId') or not data.get('size'):
        return jsonify({"error": "Отсутствуют обязательные поля"}), 400
    
    product_id = data['productId']
    size = data['size']
    quantity = data.get('quantity', 1)
    
    # Проверка существования продукта
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Продукт не найден"}), 404
    
    # Проверка существования размера
    size_exists = ProductSize.query.filter_by(product_id=product_id, size=size).first()
    if not size_exists:
        return jsonify({"error": "Указанный размер продукта не существует"}), 400
    
    # Поиск корзины пользователя
    cart = Cart.query.filter_by(user_id=user_id).first()
    
    if not cart:
        # Создание новой корзины для пользователя
        cart = Cart(user_id=user_id, created_date=datetime.utcnow())
        db.session.add(cart)
        db.session.commit()
    
    # Проверка, есть ли уже такой продукт с таким размером в корзине
    existing_item = CartItem.query.filter_by(
        cart_id=cart.id,
        product_id=product_id,
        size=size
    ).first()
    
    if existing_item:
        # Увеличиваем количество
        existing_item.quantity += quantity
        db.session.commit()
        
        return jsonify({
            "message": "Количество продукта в корзине обновлено",
            "itemId": existing_item.id,
            "quantity": existing_item.quantity
        }), 200
    else:
        # Добавляем новый элемент в корзину
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=product_id,
            quantity=quantity,
            size=size,
            added_date=datetime.utcnow()
        )
        
        db.session.add(cart_item)
        db.session.commit()
        
        return jsonify({
            "message": "Продукт добавлен в корзину",
            "itemId": cart_item.id,
            "quantity": cart_item.quantity
        }), 201

@cart_routes.route('/update/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(item_id):
    # Получение ID пользователя из JWT токена
    user_id = get_jwt_identity()
    
    # Получение данных из запроса
    data = request.get_json()
    
    if not data or 'quantity' not in data:
        return jsonify({"error": "Отсутствует поле количества"}), 400
    
    quantity = data['quantity']
    
    # Проверка, что количество положительное
    if quantity <= 0:
        return jsonify({"error": "Количество должно быть положительным числом"}), 400
    
    # Поиск корзины пользователя
    cart = Cart.query.filter_by(user_id=user_id).first()
    
    if not cart:
        return jsonify({"error": "Корзина не найдена"}), 404
    
    # Поиск элемента корзины
    cart_item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
    
    if not cart_item:
        return jsonify({"error": "Элемент корзины не найден"}), 404
    
    # Обновление количества
    cart_item.quantity = quantity
    db.session.commit()
    
    return jsonify({
        "message": "Количество обновлено",
        "itemId": cart_item.id,
        "quantity": cart_item.quantity
    }), 200

@cart_routes.route('/remove/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    # Получение ID пользователя из JWT токена
    user_id = get_jwt_identity()
    
    # Поиск корзины пользователя
    cart = Cart.query.filter_by(user_id=user_id).first()
    
    if not cart:
        return jsonify({"error": "Корзина не найдена"}), 404
    
    # Поиск элемента корзины
    cart_item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
    
    if not cart_item:
        return jsonify({"error": "Элемент корзины не найден"}), 404
    
    # Удаление элемента из корзины
    db.session.delete(cart_item)
    db.session.commit()
    
    return jsonify({"message": "Продукт удален из корзины"}), 200

@cart_routes.route('/clear', methods=['DELETE'])
@jwt_required()
def clear_cart():
    # Получение ID пользователя из JWT токена
    user_id = get_jwt_identity()
    
    # Поиск корзины пользователя
    cart = Cart.query.filter_by(user_id=user_id).first()
    
    if not cart:
        return jsonify({"error": "Корзина не найдена"}), 404
    
    # Удаление всех элементов корзины
    CartItem.query.filter_by(cart_id=cart.id).delete()
    db.session.commit()
    
    return jsonify({"message": "Корзина очищена"}), 200 