from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

from db import db
from models import User, Cart

auth_routes = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_routes.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Проверка наличия необходимых полей
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Отсутствуют обязательные поля"}), 400
    
    # Проверка, существует ли пользователь с таким email
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Пользователь с таким email уже существует"}), 400
    
    # Создание нового пользователя
    user = User(
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        first_name=data.get('firstName', ''),
        last_name=data.get('lastName', ''),
        phone=data.get('phone', ''),
        registered_date=datetime.utcnow(),
        is_admin=False
    )
    
    # Добавление пользователя в базу данных
    db.session.add(user)
    db.session.commit()
    
    # Создание корзины для пользователя
    cart = Cart(
        user_id=user.id,
        created_date=datetime.utcnow()
    )
    
    db.session.add(cart)
    db.session.commit()
    
    # Генерация JWT токена
    access_token = create_access_token(identity=user.id)
    
    # Возвращаем токен и информацию о пользователе
    return jsonify({
        "token": access_token,
        "userId": user.id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "isAdmin": user.is_admin
    }), 201

@auth_routes.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Проверка наличия необходимых полей
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Отсутствуют обязательные поля"}), 400
    
    # Поиск пользователя по email
    user = User.query.filter_by(email=data['email']).first()
    
    # Если пользователь не найден или пароль неверный
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({"error": "Неверный email или пароль"}), 401
    
    # Генерация JWT токена
    access_token = create_access_token(identity=user.id)
    
    # Возвращаем токен и информацию о пользователе
    return jsonify({
        "token": access_token,
        "userId": user.id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "isAdmin": user.is_admin
    }), 200

@auth_routes.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    # Получение ID пользователя из JWT токена
    user_id = get_jwt_identity()
    
    # Поиск пользователя в базе данных
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404
    
    # Возвращаем информацию о пользователе
    return jsonify({
        "userId": user.id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "isAdmin": user.is_admin
    }), 200 