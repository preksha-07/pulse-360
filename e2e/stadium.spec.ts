import { test, expect } from '@playwright/test';

test.describe('Pulse360 E2E Portal Verification', () => {

  test('should load application and render command center metrics', async ({ page }) => {
    // Navigate to the base URL
    await page.goto('/');

    // Verify main header and brand header render
    const header = page.locator('h1:has-text("PULSE")');
    await expect(header).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Predictive AI Stadium Intelligence')).toBeVisible();

    // Check Command Center KPIs
    await expect(page.locator('text=Avg Gate Capacity')).toBeVisible();
    await expect(page.locator('text=Active Risks')).toBeVisible();
    await expect(page.locator('text=Volunteers Active')).toBeVisible();
    await expect(page.locator('text=Next Metro Surge')).toBeVisible();
  });

  test('should navigate tabs and render appropriate portal views', async ({ page }) => {
    await page.goto('/');

    // Check default active tab is Command Center
    const activeTab = page.locator('button[role="tab"].active');
    await expect(activeTab).toContainText('Command Center');

    // Click Fan Portal tab
    const fanTab = page.locator('button[role="tab"]:has-text("Fan Portal")');
    await fanTab.click();
    await expect(page.locator('h2:has-text("FAN PORTAL")')).toBeVisible();
    await expect(page.locator('text=Smart Transport')).toBeVisible();

    // Click Volunteer tab
    const volunteerTab = page.locator('button[role="tab"]:has-text("Volunteer")');
    await volunteerTab.click();
    await expect(page.locator('h2:has-text("VOLUNTEER PORTAL")')).toBeVisible();
    await expect(page.locator('text=VOLUNTEER AGENT')).toBeVisible();

    // Click Security tab
    const securityTab = page.locator('button[role="tab"]:has-text("Security")');
    await securityTab.click();
    await expect(page.locator('h2:has-text("SECURITY PORTAL")')).toBeVisible();
    await expect(page.locator('text=Live Crowd Heatmap')).toBeVisible();
  });

  test('should toggle languages and interact with Fan Assistant chatbot', async ({ page }) => {
    await page.goto('/');

    // Open Fan Portal
    await page.locator('button[role="tab"]:has-text("Fan Portal")').click();

    // Select Spanish language
    await page.locator('button:has-text("Spanish")').click();
    
    // Verify input placeholder changes to Spanish
    const chatInput = page.locator('input[placeholder*="Ask anything"]');
    await expect(chatInput).toHaveAttribute('placeholder', 'Ask anything in Spanish...');

    // Type query and send it
    await chatInput.fill('Where is the restroom?');
    await page.locator('button:has-text("Send")').click();

    // Check that message was sent and added to chat list
    await expect(page.locator('text=Where is the restroom?')).toBeVisible();

    // Verify AI reply appears in the chat box (initial welcome + new AI reply = 2)
    const aiResponses = page.locator('text=PULSE AI ✦');
    await expect(aiResponses).toHaveCount(2, { timeout: 10000 });
  });

  test('should display Live Crowd Heatmap on Security Portal', async ({ page }) => {
    await page.goto('/');

    // Navigate to Security
    await page.locator('button[role="tab"]:has-text("Security")').click();

    // Check crowd heatmap rendering
    await expect(page.locator('text=Live Crowd Heatmap')).toBeVisible();
    await expect(page.locator('.heatmap-cell >> text=Concourse')).toHaveCount(2);
  });
});
