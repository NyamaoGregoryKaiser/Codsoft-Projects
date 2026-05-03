from flask import render_template, request, flash, redirect, url_for
from werkzeug.exceptions import HTTPException
from flask_login import current_user
import logging

def setup_error_handlers(app):
    @app.errorhandler(401)
    def unauthorized(error):
        if request.blueprint == 'api':
            return {'message': 'Unauthorized'}, 401
        flash('You must be logged in to view this page.', 'danger')
        return redirect(url_for('auth.login'))

    @app.errorhandler(403)
    def forbidden(error):
        if request.blueprint == 'api':
            return {'message': 'Forbidden'}, 403
        return render_template('errors/403.html', error=error), 403

    @app.errorhandler(404)
    def page_not_found(error):
        if request.blueprint == 'api':
            return {'message': 'Resource not found'}, 404
        return render_template('errors/404.html', error=error), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        db_session_rollback() # Ensure DB session is rolled back on 500
        app.logger.exception('Internal Server Error: %s', error)
        if request.blueprint == 'api':
            return {'message': 'Internal Server Error'}, 500
        return render_template('errors/500.html', error=error), 500

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """Return JSON instead of HTML for HTTP errors."""
        # start with the correct headers and status code from the error
        response = e.get_response()
        # replace the body with JSON
        response.data = render_template('errors/generic_error.html', error=e) # or JSON for API
        response.content_type = "text/html" # or "application/json" for API
        return response

    def db_session_rollback():
        """Rolls back the database session on error."""
        try:
            from app.extensions import db
            db.session.rollback()
        except Exception as e:
            app.logger.error(f"Error during DB session rollback: {e}")

```