import { test, expect } from '@playwright/test';

/**
 * Tablero end-to-end smoke test.
 * Drives the real UI against the live gateway: storefront, live menu, and the
 * full role-based login → dashboard routing for every persona, plus the auth
 * guards (invalid credentials, protected-route redirect).
 *
 * Demo credentials (see seed.ps1):
 *   customer  alice.johnson@example.com / Customer1!  → /dashboard
 *   director  director@tablero.com      / Director1!  → /admin
 *   waiter    sofia.esposito@tablero.com / Staff123!  → /waiter
 *   chef      alex.ferrari@tablero.com   / Staff123!  → /kds
 *   cashier   giulia.romano@tablero.com  / Staff123!  → /pos
 */

const ROLES = [
  { name: 'customer', id: 'alice.johnson@example.com', pw: 'Customer1!', home: /\/dashboard/ },
  { name: 'director', id: 'director@tablero.com',      pw: 'Director1!', home: /\/admin/ },
  { name: 'waiter',   id: 'sofia.esposito@tablero.com', pw: 'Staff123!', home: /\/waiter/ },
  { name: 'chef',     id: 'alex.ferrari@tablero.com',   pw: 'Staff123!', home: /\/kds/ },
  { name: 'cashier',  id: 'giulia.romano@tablero.com',  pw: 'Staff123!', home: /\/pos/ },
];

async function login(page, identifier, password) {
  await page.goto('/login');
  await page.getByPlaceholder('sofia@tablero.com or sofia_marin').fill(identifier);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
}

test.describe('Public storefront', () => {
  test('home page loads', async ({ page }) => {
    const resp = await page.goto('/');
    expect(resp.ok()).toBeTruthy();
    // Guest landing always links to the menu or the login page.
    await expect(page.locator('a[href*="/menu"], a[href*="/login"]').first()).toBeVisible();
  });

  test('menu page renders live data from the API', async ({ page }) => {
    await page.goto('/menu');
    await expect(page.getByTestId('menu-search')).toBeVisible();
    // Category chips are derived from the menu the API returned — their presence
    // proves the gateway → restaurant-service round-trip worked.
    await expect(page.locator('[data-testid^="menu-cat-"]').first()).toBeVisible();
  });
});

test.describe('Auth guards', () => {
  test('invalid credentials keep the user on /login', async ({ page }) => {
    await login(page, 'director@tablero.com', 'definitely-wrong');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();
  });

  test('consumer-protected route redirects an unauthenticated guest to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('back-of-house route is denied to a guest (bounced to storefront)', async ({ page }) => {
    await page.goto('/admin');
    // Ops routes bounce non-staff to the storefront home with a denied flag,
    // not to /login — the guest must never reach the admin dashboard.
    await expect(page).toHaveURL(/\/(\?denied=staff)?$/);
    await expect(page).not.toHaveURL(/\/admin/);
  });
});

test.describe('Role-based login routing', () => {
  for (const role of ROLES) {
    test(`${role.name} logs in and lands on their home`, async ({ page }) => {
      await login(page, role.id, role.pw);
      await expect(page).toHaveURL(role.home);
    });
  }

  test('director sees the staff management control on the admin dashboard', async ({ page }) => {
    await login(page, 'director@tablero.com', 'Director1!');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByTestId('manage-staff')).toBeVisible();
  });
});
