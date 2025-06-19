import os
import shutil
from werkzeug.security import generate_password_hash
from datetime import datetime
from app import app, ROOT_DIR
from db import db
from models import User, Category, Product, ProductSize, Cart

# Создание директорий для изображений продуктов
def create_image_directories():
    img_dir = os.path.join(ROOT_DIR, 'img')
    products_dir = os.path.join(img_dir, 'products')
    
    # Создаем директорию products если не существует
    if not os.path.exists(products_dir):
        os.makedirs(products_dir, exist_ok=True)
        print(f"Создана директория: {products_dir}")

    # Копируем некоторые изображения из img в products для примера
    sample_images = ['Латте_2045х1147.jpg', 'Кофе-тоник_2045х1147-1.jpg', 'Тай-кофе_2045х1147-1.jpg']
    
    for img in sample_images:
        source = os.path.join(img_dir, img)
        if os.path.exists(source):
            # Создаем более простое имя файла
            simple_name = img.split('_')[0].lower()
            if '-' in simple_name:
                simple_name = simple_name.split('-')[0]
            destination = os.path.join(products_dir, f"{simple_name}.jpg")
            
            try:
                shutil.copy2(source, destination)
                print(f"Скопирован файл: {destination}")
            except Exception as e:
                print(f"Ошибка при копировании {source}: {e}")

# Создание контекста приложения
with app.app_context():
    # Создание таблиц
    db.create_all()
    
    # Создание директорий и копирование изображений
    create_image_directories()

    # Добавление категорий
    categories = [
        Category(name="Кофе"),
        Category(name="Чай"),
        Category(name="Десерты"),
        Category(name="Завтраки")
    ]

    db.session.add_all(categories)
    db.session.commit()

    # Добавление продуктов
    products = [
        Product(
            name="Капучино",
            description="Классический капучино на основе эспрессо с молоком и молочной пеной",
            price=150.0,
            image_path="img/products/латте.jpg",
            category_id=1,
            is_new=True,
            is_best=True,
            calories=120,
            proteins=6,
            fats=6,
            carbs=10,
            caffeine=150
        ),
        Product(
            name="Латте",
            description="Кофейный напиток на основе эспрессо с добавлением подогретого молока",
            price=160.0,
            image_path="img/products/латте.jpg",
            category_id=1,
            is_new=False,
            is_best=True,
            calories=150,
            proteins=8,
            fats=8,
            carbs=12,
            caffeine=150
        ),
        Product(
            name="Американо",
            description="Эспрессо с добавлением горячей воды",
            price=120.0,
            image_path="img/products/кофе.jpg",
            category_id=1,
            is_new=False,
            is_best=False,
            calories=5,
            proteins=0,
            fats=0,
            carbs=0,
            caffeine=150
        ),
        Product(
            name="Зеленый чай",
            description="Классический зеленый чай",
            price=100.0,
            image_path="img/products/тай.jpg",
            category_id=2,
            is_new=False,
            is_best=False,
            calories=0,
            proteins=0,
            fats=0,
            carbs=0,
            caffeine=30
        ),
        Product(
            name="Чизкейк",
            description="Классический чизкейк с ягодами",
            price=200.0,
            image_path="img/products/латте.jpg",
            category_id=3,
            is_new=True,
            is_best=True,
            calories=350,
            proteins=6,
            fats=20,
            carbs=30,
            caffeine=0
        )
    ]

    db.session.add_all(products)
    db.session.commit()

    # Добавление размеров продуктов
    product_sizes = [
        # Размеры для капучино
        ProductSize(product_id=1, size="S", volume=200, price=150.0),
        ProductSize(product_id=1, size="M", volume=300, price=190.0),
        ProductSize(product_id=1, size="L", volume=400, price=230.0),
        
        # Размеры для латте
        ProductSize(product_id=2, size="S", volume=200, price=160.0),
        ProductSize(product_id=2, size="M", volume=300, price=200.0),
        ProductSize(product_id=2, size="L", volume=400, price=240.0),
        
        # Размеры для американо
        ProductSize(product_id=3, size="S", volume=200, price=120.0),
        ProductSize(product_id=3, size="M", volume=300, price=150.0),
        ProductSize(product_id=3, size="L", volume=400, price=180.0),
        
        # Размеры для зеленого чая
        ProductSize(product_id=4, size="S", volume=200, price=100.0),
        ProductSize(product_id=4, size="M", volume=300, price=130.0),
        ProductSize(product_id=4, size="L", volume=400, price=160.0)
    ]

    db.session.add_all(product_sizes)
    db.session.commit()

    # Добавление тестового пользователя
    test_user = User(
        email="test@example.com",
        password_hash=generate_password_hash("password"),
        first_name="Тест",
        last_name="Тестов",
        phone="+7 (999) 123-45-67",
        registered_date=datetime.utcnow(),
        is_admin=False
    )

    db.session.add(test_user)
    db.session.commit()

    # Добавление корзины для тестового пользователя
    test_cart = Cart(
        user_id=test_user.id,
        created_date=datetime.utcnow()
    )

    db.session.add(test_cart)
    db.session.commit()

    print("База данных успешно инициализирована с тестовыми данными") 