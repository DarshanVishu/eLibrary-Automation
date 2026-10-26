package com.elibrary.pages.teacher;

import com.elibrary.config.ConfigReader;
import com.elibrary.pages.base.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class TeacherUploadPage extends BasePage {

    private final By uploadNewBtn = By.xpath("//button[contains(., 'Upload New')]");

    // Modal elements
    private final By fileInput = By.cssSelector("input[type='file'][accept*='pdf'], input[type='file']");
    private final By titleInput = By.cssSelector("input[placeholder*='Mathematics Textbook'], input[placeholder*='Textbook' i]");
    private final By bookCodeInput = By.cssSelector("input[placeholder*='BK-MATH'], input[placeholder*='code' i]");

    // Dropdown triggers inside modal
    private final By subjectDropdown = By.xpath("//button[contains(., 'Select subject') or contains(., 'Computer Science')]");
    private final By gradeDropdown = By.xpath("//button[contains(., 'Select grade') or contains(., 'Class')]");

    // Action button
    private final By startUploadBtn = By.xpath("//button[contains(., 'Start Upload')]");

    // Feedback
    private final By validationError = By.xpath("//*[contains(text(), 'Please fill out all fields')]");
    private final By uploadSuccessAlert = By.xpath(
        "//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'success') or " +
        "contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'uploaded') or " +
        "@data-testid='upload-success-toast']"
    );

    public TeacherUploadPage openUploadModal() {
        String targetUrl = ConfigReader.getBaseUrl() + "/teacher/uploads";
        if (!driver.getCurrentUrl().contains("/teacher/uploads")) {
            driver.get(targetUrl);
        }

        wait.until(ExpectedConditions.urlContains("/teacher/uploads"));
        wait.until(ExpectedConditions.presenceOfElementLocated(uploadNewBtn));

        boolean clicked = false;
        for (int i = 0; i < 5; i++) {
            try {
                WebElement btn = driver.findElement(uploadNewBtn);
                ((JavascriptExecutor) driver).executeScript("arguments[0].click();", btn);
                clicked = true;
                break;
            } catch (StaleElementReferenceException e) {
                try {
                    Thread.sleep(300);
                } catch (InterruptedException ignored) {}
            }
        }

        if (!clicked) {
            throw new RuntimeException("Could not click 'Upload New' due to element staleness.");
        }

        wait.until(ExpectedConditions.presenceOfElementLocated(fileInput));
        wait.until(ExpectedConditions.visibilityOfElementLocated(titleInput));
        return this;
    }

    public TeacherUploadPage uploadPdfFile(String absoluteFilePath) {
        openUploadModal();

        WebElement input = driver.findElement(fileInput);
        ((JavascriptExecutor) driver).executeScript(
            "arguments[0].style.display = 'block'; arguments[0].style.opacity = '1'; arguments[0].style.visibility = 'visible';",
            input
        );

        input.sendKeys(absoluteFilePath);
        return this;
    }

    public TeacherUploadPage enterTitle(String title) {
        sendKeys(titleInput, title);
        return this;
    }

    public TeacherUploadPage enterCode(String code) {
        if (!driver.findElements(bookCodeInput).isEmpty()) {
            sendKeys(bookCodeInput, code);
        }
        return this;
    }

    public TeacherUploadPage selectGrade(String grade) {
        WebElement dropdown = wait.until(ExpectedConditions.elementToBeClickable(gradeDropdown));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", dropdown);

        By optionLocator = By.xpath(
            "//*[contains(@class, 'menu') or @role='menu' or @role='listbox']//*[normalize-space()='" + grade + "'] | " +
            "//button[normalize-space()='" + grade + "'] | " +
            "//div[normalize-space()='" + grade + "']"
        );
        WebElement option = wait.until(ExpectedConditions.elementToBeClickable(optionLocator));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", option);
        return this;
    }

    public TeacherUploadPage selectSubject(String subject) {
        WebElement dropdown = wait.until(ExpectedConditions.elementToBeClickable(subjectDropdown));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", dropdown);

        By optionLocator = By.xpath(
            "//*[contains(@class, 'menu') or @role='menu' or @role='listbox']//*[normalize-space()='" + subject + "'] | " +
            "//button[normalize-space()='" + subject + "'] | " +
            "//div[normalize-space()='" + subject + "']"
        );
        WebElement option = wait.until(ExpectedConditions.elementToBeClickable(optionLocator));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", option);
        return this;
    }

    public void clickStartUpload() {
        WebElement submitBtn = wait.until(ExpectedConditions.elementToBeClickable(startUploadBtn));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", submitBtn);
    }

    public boolean isUploadSuccessful() {
        // If "Please fill out all fields." is present, the upload failed
        if (!driver.findElements(validationError).isEmpty()) {
            return false;
        }

        try {
            return waitForVisibility(uploadSuccessAlert).isDisplayed();
        } catch (Exception e) {
            // Modal closing indicates clean submission
            return driver.findElements(titleInput).isEmpty();
        }
    }
}