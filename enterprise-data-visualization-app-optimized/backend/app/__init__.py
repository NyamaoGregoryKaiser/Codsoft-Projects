```python
import os
import logging
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_restx import Api
from flask_cors import CORS
from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from decouple import config

# Import extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()
api = Api(
    version='1.0',
    title='VizCraft API',
    description='A comprehensive API for managing data sources, dashboards, and visualizations.',
    doc='/api/docs' # Expose Swagger UI at /api/docs
)
cors = CORS()
cache = Cache()
limiter = Limiter(
    key_func=get_remote_address, # Identifies client by IP address
    default_limits=["200 per day", "50 per hour"], # Default rate limits
    storage_uri=config('RATELIMIT_STORAGE_URL', default="memory://"),
    storage_options={"EXPIRES": 3600}, # Cache expiration for rate limit keys
    headers_enabled=True # Add X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers
)

def create_app(test_config=None):
    """
    Factory function to create the Flask application.
    """
    app = Flask(__name__, instance_relative_config=True)

    # Load configuration
    if test_config is None:
        # Load from config.py and .env
        app.config.from_object('app.config.Config')
        # Override with environment variables
        app.config['SECRET_KEY'] = config('SECRET_KEY', app.config['SECRET_KEY'])
        app.config['JWT_SECRET_KEY'] = config('JWT_SECRET_KEY', app.config['JWT_SECRET_KEY'])
        app.config['SQLALCHEMY_DATABASE_URI'] = config('DATABASE_URL', app.config['SQLALCHEMY_DATABASE_URI'])
        app.config['REDIS_URL'] = config('REDIS_URL', app.config['REDIS_URL'])
        app.config['CACHE_TYPE'] = config('CACHE_TYPE', app.config['CACHE_TYPE'])
        app.config['CORS_ORIGINS'] = config('CORS_ORIGINS', app.config['CORS_ORIGINS']).split(',')
        app.config['CORS_SUPPORTS_CREDENTIALS'] = config('CORS_SUPPORTS_CREDENTIALS', cast=bool, default=True)
    else:
        # Load the test configuration
        app.config.from_mapping(test_config)

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    api.init_app(app)
    cors.init_app(app, origins=app.config['CORS_ORIGINS'], supports_credentials=app.config['CORS_SUPPORTS_CREDENTIALS'])
    cache.init_app(app, config={'CACHE_TYPE': app.config['CACHE_TYPE'], 'CACHE_REDIS_URL': app.config['REDIS_URL']})
    limiter.init_app(app)

    # Setup Logging
    from .logging_setup import setup_logging
    setup_logging(app)
    app.logger.info(f"VizCraft application starting in {app.config['FLASK_ENV']} environment.")

    # Register Blueprints and API Namespaces
    from app.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    from app.api.routes.dashboard import ns as dashboard_ns
    from app.api.routes.datasource import ns as datasource_ns
    from app.api.routes.visualization import ns as visualization_ns

    api.add_namespace(dashboard_ns, path='/api/dashboards')
    api.add_namespace(datasource_ns, path='/api/datasources')
    api.add_namespace(visualization_ns, path='/api/visualizations')

    # Register error handlers
    from app.middleware.error_handlers import register_error_handlers
    register_error_handlers(app)

    # JWT error handlers
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({"msg": "Missing or invalid token"}), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({"msg": "Signature verification failed"}), 401

    @jwt.expired_token_loader
    def expired_token_response(callback):
        return jsonify({"msg": "Token has expired"}), 401

    @jwt.needs_fresh_token_loader
    def needs_fresh_token_response(callback):
        return jsonify({"msg": "Fresh token required"}), 401

    @jwt.revoked_token_loader
    def revoked_token_response(callback):
        return jsonify({"msg": "Token has been revoked"}), 401

    # Simple root route (for health checks or basic info)
    @app.route('/')
    def index():
        return jsonify({"message": "Welcome to VizCraft API", "version": "1.0"})

    return app

# Import models to ensure they are registered with SQLAlchemy for migrations
from app.models import *
```