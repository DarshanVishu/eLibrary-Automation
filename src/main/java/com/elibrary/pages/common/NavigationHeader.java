package com.elibrary.pages.common;

import com.elibrary.pages.base.BasePage;
import org.openqa.selenium.By;

public class NavigationHeader extends BasePage {
    // Matches standard header, nav, or sidebar shells rendered by the role layouts
    private final By dashboardShell = By.cssSelector("header, nav, aside, [data-testid='app-header'], main");
    private final By userAvatarMenu = By.cssSelector("[data-testid='user-avatar-trigger'], button[aria-haspopup='menu']");
    private final By logoutButton = By.xpath("//div[@role='menuitem' and (contains(., 'Sign Out') or contains(., 'Log out'))]");
    private final By roleBadge = By.cssSelector("[data-testid='user-role-badge']");

    public boolean isHeaderDisplayed() {
        try {
            waitForVisibility(dashboardShell);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getCurrentUserRole() {
        return getText(roleBadge);
    }

    public void openUserMenu() {
        click(userAvatarMenu);
    }

    public void logout() {
        openUserMenu();
        click(logoutButton);
    }
}