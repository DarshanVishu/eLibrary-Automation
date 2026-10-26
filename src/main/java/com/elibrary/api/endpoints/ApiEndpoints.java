package com.elibrary.api.endpoints;

public final class ApiEndpoints {
    private ApiEndpoints() {}

    public static final String AUTH_TOKEN = "/auth/v1/token";
    public static final String REST_RESOURCES = "/rest/v1/resources";
    public static final String REST_PROFILES = "/rest/v1/profiles";
    public static final String RPC_SEND_ANNOUNCEMENT = "/rest/v1/rpc/send_announcement_rpc";
    public static final String RPC_MANUAL_GRADE_ADJUST = "/rest/v1/rpc/manual_grade_adjust";
}