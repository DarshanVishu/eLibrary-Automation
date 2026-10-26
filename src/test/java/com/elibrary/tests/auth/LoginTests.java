package com.elibrary.tests.auth;

import com.elibrary.config.ConfigReader;
import com.elibrary.pages.common.LoginPage;
import com.elibrary.pages.common.NavigationHeader;
import com.elibrary.tests.base.BaseTest;
import org.testng.Assert;
import org.testng.annotations.Test;

public class LoginTests extends BaseTest {

    @Test(description = "Verify successful admin login and header visibility")
    public void testValidAdminLogin() {
        LoginPage loginPage = new LoginPage();
        loginPage.login(ConfigReader.getProperty("adminEmail"), ConfigReader.getProperty("adminPassword"));

        NavigationHeader header = new NavigationHeader();
        Assert.assertTrue(header.isHeaderDisplayed(), "Dashboard container should display after successful login.");
    }

    @Test(description = "Verify invalid credentials render an error notification")
    public void testInvalidLoginCredentials() {
        LoginPage loginPage = new LoginPage();
        loginPage.login("invalid.user@school.edu", "wrongPassword123");

        String error = loginPage.getErrorMessage();
        Assert.assertFalse(error.isEmpty(), "Error message should not be empty on invalid credentials.");
    }
}