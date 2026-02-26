package com.ecommerce.util;

public class AppConstants {
    public static final String DEFAULT_PAGE_NUMBER = "0";
    public static final String DEFAULT_PAGE_SIZE = "10";
    public static final String DEFAULT_SORT_BY = "id";
    public static final String DEFAULT_SORT_DIRECTION = "asc";

    public static final long JWT_EXPIRATION_MS = 86400000; // 24 hours
    public static final String JWT_SECRET = "supersecretjwtkeythatisatleast256bitlongforproductionuse"; // CHANGE THIS IN PRODUCTION

    public static final String ADMIN = "ROLE_ADMIN";
    public static final String USER = "ROLE_USER";
}