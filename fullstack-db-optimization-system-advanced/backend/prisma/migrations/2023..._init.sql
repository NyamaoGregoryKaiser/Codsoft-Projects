-- CreateTable
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DbInstance" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PostgreSQL',
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "database" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DbInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoredQuery" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "dbInstanceId" TEXT NOT NULL,
    "queryText" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "params" JSONB,
    "executionPlanText" TEXT,
    "hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoredQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueryExplanation" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "monitoredQueryId" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "rows" INTEGER NOT NULL,
    "actualTime" DOUBLE PRECISION,
    "loops" INTEGER,
    "nodeName" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueryExplanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexSuggestion" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "dbInstanceId" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "columns" TEXT[],
    "condition" TEXT,
    "reason" TEXT NOT NULL,
    "queryIds" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemaIssue" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "dbInstanceId" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectName" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchemaIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricSnapshot" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "dbInstanceId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "cpuUsage" DOUBLE PRECISION,
    "memoryUsage" DOUBLE PRECISION,
    "ioOperations" INTEGER,
    "activeConnections" INTEGER,
    "idleConnections" INTEGER,
    "transactionsPerSec" DOUBLE PRECISION,
    "blockReads" INTEGER,
    "blockHits" INTEGER,
    "networkTrafficInMB" DOUBLE PRECISION,
    "networkTrafficOutMB" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "DbInstance_name_key" ON "DbInstance"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoredQuery_hash_key" ON "MonitoredQuery"("hash");

-- AddForeignKey
ALTER TABLE "MonitoredQuery" ADD CONSTRAINT "MonitoredQuery_dbInstanceId_fkey" FOREIGN KEY ("dbInstanceId") REFERENCES "DbInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryExplanation" ADD CONSTRAINT "QueryExplanation_monitoredQueryId_fkey" FOREIGN KEY ("monitoredQueryId") REFERENCES "MonitoredQuery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndexSuggestion" ADD CONSTRAINT "IndexSuggestion_dbInstanceId_fkey" FOREIGN KEY ("dbInstanceId") REFERENCES "DbInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemaIssue" ADD CONSTRAINT "SchemaIssue_dbInstanceId_fkey" FOREIGN KEY ("dbInstanceId") REFERENCES "DbInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricSnapshot" ADD CONSTRAINT "MetricSnapshot_dbInstanceId_fkey" FOREIGN KEY ("dbInstanceId") REFERENCES "DbInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;