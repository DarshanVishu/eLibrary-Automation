package com.elibrary.tests.admin;

import com.elibrary.base.BaseTest;
import com.elibrary.config.ConfigReader;
import com.elibrary.driver.DriverManager;
import com.elibrary.pages.auth.LoginPage;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.testng.Assert;
import org.testng.annotations.Test;

import java.util.List;

public class AdminManagementTests extends BaseTest {

    @Test(priority = 1, description = "Admin inspects pending resource approvals queue")
    public void inspectApprovalsView() throws InterruptedException {
        LoginPage loginPage = new LoginPage();
        loginPage.loginAndWaitForRoute(
            ConfigReader.getProperty("adminEmail"),
            ConfigReader.getProperty("adminPassword"),
            "/admin"
        );

        Thread.sleep(2000);

        // Click Approvals in sidebar via JavaScript fallback or navigate directly
        By approvalsLocator = By.xpath("//button[contains(., 'Approvals')] | //a[contains(., 'Approvals')]");
        try {
            WebElement approvalsTab = DriverManager.getDriver().findElement(approvalsLocator);
            ((JavascriptExecutor) DriverManager.getDriver()).executeScript("arguments[0].scrollIntoView({block: 'center'});", approvalsTab);
            ((JavascriptExecutor) DriverManager.getDriver()).executeScript("arguments[0].click();", approvalsTab);
        } catch (Exception e) {
            DriverManager.getDriver().get(ConfigReader.getBaseUrl() + "/admin/approvals");
        }
        Thread.sleep(2500);

        System.out.println(">>> Landed on URL: " + DriverManager.getDriver().getCurrentUrl());

        // Find the card/row containing the title
        List<WebElement> matchingCards = DriverManager.getDriver().findElements(
            By.xpath("//*[contains(., 'Physics Revision Notes') and (self::tr or contains(@class, 'card') or contains(@class, 'rounded') or contains(@class, 'border'))]")
        );

        System.out.println("--- Matching Cards Found: " + matchingCards.size() + " ---");
    }
}