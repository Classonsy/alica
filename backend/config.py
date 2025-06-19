import os
from datetime import timedelta
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

class Config:
    # Базовая конфигурация
    DEBUG = False
    TESTING = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'sova-coffee-secret-key')
    
    # Конфигурация базы данных
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///sova_coffee.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Конфигурация JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'sova-coffee-jwt-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'

class ProductionConfig(Config):
    pass

# Словарь конфигураций
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
} 