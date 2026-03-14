```bash
#!/bin/bash
# wait-for-services.sh

host=$1
port=$2
timeout=60 # seconds

echo "Waiting for $host:$port to be ready..."

for i in $(seq 1 $timeout); do
  nc -z "$host" "$port" >/dev/null 2>&1
  result=$?
  if [ $result -eq 0 ]; then
    echo "$host:$port is ready!"
    exit 0
  fi
  echo "Waiting for $host:$port... ($i/$timeout)"
  sleep 1
done

echo "Error: $host:$port did not become ready within $timeout seconds."
exit 1
```