```dockerfile
FROM ubuntu:latest

# Install dependencies (replace with your actual dependencies)
RUN apt-get update && apt-get install -y build-essential cmake sqlite3 libsqlite3-dev

WORKDIR /app

COPY CMakeLists.txt .
COPY server.cpp .
COPY database.sql .

RUN cmake . && make

CMD ["./cms"]
```