```python
import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify, request
from .config import Config, DevelopmentConfig, TestingConfig, ProductionConfig
from .extensions import db, migrate, jwt, ma, cors, cache, limiter, init_app as init_extensions
from .errors import register_error_handlers
from .api import api_bp
from .models import User # Import User model to register JWT user loader

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    init_extensions(app)

    # Register error handlers
    register_error_handlers(app)

    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')

    # Configure logging
    if not app.debug and not app.testing:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/dashboard_app.log', maxBytes=10240,
                                           backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)

        app.logger.setLevel(logging.INFO)
        app.logger.info('Dashboard App startup')

    # JWT User Loader
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return User.query.filter_by(id=identity).first()

    # JWT additional claims (e.g., roles)
    @jwt.additional_claims_loader
    def add_claims_to_access_token(user):
        return {"roles": user.roles}

    # Example health check endpoint
    @app.route('/health')
    @limiter.exempt # Exclude health check from global rate limiting
    def health_check():
        return jsonify({"status": "healthy", "version": "1.0.0"}), 200

    # Cache clearing endpoint (for admin/dev use)
    @app.route('/clear-cache', methods=['POST'])
    # @jwt_required() # Require authentication to clear cache
    # @role_required('admin') # Require admin role
    def clear_application_cache():
        cache.clear()
        app.logger.info("Application cache cleared.")
        return jsonify({"message": "Application cache cleared successfully."}), 200

    return app

```