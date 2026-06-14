```typescript
// frontend/cypress/e2e/auth.cy.ts (Example of E2E Test)
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login page correctly', () => {
    cy.contains('Welcome Back!').should('be.visible');
    cy.get('input[id="email"]').should('be.visible');
    cy.get('input[id="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Sign In');
  });

  it('should show an error for invalid credentials', () => {
    cy.get('input[id="email"]').type('nonexistent@example.com');
    cy.get('input[id="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.contains('Login failed').should('be.visible'); // Assuming toast notification
  });

  it('should successfully log in a user and redirect to dashboards', () => {
    // These credentials should be seeded in the test database
    cy.get('input[id="email"]').type('admin@example.com');
    cy.get('input[id="password"]').type('adminpassword');
    cy.get('button[type="submit"]').click();

    cy.contains('Logged in successfully!').should('be.visible');
    cy.url().should('include', '/dashboards');
    cy.get('nav').should('contain', 'DataViz Pro'); // Check if layout renders
    cy.contains('Welcome, adminuser!').should('be.visible');
  });

  it('should log out a user', () => {
    // First, log in
    cy.get('input[id="email"]').type('admin@example.com');
    cy.get('input[id="password"]').type('adminpassword');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboards');

    // Then, log out
    cy.contains('Logout').click();
    cy.contains('Logged out successfully').should('be.visible'); // Assuming toast notification
    cy.url().should('include', '/login');
    cy.contains('Welcome Back!').should('be.visible'); // Verify back on login page
  });
});
```