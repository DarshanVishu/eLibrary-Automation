package com.elibrary.pages.common;

import com.elibrary.config.ConfigReader;
import com.elibrary.pages.base.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class LoginPage extends BasePage {

    private final By formHeader = By.xpath("//*[contains(text(), 'Sign in to eLibrary')]");
    private final By emailInput = By.cssSelector("input[type='email'], input[name='email']");
    private final By passwordInput = By.cssSelector("input[type='password'], input[name='password']");
    private final By passwordVisibilityToggle = By.cssSelector("button[aria-label*='password'], input[type='password'] + button");
    private final By keepMeLoggedInCheckbox = By.cssSelector("input[type='checkbox'], button[role='checkbox']");
    private final By signInButton = By.xpath("//button[normalize-space()='Sign In']");
    private final By errorToast = By.cssSelector("[role='alert'], [data-sonner-toast], .text-destructive");
    private final By footerHelpText = By.xpath("//*[contains(text(), 'Contact your school administrator')]");

    public boolean isLoginPageDisplayed() {
        return isDisplayed(formHeader) && isDisplayed(signInButton);
    }

    public LoginPage enterEmail(String email) {
        sendKeys(emailInput, email);
        return this;
    }

    public LoginPage enterPassword(String password) {
        sendKeys(passwordInput, password);
        return this;
    }

    public LoginPage toggleKeepMeLoggedIn() {
        click(keepMeLoggedInCheckbox);
        return this;
    }

    public LoginPage togglePasswordVisibility() {
        click(passwordVisibilityToggle);
        return this;
    }

    public void clickSignIn() {
        click(signInButton);
    }

    /**
     * Standard login
     */
    public void login(String email, String password) {
        enterEmail(email);
        enterPassword(password);
        clickSignIn();
    }

    /**
     * Login and wait for post-auth route transition (e.g. "/teacher", "/admin", "/student")
     */
    public void loginAndWaitForRoute(String email, String password, String expectedRoute) {
        login(email, password);
        wait.until(ExpectedConditions.urlContains(expectedRoute));
    }

    public String getErrorMessage() {
        return getText(errorToast);
    }

    public boolean isHelpTextDisplayed() {
        return isDisplayed(footerHelpText);
    }

    /**
     * Resets cookies and browser storage, then verifies the login form is ready
     */
    public LoginPage navigateToLoginPage() {
        try {
            ((JavascriptExecutor) driver).executeScript("window.localStorage.clear(); window.sessionStorage.clear();");
        } catch (Exception ignored) {}

        driver.manage().deleteAllCookies();
        driver.get(ConfigReader.getBaseUrl());

        wait.until(ExpectedConditions.visibilityOfElementLocated(emailInput));
        return this;
    }
}