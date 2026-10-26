package com.elibrary.api.client;

import com.elibrary.api.endpoints.ApiEndpoints;
import com.elibrary.api.models.AuthResponse;
import com.elibrary.api.models.LoginRequest;
import io.restassured.RestAssured;
import io.restassured.response.Response;

public class AuthApiClient extends RestClient {

    public static Response authenticate(String email, String password) {
        LoginRequest payload = new LoginRequest(email, password);
        return RestAssured.given()
                .spec(getBaseSpec())
                .queryParam("grant_type", "password")
                .body(payload)
                .post(ApiEndpoints.AUTH_TOKEN);
    }

    public static String getAccessToken(String email, String password) {
        Response response = authenticate(email, password);
        if (response.statusCode() == 200) {
            return response.as(AuthResponse.class).getAccessToken();
        }
        throw new RuntimeException("Authentication failed for " + email + ": " + response.getBody().asString());
    }
}