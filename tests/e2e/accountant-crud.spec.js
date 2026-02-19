import { test, expect } from '@playwright/test';

/**
 * Accountant CRUD Operations Test Suite
 * 
 * This test suite covers all CRUD operations for the Accountant role:
 * - Salary Management (Create, Read, Update, Delete)
 * - Attendance Management (Read, Verify)
 * - Latex Billing (Read, Calculate, Approve)
 * - Company Rate Management (Read, Update)
 * - Payslip Generation and Distribution
 */

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Test credentials
const ACCOUNTANT_CREDENTIALS = {
  email: 'accountant@holyfamily.com',
  password: 'accountant123'
};

// Helper function to login as accountant
async function loginAsAccountant(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', ACCOUNTANT_CREDENTIALS.email);
  await page.fill('input[name="password"]', ACCOUNTANT_CREDENTIALS.password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/accountant/dashboard', { timeout: 10000 });
  await expect(page).toHaveURL(/.*accountant\/dashboard/);
}

// Helper function to wait for API response
async function waitForAPIResponse(page, urlPattern) {
  return await page.waitForResponse(
    response => response.url().includes(urlPattern) && response.status() === 200,
    { timeout: 10000 }
  );
}

test.describe('Accountant Authentication', () => {
  test('should login successfully as accountant', async ({ page }) => {
    await loginAsAccountant(page);
    
    // Verify dashboard is loaded
    await expect(page.locator('h1')).toContainText('Accountant Dashboard');
    
    // Verify quick actions are visible
    await expect(page.locator('text=Auto Wages')).toBeVisible();
    await expect(page.locator('text=Set Live Rate')).toBeVisible();
    await expect(page.locator('text=Attendance')).toBeVisible();
    await expect(page.locator('text=Salaries')).toBeVisible();
  });

  test('should have correct navigation menu', async ({ page }) => {
    await loginAsAccountant(page);
    
    // Check sidebar navigation
    const sidebar = page.locator('.accountant-sidebar, nav');
    await expect(sidebar).toBeVisible();
    
    // Verify navigation links
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Salaries')).toBeVisible();
    await expect(page.locator('text=Attendance')).toBeVisible();
  });
});

test.describe('Salary Management - CREATE Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAccountant(page);
  });

  test('should navigate to salary management page', async ({ page }) => {
    await page.click('text=Salaries');
    await page.waitForURL('**/accountant/salaries');
    
    await expect(page.locator('h1')).toContainText('Staff Salaries Management');
  });

  test('should display staff list with all required columns', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/salaries`);
    await page.waitForLoadState('networkidle');
    
    // Verify table headers
    await expect(page.locator('th:has-text("STAFF NAME")')).toBeVisible();
    await expect(page.locator('th:has-text("ROLE")')).toBeVisible();
    await expect(page.locator('th:has-text("DAILY SALARY")')).toBeVisible();
    await expect(page.locator('th:has-text("SALARY TYPE")')).toBeVisible();
    await expect(page.locator('th:has-text("CALCULATOR")')).toBeVisible();
    await expect(page.locator('th:has-text("PAYSLIP")')).toBeVisible();
    await expect(page.locator('th:has-text("PAYMENT")')).toBeVisible();
  });

  test('should open salary calculator modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/salaries`);
    await page.waitForLoadState('networkidle');
    
    // Click first calculator button
    const calculatorBtn = page.locator('button.calculator-btn').first();
    await calculatorBtn.waitFor({ state: 'visible', timeout: 5000 });
    await calculatorBtn.click();
    
    // Verify modal is open
    await expect(page.locator('.calculator-modal, .modal-title:has-text("Calculate Salary")')).toBeVisible({ timeout: 5000 });
  });

  test('should calculate monthly salary for staff', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/salaries`);
    await page.waitForLoadState('networkidle');
    
    // Find a staff member without calculated salary
    const calculatorBtn = page.locator('button.calculator-btn:not(.disabled)').first();
    
    if (await calculatorBtn.count() > 0) {
      await calculatorBtn.click();
      
      // Fill in salary details
      await page.fill('input[name="workingDays"], input[placeholder*="working days"]', '26');
      await page.fill('input[name="basicSalary"], input[placeholder*="basic"]', '700');
      await page.fill('input[name="medicalAllowance"], input[placeholder*="medical"]', '500');
      await page.fill('input[name="transportationAllowance"], input[placeholder*="transport"]', '300');
      
      // Submit calculation
      await page.click('button:has-text("Calculate"), button[type="submit"]');
      
      // Handle confirmation dialog
      await page.click('button:has-text("Confirm"), button:has-text("Yes")');
      
      // Wait for success message
      await expect(page.locator('text=Salary generated successfully')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should calculate weekly salary for field staff', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/salaries`);
    await page.waitForLoadState('networkidle');
    
    // Filter for field staff
    await page.click('input[type="checkbox"] + span:has-text("Field Staff Only")');
    await page.waitForTimeout(1000);
    
    const calculatorBtn = page.locator('button.calculator-btn:not(.disabled)').first();
    
    if (await calculatorBtn.count() > 0) {
      await calculatorBtn.click();
      
      // Fill weekly wage details
      await page.fill('input[name="numberOfWeeks"]', '1');
      await page.fill('input[name="workingDays"]', '6');
      await page.fill('input[name="basicSalary"]', '500');
      
      // Set date range
      const today = new Date();
      const startDate = new Date(today.setDate(today.getDate() - 7));
      await page.fill('input[name="startDate"]', startDate.toISOString().split('T')[0]);
      await page.fill('input[name="endDate"]', new Date().toISOString().split('T')[0]);
      
      // Submit
      await page.click('button:has-text("Calculate")');
      await page.click('button:has-text("Confirm"), button:has-text("Yes")');
      
      await expect(page.locator('text=Salary generated successfully')).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Salary Management - READ Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAccountant(page);
    await page.goto(`${BASE_URL}/accountant/salaries`);
  });

  test('should filter staff by role', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Test manager filter
    await page.click('input[type="checkbox"] + span:has-text("Manager Only")');
    await page.waitForTimeout(500);
    
    const managerRows = page.locator('tbody tr');
    const count = await managerRows.count();
    
    if (count > 0) {
      // Verify all visible rows are managers
      const roleBadges = page.locator('.role-badge');
      for (let i = 0; i < await roleBadges.count(); i++) {
        await expect(roleBadges.nth(i)).toContainText('MANAGER');
      }
    }
  });

  test('should display staff daily salary rates', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check if daily salary is displayed
    const salaryCell = page.locator('.daily-salary, td:has-text("₹")').first();
    await expect(salaryCell).toBeVisible();
    
    // Verify salary format
    const salaryText = await salaryCell.textContent();
    expect(salaryText).toMatch(/₹\d+/);
  });

  test('should display wage type (Weekly/Monthly)', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const wageTypeBadge = page.locator('.wage-type-badge').first();
    await expect(wageTypeBadge).toBeVisible();
    
    const wageType = await wageTypeBadge.textContent();
    expect(['Weekly', 'Monthly', 'Daily']).toContain(wageType);
  });

  test('should view generated payslip', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Click on payslip button for staff with calculated salary
    const payslipBtn = page.locator('button:has-text("Payslip")').first();
    
    if (await payslipBtn.count() > 0) {
      await payslipBtn.click();
      
      // Verify payslip modal opens
      await expect(page.locator('.payslip-modal, .modal:has-text("Payslip")')).toBeVisible({ timeout: 5000 });
      
      // Verify payslip details
      await expect(page.locator('text=Gross Salary')).toBeVisible();
      await expect(page.locator('text=Net Salary')).toBeVisible();
      await expect(page.locator('text=Deductions')).toBeVisible();
    }
  });
});

