export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

export enum DatabaseType {
  POSTGRESQL = "postgresql",
  MYSQL = "mysql",
  SQLSERVER = "sqlserver",
  ORACLE = "oracle",
}

export enum SuggestionType {
  INDEX = "index_creation",
  QUERY_REWRITE = "query_rewrite",
  CONFIGURATION = "configuration_tune",
  SHARDING = "sharding",
  PARTITIONING = "partitioning",
}

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}