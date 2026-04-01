```python
import os
import shutil
from pathlib import Path
from typing import Optional

from backend.app.core.config import settings
from backend.app.core.exceptions import InternalServerError

class StorageManager:
    """
    Manages file storage for datasets and trained models.
    Uses a local file system path as defined in DATA_STORAGE_PATH.
    In a production environment, this would ideally be S3, Azure Blob Storage, etc.
    """
    def __init__(self, base_path: str = settings.DATA_STORAGE_PATH):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True) # Ensure base directory exists

    def _get_abs_path(self, relative_path: str) -> Path:
        """Helper to get absolute path and ensure it's within base_path."""
        abs_path = (self.base_path / relative_path).resolve()
        if not abs_path.is_relative_to(self.base_path):
            raise InternalServerError(detail="Attempted to access path outside of designated storage.")
        return abs_path

    async def save_file(self, file_content: bytes, relative_path: str) -> str:
        """
        Saves file content to a relative path within the storage.
        Returns the relative path on success.
        """
        abs_path = self._get_abs_path(relative_path)
        abs_path.parent.mkdir(parents=True, exist_ok=True) # Ensure parent directory for the file exists
        try:
            with open(abs_path, "wb") as f:
                f.write(file_content)
            return relative_path
        except IOError as e:
            raise InternalServerError(detail=f"Failed to save file: {e}")

    async def load_file(self, relative_path: str) -> Optional[bytes]:
        """
        Loads file content from a relative path.
        Returns bytes content or None if file not found.
        """
        abs_path = self._get_abs_path(relative_path)
        if not abs_path.is_file():
            return None
        try:
            with open(abs_path, "rb") as f:
                return f.read()
        except IOError as e:
            raise InternalServerError(detail=f"Failed to load file: {e}")

    async def delete_file(self, relative_path: str) -> bool:
        """
        Deletes a file from the storage.
        Returns True on success, False if file not found.
        """
        abs_path = self._get_abs_path(relative_path)
        if abs_path.is_file():
            try:
                os.remove(abs_path)
                return True
            except OSError as e:
                raise InternalServerError(detail=f"Failed to delete file: {e}")
        return False

    async def delete_directory(self, relative_path: str) -> bool:
        """
        Deletes a directory and its contents from the storage.
        Returns True on success, False if directory not found.
        """
        abs_path = self._get_abs_path(relative_path)
        if abs_path.is_dir():
            try:
                shutil.rmtree(abs_path)
                return True
            except OSError as e:
                raise InternalServerError(detail=f"Failed to delete directory: {e}")
        return False

storage_manager = StorageManager()
```