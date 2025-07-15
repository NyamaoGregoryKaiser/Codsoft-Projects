FROM ubuntu:latest

RUN apt-get update && apt-get install -y build-essential cmake libpq-dev

WORKDIR /app

COPY CMakeLists.txt .
COPY . .

RUN cmake .
RUN make

EXPOSE 8080

CMD ["./performance_monitor"]