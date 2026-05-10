describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  it('allows a user to register and then login', () => {
    const randomEmail = `testuser${Date.now()}@example.com`;
    const password = 'password123';
    const name = 'Test User';

    // Register
    cy.get('#name').type(name);
    cy.get('#email').type(randomEmail);
    cy.get('#password').type(password);
    cy.get('#passwordConfirm').type(password);
    cy.get('button[type="submit"]').click();

    // Check for success toast and redirect to login
    cy.contains('Registration successful! Please login.').should('be.visible');
    cy.url().should('include', '/login');

    // Login
    cy.get('#email').type(randomEmail);
    cy.get('#password').type(password);
    cy.get('button[type="submit"]').click();

    // Check for success toast and redirect to dashboard
    cy.contains('Logged in successfully!').should('be.visible');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.contains(`Welcome, ${name}!`).should('be.visible');

    // Logout
    cy.get('button').contains('Logout').click();
    cy.url().should('include', '/login');
  });

  it('shows error messages for invalid registration', () => {
    cy.get('button[type="submit"]').click(); // Submit empty form
    cy.contains('Name must be at least 3 characters long.').should('be.visible');
    cy.contains('Invalid email address.').should('be.visible');
    cy.contains('Password must be at least 8 characters long.').should('be.visible');

    cy.get('#password').type('short');
    cy.get('#passwordConfirm').type('different');
    cy.get('button[type="submit"]').click();
    cy.contains('Passwords do not match.').should('be.visible');
  });

  it('shows error messages for invalid login', () => {
    cy.visit('/login');
    cy.get('#email').type('nonexistent@example.com');
    cy.get('#password').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.contains('Incorrect email or password').should('be.visible');
  });
});