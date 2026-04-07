from loguru import logger
import sys

def setup_logging():
    logger.remove()  # Remove default logger
    logger.add(
        sys.stderr,
        level="INFO",
        format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        colorize=True
    )
    logger.add(
        "logs/dboptiflow.log",
        rotation="500 MB",
        retention="10 days",
        level="WARNING",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level} | {name}:{function}:{line} - {message}"
    )
    # Intercept standard logging to Loguru
    # import logging
    # logging.basicConfig(handlers=[InterceptHandler()], level=0)
    # logging.getLogger("uvicorn").handlers = [InterceptHandler()]
    # logging.getLogger("uvicorn.access").handlers = [InterceptHandler()]
    logger.info("Logging configured.")

# A more advanced setup might use a custom handler to intercept stdlib logging
# from loguru._handler import InterceptHandler # This is an internal module, use with caution

# Example of how to integrate with standard logging if needed:
# import logging
# class InterceptHandler(logging.Handler):
#     def emit(self, record):
#         # Get corresponding Loguru level if it exists
#         try:
#             level = logger.level(record.levelname).name
#         except ValueError:
#             level = record.levelno
#
#         # Find caller from where logging originated
#         frame, depth = logging.currentframe(), 2
#         while frame.f_code.co_filename == logging.__file__:
#             frame = frame.f_back
#             depth += 1
#
#         logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())