import { loginAsTestUser } from '../support/commands';

describe('Project Management Flow', () => {
  let projectName: string;

  beforeEach(() => {
    loginAsTestUser(); // Custom command to login
    projectName = `Cypress Test Project ${Date.now()}`;
  });

  it('allows a user to create, view, and delete a project', () => {
    // Create Project
    cy.visit('/projects/new');
    cy.get('h1').contains('Create New Project').should('be.visible');
    cy.get('#projectName').type(projectName);
    cy.get('button[type="submit"]').click();

    cy.contains('Project created successfully!').should('be.visible');
    cy.url().should('include', '/projects');
    cy.contains(projectName).should('be.visible');

    // View Project Details
    cy.contains(projectName).parent().parent().find('button').contains('View Details').click();
    cy.url().should('include', '/projects/');
    cy.get('h1').contains(projectName).should('be.visible');
    cy.contains('API Key:').should('be.visible');

    // Verify some default metrics are displayed
    cy.contains('LCP Avg').should('be.visible');
    cy.contains('Total Errors').should('be.visible');

    // Navigate back to projects list
    cy.get('button').find('svg[aria-hidden="true"]').first().click(); // Back arrow icon
    cy.url().should('include', '/projects');

    // Delete Project
    cy.contains(projectName).parent().parent().find('button').contains('Delete').click();
    cy.on('window:confirm', (text) => {
      expect(text).to.include(`Are you sure you want to delete project "${projectName}"?`);
      return true; // Confirm the deletion
    });
    cy.contains('Project deleted successfully!').should('be.visible');
    cy.contains(projectName).should('not.exist');
  });

  it('shows empty state if no projects exist', () => {
    cy.visit('/projects');
    cy.contains('You don\'t have any projects yet.').should('be.visible');
    cy.contains('Create Your First Project').should('be.visible');
  });

  it('copies API key to clipboard', () => {
    // Create a project first
    cy.visit('/projects/new');
    cy.get('#projectName').type(projectName);
    cy.get('button[type="submit"]').click();
    cy.contains('Project created successfully!').should('be.visible');

    // Go to project detail
    cy.contains(projectName).parent().parent().find('button').contains('View Details').click();

    // Click copy API key button
    cy.get('button[title="Copy API Key"]').click();
    cy.contains('API Key copied to clipboard!').should('be.visible');

    // Attempt to paste and verify (this is tricky in Cypress, usually involves stubbing clipboard)
    // For now, we'll rely on the toast message for success verification.
    // A more robust test would involve stubbing `navigator.clipboard.writeText` and asserting its call.
  });
});