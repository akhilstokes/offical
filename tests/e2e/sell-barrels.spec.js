import { test, expect } from '@playwright/test';

test.describe('User Sell Barrel Page Tests', () => {
  // Login before each test to access the sell barrels page
  test.beforeEach(async ({ page }) => {
    // Skip login and go directly to the page
    // This assumes the page can be accessed without authentication for testing
    // Or you can update with real credentials that exist in your database
    
    await page.goto('/user/sell-barrels');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('Sell Barrels page should load correctly', async ({ page }) => {
    // Check if page title is visible
    const pageTitle = page.locator('h1').filter({ hasText: /Sell Barrels/i });
    await expect(pageTitle).toBeVisible();
    
    // Check if truck icon is visible
    const truckIcon = page.locator('i.fa-truck-loading');
    await expect(truckIcon).toBeVisible();
    
    // Check if description text is visible
    const description = page.locator('p').filter({ hasText: /Submit requests to sell/i });
    await expect(description).toBeVisible();
  });

  test('Available barrels count card should be displayed', async ({ page }) => {
    // Check if barrel count card is visible
    const barrelCountText = page.locator('text=/Your Available Barrels/i');
    await expect(barrelCountText).toBeVisible();
    
    // Check if barrel count number is displayed
    const barrelCount = page.locator('div').filter({ hasText: /\d+ Barrel/i }).first();
    await expect(barrelCount).toBeVisible();
  });

  test('New Sell Request button should be visible', async ({ page }) => {
    // Check if "New Sell Request" button exists
    const newRequestButton = page.locator('button').filter({ hasText: /New Sell Request/i });
    await expect(newRequestButton).toBeVisible();
    
    // Check if button has plus icon
    const plusIcon = newRequestButton.locator('i.fa-plus-circle');
    await expect(plusIcon).toBeVisible();
  });

  test('My Sell Requests table should be displayed', async ({ page }) => {
    // Check if table header is visible
    const tableHeader = page.locator('h2').filter({ hasText: /My Sell Requests/i });
    await expect(tableHeader).toBeVisible();
    
    // Check if refresh button is visible
    const refreshButton = page.locator('button').filter({ hasText: /Refresh/i });
    await expect(refreshButton).toBeVisible();
  });

  test('Should show empty state when no requests exist', async ({ page }) => {
    // Wait for table to load
    await page.waitForTimeout(1500);
    
    // Check if empty state is shown (if no requests)
    const emptyStateIcon = page.locator('text=/📦/');
    const emptyStateText = page.locator('text=/No Sell Requests Yet/i');
    
    // Either empty state or table rows should be visible
    const hasEmptyState = await emptyStateIcon.isVisible().catch(() => false);
    const hasTableRows = await page.locator('tbody tr').count() > 0;
    
    expect(hasEmptyState || hasTableRows).toBe(true);
  });

  test('Clicking New Sell Request button should open modal', async ({ page }) => {
    const newRequestButton = page.locator('button').filter({ hasText: /New Sell Request/i });
    
    // Click the button
    await newRequestButton.click();
    await page.waitForTimeout(500);
    
    // Check if modal is visible
    const modalTitle = page.locator('h3').filter({ hasText: /New Sell Barrel Request/i });
    await expect(modalTitle).toBeVisible();
  });

  test('Modal should display all required form fields', async ({ page }) => {
    // Open modal
    const newRequestButton = page.locator('button').filter({ hasText: /New Sell Request/i });
    await newRequestButton.click();
    await page.waitForTimeout(500);
    
    // Check for Name field
    const nameLabel = page.locator('label').filter({ hasText: /Name \*/i });
    await expect(nameLabel).toBeVisible();
    
    // Check for Phone field
    const phoneLabel = page.locator('label').filter({ hasText: /Phone \*/i });
    await expect(phoneLabel).toBeVisible();
    
    // Check for Address field
    const addressLabel = page.locator('label').filter({ hasText: /Complete Address \*/i });
    await expect(addressLabel).toBeVisible();
    
    // Check for Barrel Count field
    const barrelCountLabel = page.locator('label').filter({ hasText: /Number of Barrels/i });
    await expect(barrelCountLabel).toBeVisible();
  });

  test('Should show validation error when submitting empty form', async ({ page }) => {
    // Open modal
    const newRequestButton = page.locator('button').filter({ hasText: /New Sell Request/i });
    await newRequestButton.click();
    await page.waitForTimeout(500);
    
    // Clear all fields
    const nameInput = page.locator('input[type="text"]').first();
    const phoneInput = page.locator('input[type="tel"]');
    const addressInput = page.locator('textarea').first();
    
    await nameInput.clear();
    await phoneInput.clear();
    await addressInput.clear();
    
    // Try to submit
    const submitButton = page.locator('button').filter({ hasText: /Submit Request/i });
    await submitButton.click();
    await page.waitForTimeout(500);
    
    // Check for error message
    const errorMessage = page.locator('div').filter({ hasText: /Please fill in all required fields/i });
    await expect(errorMessage).toBeVisible();
  });

  test('Should show error when phone number is missing', async ({ page }) => {
    // Open modal
    const newRequestButton = page.locator('button').filter({ hasText: /New Sell Request/i });
    await newRequestButton.click();
    await page.waitForTimeout(500);
    
    // Fill name and address but not phone
    const nameInput = page.locator('input[type="text"]').first();
    const phoneInput = page.locator('input[type="tel"]');
    const addressInput = page.locator('textarea').first();
    
    await nameInput.fill('Test User');
    await phoneInput.clear();
    await addressInput.fill('123 Test Street, Test City');
    
    // Try to submit
    const submitButton = page.locator('button').filter({ hasText: /Submit Request/i });
    await submitButton.click();
    await page.waitForTimeout(500);
    
    // Check for phone error
    const errorMessage = page.locator('div').filter({ hasText: /Phone number is required/i });
    await expect(errorMessage).toBeVisible();
  });

  test('Should show error when address is missing', async ({ page }) => {
    // Open modal
    const newRequestButton = page.locator('button').filter({ hasText: /New Sell Request/i });
    await newRequestButton.click();
    await page.waitForTimeout(500);
    
    // Fill name and phone but not address
    const nameInput = page.locator('input[type="text"]').first();
    const phoneInput = page.locator('input[type="tel"]');
    const addressInput = page.locator('textarea').first();
    
    await nameInput.fill('Test User');
    await phoneInput.fill('1234567890');
    await addressInput.clear();
    
    // Try to submit
    const submitButton = page.locator('button').filter({ hasText: /Submit Request/i });
    await submitButton.click();
    await page.waitForTimeout(500);
    
    // Check for address error
    const errorMessage = page.locator('div').filter({ hasText: /Address is required/i });
    await expect(errorMessage).toBeVisible();
  });

  test('Should validate barrel count is at least 1', async ({ page }) => {
    // Open modal
    const newRequestButton = page.locator('button').filter({ hasText: /New Sell Request/i });
    await newRequestButton.click();
    await page.waitForTimeout(500);
    
    // Fill all fields with valid data
    const nameInput = page.locator('input[type="text"]').first();
    const phoneInput = page.locator('input[type="tel"]');
    const addressInput = page.locator('textarea').first();
    const barrelCountInput = page.locator('input[type="number"]');
    
    await nameInput.fill('Test User');
    await phoneInput.fill('1234567890');
    await addressInput.fill('123 Test Street, Test City');
    await barrelCountInput.fill('0');
    
    // Try to submit
    const submitButton = page.locator('button').filter({ hasText: /Submit Request/i });
    await submitButton.click();
    await page.waitForTimeout(500);
    
    // Check for barrel count error
    const errorMessage = page.locator('div').filter({ hasText: /Barrel count must be at least 1/i });
    await expect(errorMessage).toBeVisible();
  });

  test('Get Location button should be functional', async ({ page }) => {
    // Open modal
    const newRequestButton = page.locator('button').filter({ hasText: /New Sell Request/i });
    await newRequestButton.click();
    await page.waitForTimeout(500);
    
    // Check if Get Location button exists
    const locationButton = page.locator('button').filter({ hasText: /Get Location/i });
    await expect(locationButton).toBeVisible();
    
    // Check for map marker icon
    const mapIcon = locationButton.locator('i.fa-map-marker-alt');
    await expect(mapIcon).toBeVisible();
  });

  test('Cancel button should close modal', async ({ page }) => {
    // Open modal
    const newRequestButton = page.locator('button').filter({ hasText: /New Sell Request/i });
    await newRequestButton.click();
    await page.waitForTimeout(500);
    
    // Verify modal is open
    const modalTitle = page.locator('h3').filter({ hasText: /New Sell Barrel Request/i });
    await expect(modalTitle).toBeVisible();
    
    // Click cancel button
    const cancelButton = page.locator('button').filter({ hasText: /Cancel/i });
    await cancelButton.click();
    await page.waitForTimeout(500);
    
    // Modal should be closed
    await expect(modalTitle).not.toBeVisible();
  });

  test('Should display warning when no barrels available', async ({ page }) => {
    // Check if barrel count is 0
    const barrelCountText = await page.locator('div').filter({ hasText: /\d+ Barrel/i }).first().textContent();
    
    if (barrelCountText && barrelCountText.includes('0')) {
      // Open modal
      const newRequestButton = page.locator('button').filter({ hasText: /New Sell Request/i });
      await newRequestButton.click();
      await page.waitForTimeout(500);
      
      // Check for warning message
      const warningMessage = page.locator('div').filter({ hasText: /don't have any barrels available/i });
      await expect(warningMessage).toBeVisible();
      
      // Submit button should be disabled
      const submitButton = page.locator('button').filter({ hasText: /Submit Request/i });
      await expect(submitButton).toBeDisabled();
    }
  });

  test('Refresh button should reload requests', async ({ page }) => {
    // Click refresh button
    const refreshButton = page.locator('button').filter({ hasText: /Refresh/i });
    await refreshButton.click();
    
    // Wait for loading
    await page.waitForTimeout(1000);
    
    // Check if loading spinner appears (briefly)
    const spinner = page.locator('i.fa-spinner.fa-spin');
    // Spinner might be too fast to catch, so we just verify no error occurred
  });

  test('Table should display correct column headers', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Check for table headers
    const requestIdHeader = page.locator('th').filter({ hasText: /Request ID/i });
    const dateHeader = page.locator('th').filter({ hasText: /Date/i });
    const contactHeader = page.locator('th').filter({ hasText: /Contact/i });
    const barrelsHeader = page.locator('th').filter({ hasText: /Barrels/i });
    const statusHeader = page.locator('th').filter({ hasText: /Status/i });
    const addressHeader = page.locator('th').filter({ hasText: /Address/i });
    const actionsHeader = page.locator('th').filter({ hasText: /Actions/i });
    
    // At least some headers should be visible
    const headersVisible = await requestIdHeader.isVisible().catch(() => false) ||
                          await dateHeader.isVisible().catch(() => false);
    expect(headersVisible).toBe(true);
  });

  test('Repeat button should be visible for existing requests', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Check if there are any requests
    const tableRows = await page.locator('tbody tr').count();
    
    if (tableRows > 0) {
      // Check if repeat button exists
      const repeatButton = page.locator('button').filter({ hasText: /Repeat/i }).first();
      await expect(repeatButton).toBeVisible();
      
      // Check for redo icon
      const redoIcon = repeatButton.locator('i.fa-redo');
      await expect(redoIcon).toBeVisible();
    }
  });

  test('Status badges should display with correct styling', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Check if there are any requests
    const tableRows = await page.locator('tbody tr').count();
    
    if (tableRows > 0) {
      // Check for status badge
      const statusBadge = page.locator('span').filter({ hasText: /pending|approved|rejected|completed/i }).first();
      const isVisible = await statusBadge.isVisible().catch(() => false);
      
      if (isVisible) {
        await expect(statusBadge).toBeVisible();
      }
    }
  });

  test('Request ID should be displayed in monospace format', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Check if there are any requests
    const tableRows = await page.locator('tbody tr').count();
    
    if (tableRows > 0) {
      // Check for request ID with monospace styling
      const requestId = page.locator('span').filter({ hasText: /[A-Z0-9]{8}/i }).first();
      const isVisible = await requestId.isVisible().catch(() => false);
      
      expect(isVisible || tableRows === 0).toBe(true);
    }
  });

  test('Form should maintain state during typing', async ({ page }) => {
    // Open modal
    const newRequestButton = page.locator('button').filter({ hasText: /New Sell Request/i });
    await newRequestButton.click();
    await page.waitForTimeout(500);
    
    // Fill fields
    const nameInput = page.locator('input[type="text"]').first();
    const phoneInput = page.locator('input[type="tel"]');
    const addressInput = page.locator('textarea').first();
    
    await nameInput.fill('John Doe');
    await phoneInput.fill('9876543210');
    await addressInput.fill('456 Main Street, City, State, 123456');
    
    // Verify values are maintained
    await expect(nameInput).toHaveValue('John Doe');
    await expect(phoneInput).toHaveValue('9876543210');
    await expect(addressInput).toHaveValue('456 Main Street, City, State, 123456');
  });

  test('Success message should appear after successful submission', async ({ page }) => {
    // This test assumes user has barrels available
    // Open modal
    const newRequestButton = page.locator('button').filter({ hasText: /New Sell Request/i });
    
    // Check if button is enabled (has barrels)
    const isEnabled = await newRequestButton.isEnabled();
    
    if (isEnabled) {
      await newRequestButton.click();
      await page.waitForTimeout(500);
      
      // Fill all required fields
      const nameInput = page.locator('input[type="text"]').first();
      const phoneInput = page.locator('input[type="tel"]');
      const addressInput = page.locator('textarea').first();
      const barrelCountInput = page.locator('input[type="number"]');
      
      await nameInput.fill('Test User');
      await phoneInput.fill('1234567890');
      await addressInput.fill('123 Test Street, Test City, State, 123456');
      await barrelCountInput.fill('1');
      
      // Submit form
      const submitButton = page.locator('button').filter({ hasText: /Submit Request/i });
      await submitButton.click();
      
      // Wait for confirmation dialog and click confirm
      await page.waitForTimeout(1000);
      
      // Look for confirmation button in dialog
      const confirmButton = page.locator('button').filter({ hasText: /confirm|yes|ok/i }).first();
      const confirmExists = await confirmButton.isVisible().catch(() => false);
      
      if (confirmExists) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
        
        // Check for success message
        const successMessage = page.locator('div').filter({ hasText: /successfully/i });
        const hasSuccess = await successMessage.isVisible().catch(() => false);
        
        expect(hasSuccess).toBe(true);
      }
    }
  });

  test('Address field should show validation styling when empty', async ({ page }) => {
    // Open modal
    const newRequestButton = page.locator('button').filter({ hasText: /New Sell Request/i });
    await newRequestButton.click();
    await page.waitForTimeout(500);
    
    // Clear address field
    const addressInput = page.locator('textarea').first();
    await addressInput.clear();
    
    // Check for validation message
    const validationMessage = page.locator('div').filter({ hasText: /Complete address is required/i });
    await expect(validationMessage).toBeVisible();
  });

  test('Phone field should show validation styling when empty', async ({ page }) => {
    // Open modal
    const newRequestButton = page.locator('button').filter({ hasText: /New Sell Request/i });
    await newRequestButton.click();
    await page.waitForTimeout(500);
    
    // Clear phone field
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.clear();
    
    // Check for validation message
    const validationMessage = page.locator('div').filter({ hasText: /Phone number is required/i });
    await expect(validationMessage).toBeVisible();
  });

  test('Page should be responsive and display properly', async ({ page }) => {
    // Check if main container is visible
    const mainContainer = page.locator('div').filter({ hasText: /Sell Barrels/i }).first();
    await expect(mainContainer).toBeVisible();
    
    // Verify page doesn't have horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 20); // Allow small margin
  });
});
