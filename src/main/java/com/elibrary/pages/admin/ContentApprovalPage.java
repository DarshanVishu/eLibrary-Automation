package com.elibrary.pages.admin;

import com.elibrary.pages.base.BasePage;
import org.openqa.selenium.By;

public class ContentApprovalPage extends BasePage {
    private final By pendingApprovalList = By.cssSelector("[data-testid='pending-approval-item']");
    private final By approveButton = By.cssSelector("button[data-testid='approve-content-btn']");
    private final By rejectButton = By.cssSelector("button[data-testid='reject-content-btn']");
    private final By confirmationToast = By.xpath("//*[contains(text(), 'Status updated') or contains(text(), 'Resource approved')]");

    public boolean hasPendingItems() {
        return !findElements(pendingApprovalList).isEmpty();
    }

    public void approveFirstItem() {
        click(approveButton);
    }

    public void rejectFirstItem() {
        click(rejectButton);
    }

    public boolean isApprovalConfirmed() {
        return isDisplayed(confirmationToast);
    }
}