test.describe('Salary Management - UPDATE Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAccountant(page);
    await page.goto(`${BASE_URL}/accountant/salaries`);
  });

  test('should edit staff daily salary', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Click edit button for first staff
    const editBtn = page.locator('button.salary-edit-btn, button[title*="Edit"]').first();
    await editBtn.click();
    
    // Edit salary input should be visible
    const salaryInput = page.locator('input.salary-edit-input, input[type="number"]').first();
    await expect(salaryInput).toBeVisible();
    
    // Enter new salary
    await salaryInput.fill('750');
    
    // Save changes
    await page.click('button.salary-save-btn, button:has-text("Save"), .fa-check');
    
    // Verify success message
    await expect(page.locator('text=Daily salary updated successfully')).toBeVisible({ timeout: 5000 });
  });

  test('should cancel salary edit', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const editBtn = page.locator('button.salary-edit-btn').first();
    await editBtn.click();
    
    const salaryInput = page.locator('input.salary-edit-input').first();
    await salaryInput.fill('999');
    
    // Cancel edit
    await page.click('button.salary-cancel-btn, button:has-text("Cancel"), .fa-times');
    
    // Verify input is hidden
    await expect(salaryInput).not.toBeVisible();
  });

  test('should process salary payment via bank transfer', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Find staff with calculated but unpaid salary
    const paymentBtn = page.locator('button:has-text("Credit Salary")').first();
    
    if (await paymentBtn.count() > 0) {
      await paymentBtn.click();
      
      // Select bank transfer
      await page.click('input[value="bank"]');
      
      // Fill bank details
      await page.fill('input[name="accountNumber"], input[placeholder*="account"]', '1234567890');
      await page.fill('input[name="ifsc"], input[placeholder*="IFSC"]', 'SBIN0001234');
      
      // Confirm payment
      await page.click('button:has-text("Credit"), button:has-text("Pay")');
      await page.click('button:has-text("Confirm"), button:has-text("Yes")');
      
      // Verify success
      await expect(page.locator('text=Salary credited successfully')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should process salary payment via UPI', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const paymentBtn = page.locator('button:has-text("Credit Salary")').first();
    
    if (await paymentBtn.count() > 0) {
      await paymentBtn.click();
      
      // Select UPI
      await page.click('input[value="upi"]');
      
      // Fill UPI details
      await page.fill('input[name="upiId"], input[placeholder*="UPI"]', 'testuser');
      
      // Confirm payment
      await page.click('button:has-text("Credit"), button:has-text("Pay")');
      await page.click('button:has-text("Confirm")');
      
      await expect(page.locator('text=Salary credited successfully')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should send payslip to staff', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Open payslip
    const payslipBtn = page.locator('button:has-text("Payslip")').first();
    
    if (await payslipBtn.count() > 0) {
      await payslipBtn.click();
      
      // Click send to staff button
      const sendBtn = page.locator('button:has-text("Send to Staff")');
      
      if (await sendBtn.count() > 0) {
        await sendBtn.click();
        
        // Verify success
        await expect(page.locator('text=Payslip sent')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Attendance Management - READ Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAccountant(page);
  });

  test('should navigate to attendance page', async ({ page }) => {
    await page.click('text=Attendance');
    await page.waitForURL('**/accountant/attendance');
    
    await expect(page.locator('h1')).toContainText('Attendance Management');
  });

  test('should display attendance summary cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/attendance`);
    await page.waitForLoadState('networkidle');
    
    // Verify summary cards
    await expect(page.locator('text=Total Staff')).toBeVisible();
    await expect(page.locator('text=Present')).toBeVisible();
    await expect(page.locator('text=Absent')).toBeVisible();
    await expect(page.locator('text=On Leave')).toBeVisible();
  });

  test('should filter attendance by date', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/attendance`);
    await page.waitForLoadState('networkidle');
    
    // Select yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', dateString);
    await page.waitForTimeout(1000);
    
    // Verify table updates
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should filter attendance by status', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/attendance`);
    await page.waitForLoadState('networkidle');
    
    // Filter by present
    await page.selectOption('select', 'present');
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const statusBadges = page.locator('.status-badge');
    if (await statusBadges.count() > 0) {
      for (let i = 0; i < await statusBadges.count(); i++) {
        await expect(statusBadges.nth(i)).toContainText('present');
      }
    }
  });

  test('should search attendance by staff name', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/attendance`);
    await page.waitForLoadState('networkidle');
    
    // Search for staff
    await page.fill('input[placeholder*="Search"]', 'test');
    await page.waitForTimeout(500);
    
    // Verify search results
    const table = page.locator('table tbody');
    await expect(table).toBeVisible();
  });

  test('should display attendance details', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/attendance`);
    await page.waitForLoadState('networkidle');
    
    // Verify table columns
    await expect(page.locator('th:has-text("Staff")')).toBeVisible();
    await expect(page.locator('th:has-text("Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Check In")')).toBeVisible();
    await expect(page.locator('th:has-text("Check Out")')).toBeVisible();
    await expect(page.locator('th:has-text("Hours")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });
});

test.describe('Latex Billing - READ and UPDATE Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAccountant(page);
  });

  test('should navigate to latex verify page', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/latex-verify`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h2')).toContainText('Verify Latex Billing');
  });

  test('should display company rate', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/latex-verify`);
    await page.waitForLoadState('networkidle');
    
    // Verify company rate is displayed
    await expect(page.locator('text=Company Rate:')).toBeVisible();
    await expect(page.locator('.rate-badge, text=/₹\\d+\\/kg/')).toBeVisible();
  });

  test('should update company rate', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/latex-verify`);
    await page.waitForLoadState('networkidle');
    
    // Click update rate button
    await page.click('button:has-text("Update Rate")');
    
    // Enter new rate
    const rateInput = page.locator('input.rate-input, input[type="number"]');
    await rateInput.fill('185');
    
    // Save rate
    await page.click('button:has-text("Save")');
    
    // Confirm update
    await page.click('button:has-text("Update"), button:has-text("Confirm")');
    
    // Verify success
    await expect(page.locator('text=Company rate updated successfully')).toBeVisible({ timeout: 5000 });
  });

  test('should filter latex requests by status', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/latex-verify`);
    await page.waitForLoadState('networkidle');
    
    // Filter by TEST_COMPLETED
    await page.selectOption('select#status-filter, select', 'TEST_COMPLETED');
    await page.waitForTimeout(1000);
    
    // Verify filtered results
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should calculate latex billing amount', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/latex-verify`);
    await page.waitForLoadState('networkidle');
    
    // Find TEST_COMPLETED request
    const calculateBtn = page.locator('button:has-text("Calculate")').first();
    
    if (await calculateBtn.count() > 0) {
      await calculateBtn.click();
      
      // Confirm calculation
      await page.click('button:has-text("Confirm"), button:has-text("Yes")');
      
      // Verify success
      await expect(page.locator('text=calculated successfully, text=success')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should approve latex billing', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/latex-verify`);
    await page.waitForLoadState('networkidle');
    
    // Find pending request
    const approveBtn = page.locator('button:has-text("Approve")').first();
    
    if (await approveBtn.count() > 0) {
      await approveBtn.click();
      
      // Confirm approval
      await page.click('button:has-text("Confirm"), button:has-text("Yes")');
      
      // Wait for success
      await page.waitForTimeout(2000);
    }
  });

  test('should view history mode', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/latex-verify`);
    await page.waitForLoadState('networkidle');
    
    // Switch to history mode
    await page.click('button:has-text("History")');
    await page.waitForTimeout(1000);
    
    // Verify date range inputs are visible
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
    
    // Verify status summary is visible
    await expect(page.locator('.stats-section, text=Status Summary')).toBeVisible();
  });

  test('should search latex requests', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/latex-verify`);
    await page.waitForLoadState('networkidle');
    
    // Search by customer name
    await page.fill('input[placeholder*="Search"]', 'test');
    await page.waitForTimeout(500);
    
    // Verify table updates
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });
});

