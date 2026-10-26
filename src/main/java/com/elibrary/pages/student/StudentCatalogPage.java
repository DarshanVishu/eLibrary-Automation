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
            if (!driver.findElements(libraryNavBtn).isEmpty()) {
                WebElement nav = wait.until(ExpectedConditions.elementToBeClickable(libraryNavBtn));
                ((JavascriptExecutor) driver).executeScript("arguments[0].click();", nav);
            } else {
                driver.get(libraryUrl);
            }
        }

        wait.until(ExpectedConditions.visibilityOfElementLocated(searchInput));
        return this;
    }

    public StudentCatalogPage searchBook(String query) {
        WebElement input = wait.until(ExpectedConditions.elementToBeClickable(searchInput));

        // Use React 16/18 Prototype value setter so React registers the internal state change
        String reactInputScript =
            "var input = arguments[0];" +
            "var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;" +
            "nativeInputValueSetter.call(input, arguments[1]);" +
            "var ev = new Event('input', { bubbles: true });" +
            "input.dispatchEvent(ev);" +
            "var evChange = new Event('change', { bubbles: true });" +
            "input.dispatchEvent(evChange);";

        ((JavascriptExecutor) driver).executeScript(reactInputScript, input, query);

        // Also trigger native Enter key
        input.sendKeys(Keys.ENTER);

        try {
            Thread.sleep(1200); // Allow debounced state filter to commit
        } catch (InterruptedException ignored) {}

        return this;
    }

    public List<WebElement> getBookCards() {
        return driver.findElements(bookCards);
    }

    public int getBookCount() {
        return getBookCards().size();
    }

    public List<String> getAllBookTitles() {
        List<WebElement> titleElements = driver.findElements(bookCardTitles);
        List<String> titles = new ArrayList<>();
        for (WebElement el : titleElements) {
            String text = el.getText().trim();
            if (!text.isEmpty()) {
                titles.add(text);
            }
        }
        return titles;
    }

    public StudentCatalogPage openFirstBook() {
        List<WebElement> cards = getBookCards();
        if (cards.isEmpty()) {
            throw new RuntimeException("No book cards available to open in catalog.");
        }

        WebElement firstCard = cards.get(0);
        List<WebElement> actionButtons = firstCard.findElements(openBookActionBtn);

        if (!actionButtons.isEmpty()) {
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", actionButtons.get(0));
        } else {
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", firstCard);
        }

        return this;
    }

    public boolean isEmptyStateDisplayed() {
        try {
            wait.until(d -> !d.findElements(emptyStateIndicator).isEmpty() || d.findElements(bookCards).isEmpty());
            return !driver.findElements(emptyStateIndicator).isEmpty() || driver.findElements(bookCards).isEmpty();
        } catch (Exception e) {
            return driver.findElements(bookCards).isEmpty();
        }
    }
}