from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

from db import db
from models import User, Order, OrderItem, Product

profile_routes = Blueprint('profile', __name__, url_prefix='/api/profile')

@profile_routes.route('/', methods=['GET'])
@jwt_required()
def get_profile():
    # Получение ID пользователя из JWT токена
    user_id = get_jwt_identity()
    
    # Поиск пользователя в базе данных
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404
    
    # Возвращаем информацию о пользователе
    return jsonify({
        "id": user.id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "phone": user.phone,
        "registeredDate": user.registered_date.isoformat(),
        "isAdmin": user.is_admin
    }), 200

@profile_routes.route('/', methods=['PUT'])
@jwt_required()
def update_profile():
    # Получение ID пользователя из JWT токена
    user_id = get_jwt_identity()
    
    # Получение данных из запроса
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Отсутствуют данные для обновления"}), 400
    
    # Поиск пользователя в базе данных
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404
    
    # Обновление данных пользователя
    if 'firstName' in data:
        user.first_name = data['firstName']
    
    if 'lastName' in data:
        user.last_name = data['lastName']
    
    if 'phone' in data:
        user.phone = data['phone']
    
    db.session.commit()
    
    return jsonify({
        "message": "Профиль обновлен",
        "user": {
            "id": user.id,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "phone": user.phone
        }
    }), 200

@profile_routes.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    # Получение ID пользователя из JWT токена
    user_id = get_jwt_identity()
    
    # Получение данных из запроса
    data = request.get_json()
    
    if not data or not data.get('currentPassword') or not data.get('newPassword'):
        return jsonify({"error": "Отсутствуют обязательные поля"}), 400
    
    # Поиск пользователя в базе данных
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404
    
    # Проверка текущего пароля
    if not check_password_hash(user.password_hash, data['currentPassword']):
        return jsonify({"error": "Неверный текущий пароль"}), 401
    
    # Обновление пароля
    user.password_hash = generate_password_hash(data['newPassword'])
    db.session.commit()
    
    return jsonify({"message": "Пароль успешно изменен"}), 200

@profile_routes.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
    # Получение ID пользователя из JWT токена
    user_id = get_jwt_identity()
    
    # Поиск пользователя в базе данных
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404
    
    # Получение заказов пользователя
    orders = []
    
    for order in user.orders:
        order_data = {
            "id": order.id,
            "date": order.order_date.isoformat(),
            "status": order.status,
            "totalAmount": order.total_amount,
            "items": []
        }
        
        # Получение элементов заказа
        for item in order.items:
            product = Product.query.get(item.product_id)
            
            if product:
                order_data["items"].append({
                    "id": item.id,
                    "productId": product.id,
                    "name": product.name,
                    "size": item.size,
                    "price": item.price,
                    "quantity": item.quantity,
                    "total": item.price * item.quantity
                })
        
        orders.append(order_data)
    
    return jsonify({"orders": orders}), 200

@profile_routes.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order_details(order_id):
    # Получение ID пользователя из JWT токена
    user_id = get_jwt_identity()
    
    # Поиск заказа
    order = Order.query.filter_by(id=order_id, user_id=user_id).first()
    
    if not order:
        return jsonify({"error": "Заказ не найден"}), 404
    
    # Получение элементов заказа
    items = []
    
    for item in order.items:
        product = Product.query.get(item.product_id)
        
        if product:
            items.append({
                "id": item.id,
                "productId": product.id,
                "name": product.name,
                "size": item.size,
                "price": item.price,
                "quantity": item.quantity,
                "total": item.price * item.quantity,
                "imagePath": product.image_path
            })
    
    order_data = {
        "id": order.id,
        "date": order.order_date.isoformat(),
        "status": order.status,
        "totalAmount": order.total_amount,
        "shippingAddress": order.shipping_address,
        "items": items
    }
    
    return jsonify(order_data), 200 