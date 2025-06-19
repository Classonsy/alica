from flask import Blueprint, request, jsonify
from db import db
from models import Product, Category, ProductSize

product_routes = Blueprint('products', __name__, url_prefix='/api/products')

@product_routes.route('/', methods=['GET'])
def get_all_products():
    # Получение параметров запроса
    category_id = request.args.get('category', type=int)
    is_new = request.args.get('new', type=bool)
    is_best = request.args.get('best', type=bool)
    
    # Базовый запрос
    query = Product.query
    
    # Применение фильтров
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    if is_new is not None:
        query = query.filter_by(is_new=is_new)
    
    if is_best is not None:
        query = query.filter_by(is_best=is_best)
    
    # Получение продуктов
    products = query.all()
    
    # Формирование ответа
    result = []
    
    for product in products:
        # Получение размеров продукта
        sizes = []
        for size in product.sizes:
            sizes.append({
                "id": size.id,
                "size": size.size,
                "volume": size.volume,
                "price": size.price
            })
        
        # Добавление продукта в результат
        result.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "imagePath": product.image_path,
            "categoryId": product.category_id,
            "categoryName": product.category.name if product.category else None,
            "isNew": product.is_new,
            "isBest": product.is_best,
            "calories": product.calories,
            "proteins": product.proteins,
            "fats": product.fats,
            "carbs": product.carbs,
            "caffeine": product.caffeine,
            "sizes": sizes
        })
    
    return jsonify({"products": result}), 200

@product_routes.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    # Поиск продукта по ID
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({"error": "Продукт не найден"}), 404
    
    # Получение размеров продукта
    sizes = []
    for size in product.sizes:
        sizes.append({
            "id": size.id,
            "size": size.size,
            "volume": size.volume,
            "price": size.price
        })
    
    # Формирование ответа
    result = {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "imagePath": product.image_path,
        "categoryId": product.category_id,
        "categoryName": product.category.name if product.category else None,
        "isNew": product.is_new,
        "isBest": product.is_best,
        "calories": product.calories,
        "proteins": product.proteins,
        "fats": product.fats,
        "carbs": product.carbs,
        "caffeine": product.caffeine,
        "sizes": sizes
    }
    
    return jsonify(result), 200

@product_routes.route('/categories', methods=['GET'])
def get_categories():
    # Получение всех категорий
    categories = Category.query.all()
    
    # Формирование ответа
    result = []
    
    for category in categories:
        result.append({
            "id": category.id,
            "name": category.name,
            "productCount": len(category.products)
        })
    
    return jsonify({"categories": result}), 200

@product_routes.route('/new', methods=['GET'])
def get_new_products():
    # Получение новых продуктов
    products = Product.query.filter_by(is_new=True).all()
    
    # Формирование ответа
    result = []
    
    for product in products:
        # Получение размеров продукта
        sizes = []
        for size in product.sizes:
            sizes.append({
                "id": size.id,
                "size": size.size,
                "volume": size.volume,
                "price": size.price
            })
        
        # Добавление продукта в результат
        result.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "imagePath": product.image_path,
            "categoryId": product.category_id,
            "categoryName": product.category.name if product.category else None,
            "isNew": product.is_new,
            "isBest": product.is_best,
            "sizes": sizes
        })
    
    return jsonify({"products": result}), 200

@product_routes.route('/best', methods=['GET'])
def get_best_products():
    # Получение лучших продуктов
    products = Product.query.filter_by(is_best=True).all()
    
    # Формирование ответа
    result = []
    
    for product in products:
        # Получение размеров продукта
        sizes = []
        for size in product.sizes:
            sizes.append({
                "id": size.id,
                "size": size.size,
                "volume": size.volume,
                "price": size.price
            })
        
        # Добавление продукта в результат
        result.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "imagePath": product.image_path,
            "categoryId": product.category_id,
            "categoryName": product.category.name if product.category else None,
            "isNew": product.is_new,
            "isBest": product.is_best,
            "sizes": sizes
        })
    
    return jsonify({"products": result}), 200 