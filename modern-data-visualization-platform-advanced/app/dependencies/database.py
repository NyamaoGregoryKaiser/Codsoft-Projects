from app.db.session import get_db

# Re-export get_db for convenience in API routes
__all__ = ["get_db"]