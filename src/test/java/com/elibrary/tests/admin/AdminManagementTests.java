package com.elibrary.tests.admin;

import com.elibrary.base.DriverManager;
import com.elibrary.config.ConfigReader;
import com.elibrary.pages.common.LoginPage;
import com.elibrary.tests.base.BaseTest;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.testng.annotations.Test;

import java.util.List;

public class AdminManagementTests extends BaseTest {

    @Test(description = "Inspect buttons and layout of the Approvals view")
    public void inspectApprovalsView() throws InterruptedException {
        LoginPage loginPage = new LoginPage();
        loginPage.loginAndWaitForRoute(
            ConfigReader.getProperty("adminEmail"),
            ConfigReader.getProperty("adminPassword"),
            "/admin"
        );

        Thread.sleep(2000);

        // Click Approvals in sidebar
        WebElement approvalsTab = DriverManager.getDriver().findElement(
            By.xpath("//button[contains(., 'Approvals')] | //a[contains(., 'Approvals')]")
        );
        approvalsTab.click();
        Thread.sleep(2500);

        System.out.println(">>> Landed on URL: " + DriverManager.getDriver().getCurrentUrl());

        // Find the card/row containing the title
        List<WebElement> matchingCards = DriverManager.getDriver().findElements(
            By.xpath("//*[contains(., 'Physics Revision Notes') and (self::tr or contains(@class, 'card') or contains(@class, 'rounded') or contains(@class, 'border'))]")
        );

        System.out.println("--- Matching Cards Found: " + matchingCards.size() + " ---");

        // Inspect all buttons present on the Approvals screen
        List<WebElement> allButtons = DriverManager.getDriver().findElements(By.tagName("button"));
        System.out.println("--- All Buttons on Approvals View ---");
        for (WebElement btn : allButtons) {
            String text = btn.getText().trim().replace("\n", " ");
            String ariaLabel = btn.getDomAttribute("aria-label");
            String titleAttr = btn.getDomAttribute("title");
            String dataTestId = btn.getDomAttribute("data-testid");
            System.out.println(String.format("Button text='%s' | aria-label='%s' | title='%s' | testid='%s'",
                    text, ariaLabel, titleAttr, dataTestId));
        }
    }
}