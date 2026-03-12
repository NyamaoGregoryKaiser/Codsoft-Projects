import logging
from logging.handlers import RotatingFileHandler
import os

from flask import Flask, jsonify, current_app, request
from flask_cors import CORS
from flasgger import Swagger
from webargs.flaskparser import use_args, abort_if_validation_failed # For OpenAPI spec generation

from backend.app.config import Config, DevelopmentConfig, ProductionConfig
from backend.app.extensions import db, jwt, bcrypt, mail, limiter, cache
from backend.app.utils.errors import APIError, handle_api_error, handle_validation_error, InvalidUsage
from backend.app.models.user import User # Import models for Flask-SQLAlchemy context
from backend.app.models.role import Role
from backend.app.models.token_blacklist import TokenBlacklist
from backend.app.models.post import Post

def create_app(config_class=Config):
    app = Flask(__name__)
    CORS(app, supports_credentials=True) # Enable CORS for frontend integration
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)
    limiter.init_app(app)
    cache.init_app(app)

    # Configure Logging
    if not app.debug and not app.testing:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/secureauth.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)

        app.logger.setLevel(logging.INFO)
        app.logger.info('SecureAuth startup')

    # Initialize Swagger (API Documentation)
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec_1',
                "route": '/apispec_1.json',
                "rule_filter": lambda rule: True,  # all in
                "model_filter": lambda tag: True,  # all in
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "basePath": "/api",
        "specs_route": "/apidocs/"
    }
    Swagger(app, config=swagger_config, template={
        "swagger": "2.0",
        "info": {
            "title": "SecureAuth API",
            "description": "API documentation for SecureAuth System",
            "version": "1.0.0"
        },
        "securityDefinitions": {
            "BearerAuth": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\""
            }
        },
        "security": [
            { "BearerAuth": [] }
        ]
    })

    # Register Blueprints
    from backend.app.api import auth, users, posts
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(users.bp, url_prefix='/api/users')
    app.register_blueprint(posts.bp, url_prefix='/api/posts')

    # Register Error Handlers
    app.register_error_handler(APIError, handle_api_error)
    app.register_error_handler(422, handle_validation_error) # Webargs validation error
    app.register_error_handler(InvalidUsage, handle_api_error) # General custom error
    app.register_error_handler(404, lambda e: jsonify(message="Not Found"), 404)
    app.register_error_handler(500, lambda e: jsonify(message="Internal Server Error"), 500)


    # JWT Callbacks
    @jwt.token_in_blocklist_loader
    def check_if_token_is_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        token = db.session.scalar(db.select(TokenBlacklist).filter_by(jti=jti))
        return token is not None

    @jwt.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_payload):
        return jsonify({"msg": "Token is not fresh, please re-authenticate"}), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({"msg": "Token has been revoked"}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"msg": "Token has expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"msg": "Signature verification failed", "error": str(error)}), 401

    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return jsonify({"msg": "Request does not contain an access token"}), 401


    # A simple health check endpoint
    @app.route('/health')
    @limiter.exempt
    def health_check():
        return jsonify({'status': 'ok'}), 200

    return app
```