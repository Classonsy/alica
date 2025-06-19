import os
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import pathlib

from db import db

# Загрузка переменных окружения
load_dotenv()

# Определение пути к корню проекта (на уровень выше backend)
ROOT_DIR = pathlib.Path(__file__).parent.parent.resolve()

# Инициализация приложения Flask
app = Flask(__name__, static_folder=None)
CORS(app)

# Конфигурация базы данных (SQLite для простоты)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sova_coffee.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Конфигурация JWT
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'sova-coffee-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# Инициализация расширений
db.init_app(app)
jwt = JWTManager(app)

# Импорт маршрутов
from routes.auth import auth_routes
from routes.cart import cart_routes
from routes.profile import profile_routes
from routes.products import product_routes

# Регистрация маршрутов API
app.register_blueprint(auth_routes)
app.register_blueprint(cart_routes)
app.register_blueprint(profile_routes)
app.register_blueprint(product_routes)

# Маршрут для API
@app.route('/api')
def api_index():
    return jsonify({"message": "СОВА Coffee API"}), 200

# Обработка статических файлов (CSS, JS, изображения)
@app.route('/<path:filename>')
def serve_static(filename):
    # Проверяем, существует ли файл в корне проекта
    file_path = os.path.join(ROOT_DIR, filename)
    if os.path.isfile(file_path):
        return send_file(file_path)
    return send_from_directory(ROOT_DIR, filename)

# Обработка HTML страниц
@app.route('/')
def serve_index():
    return send_file(os.path.join(ROOT_DIR, 'index.html'))

@app.route('/menu')
def serve_menu():
    return send_file(os.path.join(ROOT_DIR, 'menu.html'))

@app.route('/our-coffee-shops')
def serve_shops():
    return send_file(os.path.join(ROOT_DIR, 'our-coffee-shops.html'))

@app.route('/contacts')
def serve_contacts():
    return send_file(os.path.join(ROOT_DIR, 'contacts.html'))

@app.route('/work-with-us')
def serve_work():
    return send_file(os.path.join(ROOT_DIR, 'work-with-us.html'))

@app.route('/franchise')
def serve_franchise():
    return send_file(os.path.join(ROOT_DIR, 'franchise.html'))

@app.route('/news')
def serve_news():
    return send_file(os.path.join(ROOT_DIR, 'news.html'))

@app.route('/statistics')
def serve_statistics():
    return send_file(os.path.join(ROOT_DIR, 'statistics.html'))

@app.route('/profile')
def serve_profile():
    return send_file(os.path.join(ROOT_DIR, 'profile.html'))

@app.errorhandler(404)
def not_found(error):
    # Для API запросов возвращаем JSON
    if request.path.startswith('/api/'):
        return jsonify({"error": "Not found"}), 404
    # Для обычных запросов возвращаем страницу 404
    return send_file(os.path.join(ROOT_DIR, 'index.html'))

@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Server error"}), 500

# Создание базы данных и таблиц
@app.before_first_request
def create_tables():
    db.create_all()

if __name__ == '__main__':
    # Импорт моделей для создания таблиц
    from models import User, Product, Category, Cart, CartItem, Order, OrderItem, ProductSize
    print(f"Сервер запущен на http://localhost:5000")
    print(f"Корневая директория: {ROOT_DIR}")
    app.run(debug=True, host='0.0.0.0', port=5000) 