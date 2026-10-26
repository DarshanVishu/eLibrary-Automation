package com.elibrary.pages.admin;

import com.elibrary.config.ConfigReader;
import com.elibrary.pages.base.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.List;

public class AdminManagementPage extends BasePage {

    private final By approveBtn = By.xpath(
        ".//button[contains(., 'Approve & Publish')]"
    );
    private final By rejectBtn = By.xpath(
        ".//button[contains(., 'Reject')]"
    );
    private final By approveAllBtn = By.xpath(
        "//button[contains(., 'Approve All Pending')]"
    );

    private final By resourceCards = By.xpath(
        "//*[contains(@class, 'rounded') and .//button[contains(., 'Approve & Publish')]]"
    );

    public AdminManagementPage openApprovalsView() {
        String targetUrl = ConfigReader.getBaseUrl() + "/admin/approvals";
        driver.get(targetUrl);

        try {
            Thread.sleep(1200);
        } catch (InterruptedException ignored) {}

        wait.until(ExpectedConditions.presenceOfElementLocated(
            By.xpath("//*[contains(text(), 'Content Approvals') or contains(text(), 'Pending')]")
        ));
        return this;
    }

    public void clearAllPendingIfAny() {
        openApprovalsView();
        List<WebElement> approveAll = driver.findElements(approveAllBtn);
        if (!approveAll.isEmpty() && approveAll.get(0).isDisplayed()) {
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", approveAll.get(0));
            try {
                Thread.sleep(1500);
            } catch (InterruptedException ignored) {}
        }
    }

    public AdminManagementPage approveResourceByTitle(String title) {
        openApprovalsView();

        By cardLocator = By.xpath(
            "//*[contains(@class, 'rounded') and .//*[contains(text(), '" + title + "')] and .//button[contains(., 'Approve & Publish')]]"
        );

        WebElement container = wait.until(ExpectedConditions.visibilityOfElementLocated(cardLocator));

        boolean clicked = false;
        for (int i = 0; i < 5; i++) {
            try {
                WebElement approveAction = container.findElement(approveBtn);
                ((JavascriptExecutor) driver).executeScript("arguments[0].click();", approveAction);
                clicked = true;
                break;
            } catch (StaleElementReferenceException e) {
                try {
                    Thread.sleep(300);
                } catch (InterruptedException ignored) {}
                container = driver.findElement(cardLocator);
            }
        }

        if (!clicked) {
            throw new RuntimeException("Could not click 'Approve & Publish' for resource: " + title);
        }

        return this;
    }

    public AdminManagementPage rejectResourceByTitle(String title) {
        openApprovalsView();

        By cardLocator = By.xpath(
            "//*[contains(@class, 'rounded') and .//*[contains(text(), '" + title + "')] and .//button[contains(., 'Reject')]]"
        );

        WebElement container = wait.until(ExpectedConditions.visibilityOfElementLocated(cardLocator));
        WebElement rejectAction = container.findElement(rejectBtn);
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", rejectAction);

        return this;
    }

    public boolean isResourceApproved(String title) {
        By specificCardLocator = By.xpath(
            "//*[contains(@class, 'rounded') and .//*[contains(text(), '" + title + "')] and .//button[contains(., 'Approve & Publish')]]"
        );

        try {
            return wait.until(ExpectedConditions.invisibilityOfElementLocated(specificCardLocator));
        } catch (Exception e) {
            return driver.findElements(specificCardLocator).isEmpty();
        }
    }

    public List<WebElement> getResourceList() {
        return findElements(resourceCards);
    }
}