test.describe('Company Rate Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAccountant(page);
    await page.goto(`${BASE_URL}/accountant/latex-verify`);
  });

  test('should refresh company rate', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Click refresh button
    await page.click('button:has-text("Refresh Rate")');
    await page.waitForTimeout(1000);
    
    // Verify rate is still displayed
    await expect(page.locator('.rate-badge')).toBeVisible();
  });

  test('should validate rate input', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Click update rate
    await page.click('button:has-text("Update Rate")');
    
    // Try to enter invalid rate
    const rateInput = page.locator('input.rate-input');
    await rateInput.fill('-10');
    
    // Try to save
    await page.click('button:has-text("Save")');
    
    // Should show validation error or prevent submission
    // (Implementation depends on validation logic)
  });

  test('should cancel rate update', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Click update rate
    await page.click('button:has-text("Update Rate")');
    
    // Enter new rate
    await page.fill('input.rate-input', '200');
    
    // Cancel
    await page.click('button:has-text("Cancel")');
    
    // Verify input is hidden
    await expect(page.locator('input.rate-input')).not.toBeVisible();
  });
});

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAccountant(page);
  });

  test('should navigate to all dashboard sections', async ({ page }) => {
    // Test Auto Wages
    await page.click('text=Auto Wages');
    await page.waitForURL('**/accountant/wages');
    await page.goBack();
    
    // Test Set Live Rate
    await page.click('text=Set Live Rate');
    await page.waitForURL('**/accountant/rates');
    await page.goBack();
    
    // Test Delivery Intake
    await page.click('text=Delivery Intake');
    await page.waitForURL('**/accountant/delivery-intake');
    await page.goBack();
    
    // Test Attendance
    await page.click('text=Attendance');
    await page.waitForURL('**/accountant/attendance');
    await page.goBack();
    
    // Test Salaries
    await page.click('text=Salaries');
    await page.waitForURL('**/accountant/salaries');
  });
});

