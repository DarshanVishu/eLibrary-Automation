package com.elibrary.pages.student;

import com.elibrary.config.ConfigReader;
import com.elibrary.pages.base.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.ArrayList;
import java.util.List;

public class StudentCatalogPage extends BasePage {

    private final By libraryNavBtn = By.xpath(
        "//button[contains(., 'Library')] | //a[contains(., 'Library')]"
    );

    private final By searchInput = By.cssSelector(
        "input[placeholder*='Search' i], input[type='search'], [data-testid='catalog-search-input']"
    );

    private final By bookCards = By.xpath(
        "//main//*[contains(@class, 'grid')]/*[(contains(@class, 'rounded') or contains(@class, 'card') or contains(@class, 'border')) and (.//h3 or .//h4 or .//button[contains(., 'Read') or contains(., 'View')])]"
    );

    private final By bookCardTitles = By.xpath(
        "//main//*[contains(@class, 'grid')]//*[(self::h3 or self::h4) and not(contains(., 'Library'))]"
    );

    private final By openBookActionBtn = By.xpath(
        ".//button[contains(., 'Read') or contains(., 'View') or contains(., 'Open')]"
    );

    private final By emptyStateIndicator = By.xpath(
        "//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'no books') or " +
        "contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'no materials') or " +
        "contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'no results') or " +
        "contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'nothing found') or " +
        "@data-testid='empty-state']"
    );

    public StudentCatalogPage navigateToLibrary() {
        String libraryUrl = ConfigReader.getBaseUrl() + "/student/library";

        if (driver.findElements(searchInput).isEmpty()) {
            try {
                if (!driver.findElements(libraryNavBtn).isEmpty()) {
                    WebElement nav = driver.findElement(libraryNavBtn);
                    ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block: 'center'});", nav);
                    ((JavascriptExecutor) driver).executeScript("arguments[0].click();", nav);
                } else {
                    driver.get(libraryUrl);
                }
            } catch (Exception e) {
                driver.get(libraryUrl);
            }
        }

        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(searchInput));
        } catch (Exception e) {
            driver.get(libraryUrl);
            wait.until(ExpectedConditions.visibilityOfElementLocated(searchInput));
        }
        return this;
    }

    public StudentCatalogPage searchBook(String query) {
        WebElement input = wait.until(ExpectedConditions.elementToBeClickable(searchInput));

        String reactInputScript =
            "var input = arguments[0];" +
            "var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;" +
            "nativeInputValueSetter.call(input, arguments[1]);" +
            "var ev = new Event('input', { bubbles: true });" +
            "input.dispatchEvent(ev);" +
            "var evChange = new Event('change', { bubbles: true });" +
            "input.dispatchEvent(evChange);";

        ((JavascriptExecutor) driver).executeScript(reactInputScript, input, query);

        try {
            Thread.sleep(800);
        } catch (InterruptedException ignored) {}

        input.sendKeys(Keys.ENTER);
        return this;
    }

    public List<WebElement> getBookCards() {
        return driver.findElements(bookCards);
    }

    public int getBookCount() {
        return driver.findElements(bookCards).size();
    }

    public int getBookCardCount() {
        return getBookCount();
    }

    public List<String> getAllBookTitles() {
        List<WebElement> elements = driver.findElements(bookCardTitles);
        List<String> titles = new ArrayList<>();
        for (WebElement el : elements) {
            if (el.isDisplayed() && !el.getText().trim().isEmpty()) {
                titles.add(el.getText().trim());
            }
        }
        return titles;
    }

    public List<String> getCatalogBookTitles() {
        return getAllBookTitles();
    }

    public boolean isEmptyStateDisplayed() {
        return !driver.findElements(emptyStateIndicator).isEmpty() &&
               driver.findElement(emptyStateIndicator).isDisplayed();
    }

    public boolean isNoResultsMessageDisplayed() {
        return isEmptyStateDisplayed();
    }

    public void openFirstBook() {
        List<WebElement> cards = driver.findElements(bookCards);
        if (!cards.isEmpty()) {
            WebElement target = cards.get(0);
            List<WebElement> actionBtns = target.findElements(openBookActionBtn);
            if (!actionBtns.isEmpty()) {
                ((JavascriptExecutor) driver).executeScript("arguments[0].click();", actionBtns.get(0));
            } else {
                ((JavascriptExecutor) driver).executeScript("arguments[0].click();", target);
            }
        }
    }
}