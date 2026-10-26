package com.elibrary.tests.base;

import com.elibrary.base.DriverFactory;
import com.elibrary.base.DriverManager;
import com.elibrary.config.ConfigReader;
import org.openqa.selenium.WebDriver;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Optional;
import org.testng.annotations.Parameters;

public abstract class BaseTest {

    @BeforeMethod(alwaysRun = true)
    @Parameters({"browser"})
    public void setUp(@Optional("") String browserParam) {
        String browser = (browserParam != null && !browserParam.isEmpty()) 
                         ? browserParam 
                         : ConfigReader.getBrowser();
        
        WebDriver driver = DriverFactory.createDriver(browser);
        DriverManager.setDriver(driver);
        
        // Load clean base URL
        driver.get(ConfigReader.getBaseUrl());
        driver.manage().deleteAllCookies();
    }

    @AfterMethod(alwaysRun = true)
    public void tearDown() {
        WebDriver driver = DriverManager.getDriver();
        if (driver != null) {
            try {
                driver.manage().deleteAllCookies();
            } catch (Exception ignored) {}
            driver.quit();
            DriverManager.unload();
        }
    }
}