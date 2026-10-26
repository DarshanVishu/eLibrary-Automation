package com.elibrary.tests.admin;

import com.elibrary.tests.base.BaseTest;
import com.elibrary.base.DriverManager;
import com.elibrary.config.ConfigReader;
import com.elibrary.pages.common.LoginPage;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.testng.annotations.Test;

import java.util.List;

public class AdminManagementTests extends BaseTest {

    @Test(priority = 1, description = "Admin inspects pending resource approvals queue")
    public void inspectApprovalsView() throws InterruptedException {
        WebDriver driver = DriverManager.getDriver();
        LoginPage loginPage = new LoginPage();
        loginPage.loginAndWaitForRoute(
            ConfigReader.getProperty("adminEmail"),
            ConfigReader.getProperty("adminPassword"),
            "/admin"
        );

        Thread.sleep(2000);

        // Click Approvals in sidebar via JavaScript fallback or direct URL
        By approvalsLocator = By.xpath("//button[contains(., 'Approvals')] | //a[contains(., 'Approvals')]");
        try {
            WebElement approvalsTab = driver.findElement(approvalsLocator);
            ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block: 'center'});", approvalsTab);
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", approvalsTab);
        } catch (Exception e) {
            driver.get(ConfigReader.getBaseUrl() + "/admin/approvals");
        }
        Thread.sleep(2500);

        System.out.println(">>> Landed on URL: " + driver.getCurrentUrl());

        // Find the card/row containing the title
        List<WebElement> matchingCards = driver.findElements(
            By.xpath("//*[contains(., 'Physics Revision Notes') and (self::tr or contains(@class, 'card') or contains(@class, 'rounded') or contains(@class, 'border'))]")
        );

        System.out.println("--- Matching Cards Found: " + matchingCards.size() + " ---");
    }
}