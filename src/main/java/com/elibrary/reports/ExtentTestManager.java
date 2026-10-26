package com.elibrary.reports;

import com.aventstack.extentreports.ExtentTest;

public class ExtentTestManager {
    private static final ThreadLocal<ExtentTest> extentTestThreadLocal = new ThreadLocal<>();

    public static ExtentTest getTest() {
        return extentTestThreadLocal.get();
    }

    public static void startTest(String testName) {
        ExtentTest test = ReportManager.getExtentReports().createTest(testName);
        extentTestThreadLocal.set(test);
    }

    public static void unload() {
        extentTestThreadLocal.remove();
    }
}