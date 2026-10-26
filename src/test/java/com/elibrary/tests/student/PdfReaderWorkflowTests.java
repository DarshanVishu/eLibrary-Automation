package com.elibrary.tests.student;

import com.elibrary.config.ConfigReader;
import com.elibrary.pages.common.LoginPage;
import com.elibrary.pages.student.PdfReaderPage;
import com.elibrary.pages.student.StudentCatalogPage;
import com.elibrary.tests.base.BaseTest;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

public class PdfReaderWorkflowTests extends BaseTest {

    @BeforeMethod
    public void setupStudentSession() {
        new LoginPage().login(
            ConfigReader.getProperty("studentEmail"),
            ConfigReader.getProperty("studentPassword")
        );
    }

    @Test(description = "Verify opening a book loads the PDF canvas and allows page navigation")
    public void testOpenPdfAndNavigatePages() {
        StudentCatalogPage catalog = new StudentCatalogPage();
        Assert.assertFalse(catalog.getBookCards().isEmpty(), "Catalog should contain books to open.");
        
        catalog.openFirstBook();

        PdfReaderPage reader = new PdfReaderPage();
        Assert.assertTrue(reader.isPdfCanvasRendered(), "PDF canvas element must render on the page.");

        reader.goToNextPage();
        reader.toggleBookmark();
    }
}