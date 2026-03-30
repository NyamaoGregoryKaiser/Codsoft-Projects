# Use a slim Python image for smaller size
FROM python:3.11-slim-bookworm

# Set working directory
WORKDIR /app

# Install Playwright dependencies (required for Playwright Chromium browser)
# https://playwright.dev/python/docs/docker
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        # Dependencies for Playwright Chromium
        fonts-liberation \
        libasound2 \
        libatk-bridge2.0-0 \
        libdrm-amdgpu1 \
        libdrm-amdgpu-dbg \
        libdrm-common \
        libdrm-intel1 \
        libdrm-nouveau2 \
        libdrm-radeon1 \
        libdrm2 \
        libgbm1 \
        libgl1 \
        libglvnd0 \
        libglx0 \
        libgtk-3-0 \
        libice6 \
        libsm6 \
        libsqlite3-0 \
        libxcomposite1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxkbcommon0 \
        libxrandr2 \
        libxshmfence6 \
        libxxf86vm1 \
        xdg-utils \
        # Add basic build tools and git for dependency installation if needed
        build-essential \
        git \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry for dependency management (optional, can use pip directly)
# RUN pip install poetry
# ENV PATH="/root/.poetry/bin:$PATH"

# Copy requirements.txt and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers (Chromium by default)
RUN playwright install chromium

# Copy the rest of the application code
COPY backend/ ./app

# Expose the port FastAPI runs on
EXPOSE 8000

# Command to run the application (overridden by docker-compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]