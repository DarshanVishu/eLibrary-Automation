package com.elibrary.base;

import com.elibrary.config.ConfigReader;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.time.Duration;

public class DriverManager {

    private static final ThreadLocal<WebDriver> driverThreadLocal = new ThreadLocal<>();

    public static void initDriver() {
        if (driverThreadLocal.get() == null) {
            ChromeOptions options = new ChromeOptions();

            // Auto-detect Linux (GitHub Actions runner) or CLI flag
            boolean isLinux = System.getProperty("os.name", "").toLowerCase().contains("linux");
            String cliHeadless = System.getProperty("headless");
            boolean isHeadless = isLinux || (cliHeadless != null
                ? Boolean.parseBoolean(cliHeadless)
                : Boolean.parseBoolean(ConfigReader.getProperty("headless")));

            if (isHeadless) {
                options.addArguments("--headless=new");
            }

            options.addArguments("--window-size=1920,1080");
            options.addArguments("--disable-gpu");
            options.addArguments("--no-sandbox");
            options.addArguments("--disable-dev-shm-usage");
            options.addArguments("--remote-allow-origins=*");

            WebDriver driver = new ChromeDriver(options);
            driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(0));
            driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));
            driver.manage().window().maximize();

            setDriver(driver);
        }
    }

    public static WebDriver getDriver() {
        return driverThreadLocal.get();
    }

    public static void setDriver(WebDriver driver) {
        driverThreadLocal.set(driver);
    }

    public static void unload() {
        driverThreadLocal.remove();
    }

    public static void quitDriver() {
        WebDriver driver = driverThreadLocal.get();
        if (driver != null) {
            driver.quit();
            unload();
        }
    }
}
