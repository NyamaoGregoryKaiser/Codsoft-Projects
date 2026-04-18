```typescript
/// <reference types="cypress" />

describe('Authentication Flow', () => {
  const BASE_URL = Cypress.env('API_BASE_URL') || 'http://localhost:80/api';
  const FRONTEND_URL = Cypress.env('FRONTEND_URL') || 'http://localhost:80';

  beforeEach(() => {
    cy.visit(FRONTEND_URL);
  });

  it('should display the login page initially', () => {
    cy.contains('Login to PerfoMetrics').should('be.visible');
    cy.get('input[name="username"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Login');
  });

  it('should successfully log in an admin user and redirect to dashboard', () => {
    cy.intercept('POST', `${BASE_URL}/auth/login`).as('loginRequest');

    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123'); // Use the default seed password
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);

    cy.url().should('include', '/dashboard');
    cy.contains('PerfoMetrics Dashboard').should('be.visible');
    cy.contains('Welcome, admin').should('be.visible'); // Check for greeting
  });

  it('should show an error message for invalid credentials', () => {
    cy.intercept('POST', `${BASE_URL}/auth/login`).as('loginRequest');

    cy.get('input[name="username"]').type('invaliduser');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest').its('response.statusCode').should('eq', 401);

    cy.url().should('include', '/login');
    cy.contains('Invalid username or password.').should('be.visible');
  });

  it('should allow logout and redirect to login page', () => {
    // First, log in an admin user
    cy.intercept('POST', `${BASE_URL}/auth/login`).as('loginRequest');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');
    cy.url().should('include', '/dashboard');

    // Then, log out
    cy.get('button').contains('Logout').click();
    cy.url().should('include', '/login');
    cy.contains('Login to PerfoMetrics').should('be.visible');
  });

  it('should redirect unauthenticated users from protected routes to login', () => {
    cy.visit(`${FRONTEND_URL}/dashboard`);
    cy.url().should('include', '/login');
    cy.contains('Login to PerfoMetrics').should('be.visible');

    cy.visit(`${FRONTEND_URL}/services`);
    cy.url().should('include', '/login');
  });
});
```