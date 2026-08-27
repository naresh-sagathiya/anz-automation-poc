@mobile @navigation
Feature: Parabank mobile navigation

  Background:
    Given I open the parabank mobile site
    And I login with valid mobile credentials

  Scenario: Navigation menu is visible on mobile
    Then the mobile navigation menu is visible

  Scenario: Transfer Funds link works on mobile
    When I select the mobile "Transfer Funds" link
    Then I am on the mobile Transfer Funds page

  Scenario: Bill Pay link works on mobile
    When I select the mobile "Bill Pay" link
    Then I am on the mobile Bill Pay page

  Scenario: Find Transactions link works on mobile
    When I select the mobile "Find Transactions" link
    Then I am on the mobile Find Transactions page

  Scenario: Request Loan link works on mobile
    When I select the mobile "Request Loan" link
    Then I am on the mobile Request Loan page

  Scenario: No horizontal scroll after mobile login
    Then the mobile page has no horizontal scroll