test.describe('Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAccountant(page);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    
    await page.goto(`${BASE_URL}/accountant/salaries`);
    
    // Should show error or loading state
    await page.waitForTimeout(2000);
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('should prevent duplicate salary calculation', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/salaries`);
    await page.waitForLoadState('networkidle');
    
    // Try to click disabled calculator button
    const disabledBtn = page.locator('button.calculator-btn.disabled').first();
    
    if (await disabledBtn.count() > 0) {
      await disabledBtn.click();
      
      // Should show info message
      await expect(page.locator('text=Salary already calculated')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should validate required fields in salary calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/accountant/salaries`);
    await page.waitForLoadState('networkidle');
    
    const calculatorBtn = page.locator('button.calculator-btn:not(.disabled)').first();
    
    if (await calculatorBtn.count() > 0) {
      await calculatorBtn.click();
      
      // Try to submit without filling required fields
      await page.click('button:has-text("Calculate")');
      
      // Should show validation errors or prevent submission
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Logout', () => {
  test('should logout successfully', async ({ page }) => {
    await loginAsAccountant(page);
    
    // Click logout button
    await page.click('button:has-text("Logout"), .logout-btn, text=Logout');
    
    // Should redirect to login page
    await page.waitForURL('**/login', { timeout: 5000 });
    await expect(page).toHaveURL(/.*login/);
  });
});
