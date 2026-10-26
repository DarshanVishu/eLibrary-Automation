package com.elibrary.listeners;

import com.aventstack.extentreports.MediaEntityBuilder;
import com.aventstack.extentreports.Status;
import com.elibrary.reports.ExtentTestManager;
import com.elibrary.reports.ReportManager;
import com.elibrary.utils.ScreenshotUtils;
import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;

public class TestListener implements ITestListener {

    @Override
    public void onStart(ITestContext context) {
        ReportManager.getExtentReports();
    }

    @Override
    public void onTestStart(ITestResult result) {
        ExtentTestManager.startTest(result.getMethod().getMethodName());
        ExtentTestManager.getTest().log(Status.INFO, "Started test: " + result.getMethod().getMethodName());
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        ExtentTestManager.getTest().log(Status.PASS, "Test passed successfully.");
        ExtentTestManager.unload();
    }

    @Override
    public void onTestFailure(ITestResult result) {
        ExtentTestManager.getTest().log(Status.FAIL, "Test failed: " + result.getThrowable());
        String base64Image = ScreenshotUtils.getBase64Screenshot();
        if (base64Image != null) {
            ExtentTestManager.getTest().fail(
                "Failure Screenshot",
                MediaEntityBuilder.createScreenCaptureFromBase64String(base64Image).build()
            );
        }
        ExtentTestManager.unload();
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        ExtentTestManager.getTest().log(Status.SKIP, "Test skipped: " + result.getThrowable());
        ExtentTestManager.unload();
    }

    @Override
    public void onFinish(ITestContext context) {
        ReportManager.flushReports();
    }
}