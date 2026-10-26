package com.elibrary.reports;

import com.aventstack.extentreports.ExtentReports;
import com.aventstack.extentreports.reporter.ExtentSparkReporter;
import com.aventstack.extentreports.reporter.configuration.Theme;
import com.elibrary.config.Constants;

public class ReportManager {
    private static ExtentReports extent;

    public static synchronized ExtentReports getExtentReports() {
        if (extent == null) {
            ExtentSparkReporter sparkReporter = new ExtentSparkReporter(Constants.REPORT_PATH);
            sparkReporter.config().setReportName("DAV eLibrary Test Automation Report");
            sparkReporter.config().setDocumentTitle("Test Execution Results");
            sparkReporter.config().setTheme(Theme.STANDARD);

            extent = new ExtentReports();
            extent.attachReporter(sparkReporter);
            extent.setSystemInfo("Application", "DAV Public School eLibrary");
            extent.setSystemInfo("Framework", "Selenium 4 + TestNG + REST Assured");
            extent.setSystemInfo("Environment", "Local Supabase (127.0.0.1:54324)");
        }
        return extent;
    }

    public static synchronized void flushReports() {
        if (extent != null) {
            extent.flush();
        }
    }
}