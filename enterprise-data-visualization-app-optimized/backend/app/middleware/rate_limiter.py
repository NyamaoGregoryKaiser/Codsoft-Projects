```python
# The Flask-Limiter extension is initialized in app/__init__.py
# and applied using the @limiter.limit decorator directly on routes.
# No separate file needed for its setup, but this file serves as a placeholder
# to indicate its explicit inclusion as a middleware component.

# Example usage (as seen in auth/routes.py):
# from app import limiter
# @limiter.limit("5 per 15 minutes", error_message="Too many login attempts. Please wait before trying again.")
# def post(self):
#     # ... login logic ...

# You can also apply global limits:
# limiter.limit("1000 per hour")(app) # Applies to all routes not explicitly limited
# Or per blueprint:
# limiter.limit("500 per day")(auth_bp)
```