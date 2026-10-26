package com.elibrary.tests.teacher;

import com.elibrary.base.DriverManager;
import com.elibrary.config.ConfigReader;
import com.elibrary.config.Constants;
import com.elibrary.pages.common.LoginPage;
import com.elibrary.pages.teacher.TeacherUploadPage;
import com.elibrary.tests.base.BaseTest;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.io.File;
import java.time.Duration;

public class ResourceUploadTests extends BaseTest {

    @BeforeMethod
    public void authenticateTeacher() {
        LoginPage loginPage = new LoginPage();
        loginPage.login(
            ConfigReader.getProperty("teacherEmail"),
            ConfigReader.getProperty("teacherPassword")
        );

        // Wait explicitly for Supabase auth cookies and Next.js redirect to /teacher
        WebDriverWait wait = new WebDriverWait(DriverManager.getDriver(), Duration.ofSeconds(15));
        wait.until(ExpectedConditions.urlContains("/teacher"));
    }

    @Test(description = "Verify teacher can upload a PDF resource via the modal")
    public void testSuccessfulPdfUpload() {
        TeacherUploadPage uploadPage = new TeacherUploadPage();

        File samplePdf = new File(Constants.SAMPLE_PDF_PATH);
        Assert.assertTrue(samplePdf.exists(), "Sample test PDF must exist at: " + Constants.SAMPLE_PDF_PATH);

        uploadPage.uploadPdfFile(samplePdf.getAbsolutePath())
                  .enterTitle("Physics Revision Notes Class 10")
                  .enterCode("BK-PHYS-10")
                  .selectSubject("Science")
                  .selectGrade("Class 10")
                  .clickStartUpload();

        Assert.assertTrue(uploadPage.isUploadSuccessful(), "Resource upload should trigger a confirmation toast or dismiss modal.");
    }
}