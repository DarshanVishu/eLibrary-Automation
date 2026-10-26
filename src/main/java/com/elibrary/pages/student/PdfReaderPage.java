package com.elibrary.pages.student;

import com.elibrary.pages.base.BasePage;
import org.openqa.selenium.By;

public class PdfReaderPage extends BasePage {
    private final By pdfCanvas = By.cssSelector("canvas, .embedpdf-canvas");
    private final By nextPageBtn = By.cssSelector("button[aria-label='Next page'], [data-testid='pdf-next-page']");
    private final By prevPageBtn = By.cssSelector("button[aria-label='Previous page'], [data-testid='pdf-prev-page']");
    private final By pageCounter = By.cssSelector("[data-testid='page-number-indicator']");
    private final By bookmarkBtn = By.cssSelector("button[aria-label='Bookmark page'], [data-testid='bookmark-toggle']");

    public boolean isPdfCanvasRendered() {
        return isDisplayed(pdfCanvas);
    }

    public void goToNextPage() {
        click(nextPageBtn);
    }

    public void goToPreviousPage() {
        click(prevPageBtn);
    }

    public String getCurrentPageText() {
        return getText(pageCounter);
    }

    public void toggleBookmark() {
        click(bookmarkBtn);
    }
}