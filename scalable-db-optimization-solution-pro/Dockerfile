FROM ubuntu:latest

RUN apt-get update && apt-get install -y build-essential cmake git postgresql-client

WORKDIR /app

COPY . .

RUN cmake . && make

EXPOSE 8080

CMD ["./database_optimizer"]