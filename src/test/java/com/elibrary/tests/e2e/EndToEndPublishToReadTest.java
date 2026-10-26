package com.elibrary.tests.e2e;

import com.elibrary.config.ConfigReader;
import com.elibrary.config.Constants;
import com.elibrary.pages.admin.AdminManagementPage;
import com.elibrary.pages.common.LoginPage;
import com.elibrary.pages.student.StudentCatalogPage;
import com.elibrary.pages.teacher.TeacherUploadPage;
import com.elibrary.tests.base.BaseTest;
import org.testng.Assert;
import org.testng.annotations.Test;

import java.io.File;

public class EndToEndPublishToReadTest extends BaseTest {

    @Test(description = "E2E: Teacher uploads resource -> Admin approves -> Student discovers in catalog")
    public void testCompleteResourceLifecycle() {
        // Unique title guarantees zero collisions with existing backlog
        String uniqueBookTitle = "Bio Notes " + (System.currentTimeMillis() % 100000);
        LoginPage loginPage = new LoginPage();

        // 1. Teacher Logs In and Uploads Resource
        loginPage.loginAndWaitForRoute(
            ConfigReader.getProperty("teacherEmail"),
            ConfigReader.getProperty("teacherPassword"),
            "/teacher"
        );

        TeacherUploadPage uploadPage = new TeacherUploadPage();
        uploadPage.uploadPdfFile(new File(Constants.SAMPLE_PDF_PATH).getAbsolutePath())
                  .enterTitle(uniqueBookTitle)
                  .enterCode("BK-BIO-10")
                  .selectSubject("Computer Science")
                  .selectGrade("Class 10")
                  .clickStartUpload();

        Assert.assertTrue(uploadPage.isUploadSuccessful(), "Resource must be submitted by teacher.");

        // Clear session and return to login
        loginPage.navigateToLoginPage();

        // 2. Admin Logs In, Reviews & Approves the specific resource
        loginPage.loginAndWaitForRoute(
            ConfigReader.getProperty("adminEmail"),
            ConfigReader.getProperty("adminPassword"),
            "/admin"
        );

        AdminManagementPage adminPage = new AdminManagementPage();
        adminPage.approveResourceByTitle(uniqueBookTitle);
        Assert.assertTrue(adminPage.isResourceApproved(uniqueBookTitle), "Resource must transition to Approved status.");

        // Clear session and return to login
        loginPage.navigateToLoginPage();

        // 3. Student Logs In and Discovers Resource in Catalog
        loginPage.loginAndWaitForRoute(
            ConfigReader.getProperty("studentEmail"),
            ConfigReader.getProperty("studentPassword"),
            "/student"
        );

        StudentCatalogPage catalogPage = new StudentCatalogPage();
        catalogPage.navigateToLibrary();
        catalogPage.searchBook(uniqueBookTitle);

        Assert.assertTrue(catalogPage.getBookCount() > 0, "Approved resource should be visible in student catalog search.");
        Assert.assertTrue(catalogPage.getAllBookTitles().contains(uniqueBookTitle), "Exact book title should appear in catalog cards.");
    }
}