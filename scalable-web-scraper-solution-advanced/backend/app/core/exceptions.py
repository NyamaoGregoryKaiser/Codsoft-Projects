class HTTPException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

class ScraperRunError(Exception):
    """Custom exception for errors during a scraper run."""
    pass