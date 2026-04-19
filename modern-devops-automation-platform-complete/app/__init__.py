import logging
import os
from flask import Flask, jsonify, request
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

from app.config import config
from app.models import db, bcrypt
from app.errors import ApiError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, ValidationError

# Load environment variables
load_dotenv()

# Initialize extensions outside the app factory
# This allows them to be initialized once and then bound to the app
# inside the factory.
migrate = Migrate()
jwt = JWTManager()
cache = Cache()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'default')

    app = Flask(__name__)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    # Configure logging
    log_level = app.config['LOG_LEVEL']
    logging.basicConfig(level=getattr(logging, log_level),
                        format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s')
    app.logger.setLevel(getattr(logging, log_level))
    app.logger.info(f"ProjectFlow app started with config: {config_name}, Log Level: {log_level}")

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cache.init_app(app)
    limiter.init_app(app)
    app.logger.info("Database, Bcrypt, Migrate, JWT, Cache, Limiter initialized.")

    # Register blueprints
    from app.auth import auth_bp
    from app.users import users_bp
    from app.projects import projects_bp
    from app.tasks import tasks_bp

    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(users_bp, url_prefix='/api/v1/users')
    app.register_blueprint(projects_bp, url_prefix='/api/v1/projects')
    app.register_blueprint(tasks_bp, url_prefix='/api/v1/tasks')
    app.logger.info("Blueprints registered.")

    # Register custom error handlers
    @app.errorhandler(ApiError)
    def handle_api_error(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        app.logger.warning(f"API Error ({error.status_code}): {error.message}", exc_info=True)
        return response

    @app.errorhandler(400)
    def bad_request(e):
        app.logger.warning(f"Bad Request (400): {e.description}", exc_info=True)
        return jsonify({"message": e.description or "Bad request"}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        app.logger.warning(f"Unauthorized (401): {e.description}", exc_info=True)
        return jsonify({"message": e.description or "Unauthorized"}), 401

    @app.errorhandler(403)
    def forbidden(e):
        app.logger.warning(f"Forbidden (403): {e.description}", exc_info=True)
        return jsonify({"message": e.description or "Forbidden"}), 403

    @app.errorhandler(404)
    def not_found(e):
        app.logger.warning(f"Not Found (404): {e.description}", exc_info=True)
        return jsonify({"message": e.description or "Resource not found"}), 404

    @app.errorhandler(429)
    def ratelimit_handler(e):
        app.logger.warning(f"Rate Limit Exceeded (429): {e.description}", exc_info=True)
        return jsonify({"message": "Rate limit exceeded. Please try again later."}), 429

    @app.errorhandler(500)
    def internal_server_error(e):
        app.logger.error(f"Internal Server Error (500): {e.description}", exc_info=True)
        return jsonify({"message": "An unexpected error occurred."}), 500

    # JWT Error Handlers
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({"message": "Missing Authorization Header"}), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({"message": "Signature verification failed"}), 401

    @jwt.expired_token_loader
    def expired_token_response(callback):
        return jsonify({"message": "Token has expired"}), 401

    @jwt.revoked_token_loader
    def revoked_token_response(callback):
        return jsonify({"message": "Token has been revoked"}), 401

    @jwt.needs_fresh_token_loader
    def needs_fresh_token_response(callback):
        return jsonify({"message": "Fresh token required"}), 401

    # Simple health check endpoint
    @app.route('/health')
    @limiter.exempt
    def health_check():
        return jsonify({"status": "ok", "message": "ProjectFlow API is running!"}), 200

    # Frontend serving (for basic demo)
    @app.route('/')
    @limiter.exempt
    def index():
        return app.send_static_file('index.html')

    @app.route('/<path:filename>')
    @limiter.exempt
    def static_files(filename):
        # Serve static files from the static directory
        # Ensure proper security headers and path validation in a real prod env
        return app.send_static_file(filename)


    app.logger.info("App factory finished.")
    return app
```