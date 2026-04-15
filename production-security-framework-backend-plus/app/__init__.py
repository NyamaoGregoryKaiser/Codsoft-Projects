```python
import os
from flask import Flask, jsonify, redirect, url_for
from flask_migrate import Migrate
from werkzeug.exceptions import HTTPException

from app.config import config_by_name
from app.extensions import db, jwt, cache, limiter, cors, api
from app.errors import register_error_handlers
from app.utils.logging import setup_logging

def create_app(config_name):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_by_name[config_name])
    app.logger.info(f"App created with config: {config_name}")

    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Setup logging
    setup_logging(app)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cache.init_app(app)
    limiter.init_app(app)
    cors.init_app(app, origins=app.config.get('CORS_ORIGINS'), supports_credentials=True)

    # Initialize Flask-Migrate
    Migrate(app, db)

    # Register blueprints for API
    from app.auth.routes import auth_blueprint
    from app.users.routes import users_blueprint
    from app.posts.routes import posts_blueprint
    from app.comments.routes import comments_blueprint

    # Main API blueprint to encapsulate all API resources for Flask-RESTX
    from app.api import api_blueprint, api_namespace as main_api_ns
    from app.auth.routes import auth_ns
    from app.users.routes import users_ns
    from app.posts.routes import posts_ns
    from app.comments.routes import comments_ns

    # Add namespaces to the main API object
    api.add_namespace(auth_ns, path='/auth')
    api.add_namespace(users_ns, path='/users')
    api.add_namespace(posts_ns, path='/posts')
    api.add_namespace(comments_ns, path='/comments')
    app.register_blueprint(api_blueprint, url_prefix='/api')

    # Register the frontend blueprint
    from app.frontend.routes import frontend_blueprint
    app.register_blueprint(frontend_blueprint)


    # Register global error handlers
    register_error_handlers(app)

    # JWT custom error handlers
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({"message": "Missing or invalid token", "status": 401}), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({"message": "Signature verification failed", "status": 401}), 401

    @jwt.expired_token_loader
    def expired_token_response(callback):
        return jsonify({"message": "Token has expired", "status": 401}), 401

    @jwt.revoked_token_loader
    def revoked_token_response(callback):
        return jsonify({"message": "Token has been revoked", "status": 401}), 401

    @jwt.needs_fresh_token_loader
    def needs_fresh_token_response(callback):
        return jsonify({"message": "Fresh token required", "status": 401}), 401

    # Basic health check endpoint
    @app.route('/api/status', methods=['GET'])
    @limiter.exempt
    def status():
        """
        API Health Check
        Returns: A JSON response indicating the API status.
        """
        return jsonify({"status": "ok", "message": "API is running smoothly"}), 200

    # Root redirect to API docs or frontend
    @app.route('/')
    def index():
        return redirect(url_for('frontend.home')) # Redirect to frontend home

    app.logger.info("Application initialized.")
    return app

```