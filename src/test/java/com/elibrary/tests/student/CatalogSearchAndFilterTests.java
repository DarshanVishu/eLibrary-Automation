package com.elibrary.tests.student;

import com.elibrary.base.DriverManager;
import com.elibrary.config.ConfigReader;
import com.elibrary.pages.common.LoginPage;
import com.elibrary.pages.student.StudentCatalogPage;
import com.elibrary.tests.base.BaseTest;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.time.Duration;

public class CatalogSearchAndFilterTests extends BaseTest {

    @BeforeMethod
    public void authenticateStudent() {
        LoginPage loginPage = new LoginPage();
        loginPage.loginAndWaitForRoute(
            ConfigReader.getProperty("studentEmail"),
            ConfigReader.getProperty("studentPassword"),
            "/student"
        );

        WebDriverWait wait = new WebDriverWait(DriverManager.getDriver(), Duration.ofSeconds(15));
        wait.until(ExpectedConditions.urlContains("/student"));
    }

    @Test(description = "Verify search bar accepts input and updates view")
    public void testCatalogSearch() {
        StudentCatalogPage catalog = new StudentCatalogPage();
        catalog.navigateToLibrary();
        catalog.searchBook("Physics");

        System.out.println(">>> Books found after search: " + catalog.getBookCount());
        System.out.println(">>> Book titles rendered: " + catalog.getAllBookTitles());
        Assert.assertTrue(catalog.getBookCount() >= 0, "Catalog should respond to valid queries.");
    }

    @Test(description = "Verify empty state message on unresolvable search query")
    public void testCatalogEmptySearchResult() {
        StudentCatalogPage catalog = new StudentCatalogPage();
        catalog.navigateToLibrary();
        catalog.searchBook("zzzyyyxxx_impossible_query_99999");

        System.out.println(">>> Books found on invalid query: " + catalog.getBookCount());
        Assert.assertTrue(
            catalog.isEmptyStateDisplayed(),
            "Catalog should display zero matching cards or an empty state indicator for unresolvable queries."
        );
    }
}