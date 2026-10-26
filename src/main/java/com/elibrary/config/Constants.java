package com.elibrary.config;

public final class Constants {
    private Constants() {}

    public static final int IMPLICIT_WAIT_SECONDS = 10;
    public static final int EXPLICIT_WAIT_SECONDS = 15;
    public static final int PAGE_LOAD_TIMEOUT_SECONDS = 30;

    public static final String REPORT_PATH = "test-output/ExtentReport.html";
    public static final String TEST_DATA_DIR = "src/test/resources/testdata/";
    public static final String SAMPLE_PDF_PATH = TEST_DATA_DIR + "sample.pdf";
}