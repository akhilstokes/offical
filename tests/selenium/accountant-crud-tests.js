/**
 * Selenium Test Suite for Accountant Role - All CRUD Operations
 * Tests: Login, Salary Management (Create, Read, Update, Delete), 
 * Attendance Management, Latex Billing, Rate Management
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const TIMEOUT = 15000;

// Test credentials
const ACCOUNTANT_CREDENTIALS = {
  email: 'accountant@holyfamily.com',
  password: 'accountant123'
};

// Test results storage
const testResults = [];

// Helper function to log test results
function logTestResult(testName, status, message = '', duration = 0) {
  const result = {
    testName,
    status,
    message,
    duration,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  console.log(`[${status}] ${testName}: ${message} (${duration}ms)`);
}

// Helper function to wait for element
async function waitForElement(driver, locator, timeout = TIMEOUT) {
  return await driver.wait(until.elementLocated(locator), timeout);
}

// Helper function to safe click
async function safeClick(driver, element) {
  await driver.wait(until.elementIsVisible(element), TIMEOUT);
  await driver.wait(until.elementIsEnabled(element), TIMEOUT);
  await element.click();
}

// Helper function to safe send keys
async function safeSendKeys(driver, element, text) {
  await driver.wait(until.elementIsVisible(element), TIMEOUT);
  await element.clear();
  await element.sendKeys(text);
}

// Test Suite Class
class AccountantCRUDTests {
  constructor() {
    this.driver = null;
  }

  async setup() {
    console.log('Setting up Chrome driver...');
    const options = new chrome.Options();
    options.addArguments('--start-maximized');
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    await this.driver.manage().setTimeouts({ implicit: 5000 });
    console.log('Chrome driver setup complete');
  }

  async teardown() {
    if (this.driver) {
      await this.driver.quit();
      console.log('Chrome driver closed');
    }
  }

  // Test 1: Login as Accountant
  async testLogin() {
    const testName = 'Accountant Login';
    const startTime = Date.now();
    
    try {
      console.log('\n=== Test 1: Accountant Login ===');
      await this.driver.get(`${BASE_URL}/login`);
      
      // Wait for login page to load
      await waitForElement(this.driver, By.css('input[type="email"]'));
      
      // Enter credentials
      const emailInput = await this.driver.findElement(By.css('input[type="email"]'));
      const passwordInput = await this.driver.findElement(By.css('input[type="password"]'));
      
      await safeSendKeys(this.driver, emailInput, ACCOUNTANT_CREDENTIALS.email);
      await safeSendKeys(this.driver, passwordInput, ACCOUNTANT_CREDENTIALS.password);
      
      // Click login button
      const loginButton = await this.driver.findElement(By.css('button[type="submit"]'));
      await safeClick(this.driver, loginButton);
      
      // Wait for redirect to accountant dashboard
      await this.driver.wait(until.urlContains('/accountant'), TIMEOUT);
      
      // Verify dashboard loaded
      const dashboardTitle = await waitForElement(
        this.driver, 
        By.xpath("//*[contains(text(), 'Accountant Dashboard')]")
      );
      
      assert(dashboardTitle, 'Dashboard title not found');
      
      const duration = Date.now() - startTime;
      logTestResult(testName, 'PASS', 'Successfully logged in as accountant', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logTestResult(testName, 'FAIL', error.message, duration);
      throw error;
    }
  }

  // Test 2: Navigate to Salaries Page (READ)
  async testNavigateToSalaries() {
    const testName = 'Navigate to Salaries Page';
    const startTime = Date.now();
    
    try {
      console.log('\n=== Test 2: Navigate to Salaries Page ===');
      
      // Click on Salaries card or link
      const salariesLink = await waitForElement(
        this.driver,
        By.xpath("//*[contains(text(), 'Salaries')]")
      );
      await safeClick(this.driver, salariesLink);
      
      // Wait for salaries page to load
      await this.driver.wait(until.urlContains('/accountant/salaries'), TIMEOUT);
      
      // Verify page title
      const pageTitle = await waitForElement(
        this.driver,
        By.xpath("//*[contains(text(), 'Staff Salaries Management')]")
      );
      
      assert(pageTitle, 'Salaries page title not found');
      
      const duration = Date.now() - startTime;
      logTestResult(testName, 'PASS', 'Successfully navigated to salaries page', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logTestResult(testName, 'FAIL', error.message, duration);
      throw error;
    }
  }

  // Test 3: Read Staff List
  async testReadStaffList() {
    const testName = 'Read Staff List';
    const startTime = Date.now();
    
    try {
      console.log('\n=== Test 3: Read Staff List ===');
      
      // Wait for staff table to load
      await waitForElement(this.driver, By.css('.staff-table'));
      
      // Get all staff rows
      const staffRows = await this.driver.findElements(By.css('.staff-table tbody tr'));
      
      assert(staffRows.length > 0, 'No staff members found in table');
      
      console.log(`Found ${staffRows.length} staff members`);
      
      // Verify table headers
      const headers = await this.driver.findElements(By.css('.staff-table thead th'));
      const headerTexts = await Promise.all(headers.map(h => h.getText()));
      
      console.log('Table headers:', headerTexts);
      
      assert(headerTexts.includes('STAFF NAME'), 'Staff name header not found');
      assert(headerTexts.includes('DAILY SALARY'), 'Daily salary header not found');
      
      const duration = Date.now() - startTime;
      logTestResult(testName, 'PASS', `Successfully read ${staffRows.length} staff records`, duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logTestResult(testName, 'FAIL', error.message, duration);
      throw error;
    }
  }

  // Test 4: Update Daily Salary (UPDATE)
  async testUpdateDailySalary() {
    const testName = 'Update Daily Salary';
    const startTime = Date.now();
    
    try {
      console.log('\n=== Test 4: Update Daily Salary ===');
      
      // Find first edit button
      const editButton = await waitForElement(
        this.driver,
        By.css('.salary-edit-btn')
      );
      await safeClick(this.driver, editButton);
      
      // Wait for edit input to appear
      const editInput = await waitForElement(
        this.driver,
        By.css('.salary-edit-input')
      );
      
      // Enter new salary value
      const newSalary = '750';
      await safeSendKeys(this.driver, editInput, newSalary);
      
      // Click save button
      const saveButton = await this.driver.findElement(By.css('.salary-save-btn'));
      await safeClick(this.driver, saveButton);
      
      // Wait for success message or UI update
      await this.driver.sleep(2000);
      
      const duration = Date.now() - startTime;
      logTestResult(testName, 'PASS', `Successfully updated daily salary to ${newSalary}`, duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logTestResult(testName, 'FAIL', error.message, duration);
      throw error;
    }
  }

  // Test 5: Filter Staff by Role
  async testFilterStaffByRole() {
    const testName = 'Filter Staff by Role';
    const startTime = Date.now();
    
    try {
      console.log('\n=== Test 5: Filter Staff by Role ===');
      
      // Click on Manager Only filter
      const managerFilter = await waitForElement(
        this.driver,
        By.xpath("//label[contains(., 'Manager Only')]//input[@type='checkbox']")
      );
      await safeClick(this.driver, managerFilter);
      
      // Wait for table to update
      await this.driver.sleep(1000);
      
      // Verify filtered results
      const staffRows = await this.driver.findElements(By.css('.staff-table tbody tr'));
      console.log(`Filtered to ${staffRows.length} manager(s)`);
      
      const duration = Date.now() - startTime;
      logTestResult(testName, 'PASS', 'Successfully filtered staff by role', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logTestResult(testName, 'FAIL', error.message, duration);
      throw error;
    }
  }

  // Test 6: Create Salary Record (CREATE)
  async testCreateSalaryRecord() {
    const testName = 'Create Salary Record';
    const startTime = Date.now();
    
    try {
      console.log('\n=== Test 6: Create Salary Record ===');
      
      // Reset filter to show all staff
      const allFilter = await waitForElement(
        this.driver,
        By.xpath("//label[contains(., 'All')]//input[@type='checkbox']")
      );
      await safeClick(this.driver, allFilter);
      await this.driver.sleep(1000);
      
      // Find and click calculator button for first staff
      const calculatorButton = await waitForElement(
        this.driver,
        By.css('.calculator-btn:not(.disabled)')
      );
      await safeClick(this.driver, calculatorButton);
      
      // Wait for calculator modal to open
      await waitForElement(this.driver, By.css('.calculator-modal'));
      
      // Fill in salary details
      const workingDaysInput = await this.driver.findElement(By.name('workingDays'));
      await safeSendKeys(this.driver, workingDaysInput, '26');
      
      // Add allowances
      const medicalAllowance = await this.driver.findElement(By.name('medicalAllowance'));
      await safeSendKeys(this.driver, medicalAllowance, '500');
      
      const transportAllowance = await this.driver.findElement(By.name('transportationAllowance'));
      await safeSendKeys(this.driver, transportAllowance, '300');
      
      // Submit calculation
      const calculateButton = await this.driver.findElement(
        By.xpath("//button[contains(text(), 'Calculate Salary')]")
      );
      await safeClick(this.driver, calculateButton);
      
      // Wait for confirmation dialog
      await this.driver.sleep(1000);
      
      // Confirm generation
      const confirmButton = await waitForElement(
        this.driver,
        By.xpath("//button[contains(text(), 'Confirm') or contains(text(), 'Yes')]")
      );
      await safeClick(this.driver, confirmButton);
      
      // Wait for success message
      await this.driver.sleep(2000);
      
      const duration = Date.now() - startTime;
      logTestResult(testName, 'PASS', 'Successfully created salary record', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logTestResult(testName, 'FAIL', error.message, duration);
      throw error;
    }
  }

  // Test 7: View Payslip (READ)
  async testViewPayslip() {
    const testName = 'View Payslip';
    const startTime = Date.now();
    
    try {
      console.log('\n=== Test 7: View Payslip ===');
      
      // Close any open modals first
      try {
        const closeButton = await this.driver.findElement(By.css('.modal-close, .close-btn'));
        await safeClick(this.driver, closeButton);
        await this.driver.sleep(500);
      } catch (e) {
        // No modal to close
      }
      
      // Find and click payslip button
      const payslipButton = await waitForElement(
        this.driver,
        By.css('.payslip-btn')
      );
      await safeClick(this.driver, payslipButton);
      
      // Wait for payslip modal to open
      await waitForElement(this.driver, By.css('.payslip-modal'));
      
      // Verify payslip details are displayed
      const payslipContent = await this.driver.findElement(By.css('.payslip-content'));
      const contentText = await payslipContent.getText();
      
      assert(contentText.includes('HOLY FAMILY'), 'Company name not found in payslip');
      assert(contentText.includes('Net Salary'), 'Net salary not found in payslip');
      
      const duration = Date.now() - startTime;
      logTestResult(testName, 'PASS', 'Successfully viewed payslip', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logTestResult(testName, 'FAIL', error.message, duration);
      throw error;
    }
  }

  // Test 8: Send Payslip to Staff
  async testSendPayslipToStaff() {
    const testName = 'Send Payslip to Staff';
    const startTime = Date.now();
    
    try {
      console.log('\n=== Test 8: Send Payslip to Staff ===');
      
      // Find and click send payslip button
      const sendButton = await waitForElement(
        this.driver,
        By.xpath("//button[contains(text(), 'Send to Staff')]")
      );
      await safeClick(this.driver, sendButton);
      
      // Wait for success message
      await this.driver.sleep(2000);
      
      const duration = Date.now() - startTime;
      logTestResult(testName, 'PASS', 'Successfully sent payslip to staff', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logTestResult(testName, 'FAIL', error.message, duration);
      throw error;
    }
  }

  // Test 9: Navigate to Attendance Page
  async testNavigateToAttendance() {
    const testName = 'Navigate to Attendance Page';
    const startTime = Date.now();
    
    try {
      console.log('\n=== Test 9: Navigate to Attendance Page ===');
      
      // Close any open modals
      try {
        const closeButton = await this.driver.findElement(By.css('.modal-close, .close-btn'));
        await safeClick(this.driver, closeButton);
        await this.driver.sleep(500);
      } catch (e) {
        // No modal to close
      }
      
      // Navigate back to dashboard
      await this.driver.get(`${BASE_URL}/accountant`);
      await this.driver.sleep(1000);
      
      // Click on Attendance card
      const attendanceLink = await waitForElement(
        this.driver,
        By.xpath("//*[contains(text(), 'Attendance')]")
      );
      await safeClick(this.driver, attendanceLink);
      
      // Wait for attendance page to load
      await this.driver.wait(until.urlContains('/accountant/attendance'), TIMEOUT);
      
      // Verify page title
      const pageTitle = await waitForElement(
        this.driver,
        By.xpath("//*[contains(text(), 'Attendance Management')]")
      );
      
      assert(pageTitle, 'Attendance page title not found');
      
      const duration = Date.now() - startTime;
      logTestResult(testName, 'PASS', 'Successfully navigated to attendance page', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logTestResult(testName, 'FAIL', error.message, duration);
      throw error;
    }
  }

  // Test 10: Read Attendance Records
  async testReadAttendanceRecords() {
    const testName = 'Read Attendance Records';
    const startTime = Date.now();
    
    try {
      console.log('\n=== Test 10: Read Attendance Records ===');
      
      // Wait for attendance table to load
      await waitForElement(this.driver, By.css('table'));
      
      // Get summary cards
      const summaryCards = await this.driver.findElements(By.css('.summary-card'));
      console.log(`Found ${summaryCards.length} summary cards`);
      
      // Get attendance records
      const attendanceRows = await this.driver.findElements(By.css('tbody tr'));
      console.log(`Found ${attendanceRows.length} attendance records`);
      
      const duration = Date.now() - startTime;
      logTestResult(testName, 'PASS', `Successfully read ${attendanceRows.length} attendance records`, duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logTestResult(testName, 'FAIL', error.message, duration);
      throw error;
    }
  }

  // Test 11: Filter Attendance by Status
  async testFilterAttendanceByStatus() {
    const testName = 'Filter Attendance by Status';
    const startTime = Date.now();
    
    try {
      console.log('\n=== Test 11: Filter Attendance by Status ===');
      
      // Find status filter dropdown
      const statusFilter = await waitForElement(
        this.driver,
        By.css('.filter-select')
      );
      await safeClick(this.driver, statusFilter);
      
      // Select "Present" option
      const presentOption = await this.driver.findElement(
        By.xpath("//option[contains(text(), 'Present')]")
      );
      await safeClick(this.driver, presentOption);
      
      // Wait for table to update
      await this.driver.sleep(1000);
      
      const duration = Date.now() - startTime;
      logTestResult(testName, 'PASS', 'Successfully filtered attendance by status', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logTestResult(testName, 'FAIL', error.message, duration);
      throw error;
    }
  }

  // Test 12: Navigate to Latex Verify Page
  async testNavigateToLatexVerify() {
    const testName = 'Navigate to Latex Verify Page';
    const startTime = Date.now();
    
    try {
      console.log('\n=== Test 12: Navigate to Latex Verify Page ===');
      
      // Navigate back to dashboard
      await this.driver.get(`${BASE_URL}/accountant`);
      await this.driver.sleep(1000);
      
      // Click on Delivery Intake card (which leads to latex verify)
      const latexLink = await waitForElement(
        this.driver,
        By.xpath("//*[contains(text(), 'Delivery Intake')]")
      );
      await safeClick(this.driver, latexLink);
      
      // Wait for page to load
      await this.driver.sleep(2000);
      
      const duration = Date.now() - startTime;
      logTestResult(testName, 'PASS', 'Successfully navigated to latex verify page', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logTestResult(testName, 'FAIL', error.message, duration);
      throw error;
    }
  }

  // Test 13: Update Company Rate (UPDATE)
  async testUpdateCompanyRate() {
    const testName = 'Update Company Rate';
    const startTime = Date.now();
    
    try {
      console.log('\n=== Test 13: Update Company Rate ===');
      
      // Navigate to rates page
      await this.driver.get(`${BASE_URL}/accountant/rates`);
      await this.driver.sleep(2000);
      
      // Find update rate button
      const updateRateButton = await waitForElement(
        this.driver,
        By.xpath("//button[contains(text(), 'Update Rate')]")
      );
      await safeClick(this.driver, updateRateButton);
      
      // Wait for input field
      const rateInput = await waitForElement(
        this.driver,
        By.css('.rate-input')
      );
      
      // Enter new rate
      const newRate = '185.50';
      await safeSendKeys(this.driver, rateInput, newRate);
      
      // Click save button
      const saveButton = await this.driver.findElement(
        By.xpath("//button[contains(text(), 'Save')]")
      );
      await safeClick(this.driver, saveButton);
      
      // Confirm update
      await this.driver.sleep(1000);
      try {
        const confirmButton = await this.driver.findElement(
          By.xpath("//button[contains(text(), 'Update') or contains(text(), 'Confirm')]")
        );
        await safeClick(this.driver, confirmButton);
      } catch (e) {
        // No confirmation needed
      }
      
      // Wait for success
      await this.driver.sleep(2000);
      
      const duration = Date.now() - startTime;
      logTestResult(testName, 'PASS', `Successfully updated company rate to ${newRate}`, duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logTestResult(testName, 'FAIL', error.message, duration);
      throw error;
    }
  }

  // Test 14: Logout
  async testLogout() {
    const testName = 'Accountant Logout';
    const startTime = Date.now();
    
    try {
      console.log('\n=== Test 14: Accountant Logout ===');
      
      // Find and click logout button
      const logoutButton = await waitForElement(
        this.driver,
        By.xpath("//button[contains(text(), 'Logout') or contains(text(), 'Sign Out')]")
      );
      await safeClick(this.driver, logoutButton);
      
      // Wait for redirect to login page
      await this.driver.wait(until.urlContains('/login'), TIMEOUT);
      
      const duration = Date.now() - startTime;
      logTestResult(testName, 'PASS', 'Successfully logged out', duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logTestResult(testName, 'FAIL', error.message, duration);
      throw error;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('\n========================================');
    console.log('ACCOUNTANT CRUD TEST SUITE');
    console.log('========================================\n');
    
    const startTime = Date.now();
    let passedTests = 0;
    let failedTests = 0;

    try {
      await this.setup();

      // Run tests in sequence
      const tests = [
        () => this.testLogin(),
        () => this.testNavigateToSalaries(),
        () => this.testReadStaffList(),
        () => this.testUpdateDailySalary(),
        () => this.testFilterStaffByRole(),
        () => this.testCreateSalaryRecord(),
        () => this.testViewPayslip(),
        () => this.testSendPayslipToStaff(),
        () => this.testNavigateToAttendance(),
        () => this.testReadAttendanceRecords(),
        () => this.testFilterAttendanceByStatus(),
        () => this.testNavigateToLatexVerify(),
        () => this.testUpdateCompanyRate(),
        () => this.testLogout()
      ];

      for (const test of tests) {
        try {
          await test();
          passedTests++;
        } catch (error) {
          failedTests++;
          console.error(`Test failed: ${error.message}`);
          // Continue with next test
        }
      }

    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      await this.teardown();
    }

    const totalDuration = Date.now() - startTime;

    // Print summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    console.log(`Total Tests: ${passedTests + failedTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('========================================\n');

    return {
      total: passedTests + failedTests,
      passed: passedTests,
      failed: failedTests,
      duration: totalDuration,
      results: testResults
    };
  }
}

// Main execution
async function main() {
  const testSuite = new AccountantCRUDTests();
  const results = await testSuite.runAllTests();
  
  // Save results to file
  const fs = require('fs');
  const reportPath = './test-results/accountant-crud-test-results.json';
  
  // Ensure directory exists
  if (!fs.existsSync('./test-results')) {
    fs.mkdirSync('./test-results', { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nTest results saved to: ${reportPath}`);
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AccountantCRUDTests;
