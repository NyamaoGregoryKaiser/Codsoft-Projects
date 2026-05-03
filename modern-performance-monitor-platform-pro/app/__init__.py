import os
import logging
from logging.handlers import RotatingFileHandler

from flask import Flask, session, g
from dotenv import load_dotenv

from app.config import Config
from app.extensions import db, login_manager, cache, limiter, ma
from app.database import init_db_commands
from app.middlewares import setup_error_handlers
from app.auth.routes import auth_bp
from app.core.routes import core_bp
from app.api.routes import api_bp
from app.models import User # Import User for Flask-Login user_loader

# Load environment variables from .env file
load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize Flask extensions
    db.init_app(app)
    login_manager.init_app(app)
    cache.init_app(app)
    limiter.init_app(app)
    ma.init_app(app) # Initialize Marshmallow

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(core_bp, url_prefix='/') # Core routes on root
    app.register_blueprint(api_bp, url_prefix='/api')

    # Register custom CLI commands for database
    app.cli.add_command(init_db_commands)

    # Setup error handlers
    setup_error_handlers(app)

    # Configure logging
    configure_logging(app)

    # Flask-Login user loader
    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    # Before request: Set current_user and session expiration
    @app.before_request
    def before_request_hook():
        # Make current_user globally available in templates
        g.user = login_manager.current_user
        # Extend session expiration on activity
        session.permanent = True
        app.permanent_session_lifetime = app.config['PERMANENT_SESSION_LIFETIME']

    return app

def configure_logging(app):
    if not os.path.exists('logs'):
        os.mkdir('logs')

    # File handler for general logging
    file_handler = RotatingFileHandler(app.config['LOG_FILE'], maxBytes=10240,
                                       backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
    file_handler.setLevel(app.config['LOG_LEVEL'])
    app.logger.addHandler(file_handler)

    # Console handler (if LOG_TO_STDOUT is True or in development)
    if app.config['LOG_TO_STDOUT'] or app.config['FLASK_ENV'] == 'development':
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
        console_handler.setLevel(app.config['LOG_LEVEL'])
        app.logger.addHandler(console_handler)

    app.logger.setLevel(app.config['LOG_LEVEL'])
    app.logger.info('SynapseSense startup')

```