package com.elibrary.tests.api;

import com.elibrary.api.client.AuthApiClient;
import com.elibrary.config.ConfigReader;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.Test;

public class AuthApiTests {

    @Test(description = "Supabase Auth API should issue a 200 and access_token for valid credentials")
    public void testSuccessfulAuthentication() {
        Response response = AuthApiClient.authenticate(
                ConfigReader.getProperty("studentEmail"),
                ConfigReader.getProperty("studentPassword")
        );

        Assert.assertEquals(response.statusCode(), 200, "Auth API should return 200 OK");
        Assert.assertNotNull(response.jsonPath().getString("access_token"), "Access token must not be null");
    }

    @Test(description = "Supabase Auth API should reject invalid credentials with 400")
    public void testFailedAuthentication() {
        Response response = AuthApiClient.authenticate("unknown@domain.com", "wrongpass");
        Assert.assertEquals(response.statusCode(), 400, "Auth API should return 400 Bad Request");
    }
}