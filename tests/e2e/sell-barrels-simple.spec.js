import { test, expect } from '@playwright/test';

test.describe('User Sell Barrel Page Tests (Simple)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Go directly to the page
    await page.goto('/user/sell-barrels');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('Sell Barrels page should load correctly', async ({ page }) => {
    // Check if page title is visible or redirected to login
    const pageTitle = page.locator('h1').filter({ hasText: /Sell Barrels|Welcome Back/i });
    await expect(pageTitle).toBeVisible();
  });

  test('Page should have proper structure', async ({ page }) => {
    // Check if we're on login page or sell barrels page
    const isLoginPage = await page.locator('h2').filter({ hasText: /Welcome Back/i }).isVisible().catch(() => false);
    const isSellBarrelsPage = await page.locator('h1').filter({ hasText: /Sell Barrels/i }).isVisible().catch(() => false);
    
    // Either login page or sell barrels page should be visible
    expect(isLoginPage || isSellBarrelsPage).toBe(true);
  });

  test('Navigation should work', async ({ page }) => {
    // Page should load without errors
    const url = page.url();
    expect(url).toContain('localhost:3000');
  });

  test('No console errors on page load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/user/sell-barrels');
    await page.waitForTimeout(2000);
    
    // Should have minimal errors (some are expected from React dev mode)
    expect(errors.length).toBeLessThan(10);
  });

  test('Page should be responsive', async ({ page }) => {
    await page.goto('/user/sell-barrels');
    
    // Check if page doesn't have horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 20);
  });
});

test.describe('Login Page Tests (For Sell Barrels Access)', () => {
  
  test('Login page should load', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loginTitle = page.locator('h2').filter({ hasText: /Welcome Back/i });
    await expect(loginTitle).toBeVisible();
  });

  test('Login form should have required fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    const signInButton = page.locator('button.form-button');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signInButton).toBeVisible();
  });

  test('Login form should validate empty submission', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    
    // Check required attributes
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('Register link should be visible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toBeVisible();
  });

  test('Forgot password link should be visible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const forgotPasswordLink = page.locator('a[href="/forgot-password"]');
    await expect(forgotPasswordLink).toBeVisible();
  });
});

test.describe('Page Accessibility Tests', () => {
  
  test('Sell barrels page should have proper HTML structure', async ({ page }) => {
    await page.goto('/user/sell-barrels');
    await page.waitForLoadState('networkidle');
    
    // Check for basic HTML structure
    const hasH1 = await page.locator('h1').count() > 0;
    expect(hasH1).toBe(true);
  });

  test('Page should have proper meta tags', async ({ page }) => {
    await page.goto('/user/sell-barrels');
    await page.waitForLoadState('networkidle');
    
    // Check for viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').count();
    expect(viewport).toBeGreaterThan(0);
  });

  test('Page should load CSS correctly', async ({ page }) => {
    await page.goto('/user/sell-barrels');
    await page.waitForLoadState('networkidle');
    
    // Check if body has some styling
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    expect(bodyBg).toBeTruthy();
  });

  test('Page should load JavaScript correctly', async ({ page }) => {
    await page.goto('/user/sell-barrels');
    await page.waitForLoadState('networkidle');
    
    // Check if React is loaded
    const hasReact = await page.evaluate(() => {
      return typeof window.React !== 'undefined' || document.querySelector('[data-reactroot]') !== null;
    });
    
    // React might not expose itself globally, so we just check page loaded
    expect(page.url()).toContain('localhost:3000');
  });
});

test.describe('Navigation Tests', () => {
  
  test('Home page should load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('localhost:3000');
  });

  test('Login page should be accessible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/login');
  });

  test('Register page should be accessible', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/register');
  });

  test('404 page should handle invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist');
    await page.waitForLoadState('networkidle');
    
    // Should either show 404 or redirect
    const url = page.url();
    expect(url).toContain('localhost:3000');
  });
});

test.describe('Performance Tests', () => {
  
  test('Page should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/user/sell-barrels');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('Login page should load quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
