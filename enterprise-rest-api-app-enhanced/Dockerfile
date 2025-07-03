FROM ubuntu:latest

WORKDIR /app

COPY CMakeLists.txt .
COPY main.cpp .
# ... copy other source files
RUN apt-get update && apt-get install -y build-essential cmake <other dependencies>

RUN cmake .
RUN make

EXPOSE 8080

CMD ["./todoapi"]