#!/bin/bash
set -e

echo "Creating UUID extension in PostgreSQL..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL
echo "UUID extension created successfully."
```

#### `.github/workflows/ci-cd.yml`
```yaml