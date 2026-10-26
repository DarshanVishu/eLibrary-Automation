package com.elibrary.utils;

import com.elibrary.base.DriverManager;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;

public class ScreenshotUtils {
    public static String getBase64Screenshot() {
        if (DriverManager.getDriver() != null) {
            return ((TakesScreenshot) DriverManager.getDriver()).getScreenshotAs(OutputType.BASE64);
        }
        return null;
    }
}