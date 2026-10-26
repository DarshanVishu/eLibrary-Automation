package com.elibrary.api.client;

import com.elibrary.config.ConfigReader;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;

public class RestClient {
    protected static RequestSpecification getBaseSpec() {
        return new RequestSpecBuilder()
                .setBaseUri(ConfigReader.getApiUrl())
                .addHeader("apikey", ConfigReader.getProperty("supabaseApiKey"))
                .setContentType(ContentType.JSON)
                .build();
    }

    protected static RequestSpecification getAuthenticatedSpec(String bearerToken) {
        return new RequestSpecBuilder()
                .addRequestSpecification(getBaseSpec())
                .addHeader("Authorization", "Bearer " + bearerToken)
                .build();
    }
}