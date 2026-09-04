Feature: ParaBank Accessibility on Critical Journeys

  Background:
    Given the customer is on the ParaBank home page
    And the customer registers a new user using registration test data

  @accessibility @w18
  Scenario: Login page exposes visible controls and keyboard targets
    Given the customer logs out after registration
    And the customer is on the ParaBank login page
    Then the login form should expose visible controls and keyboard targets

  @accessibility @w18
  Scenario: Accounts Overview page exposes visible controls and keyboard targets
    Given the customer navigates to the Accounts Overview page
    Then the dashboard should expose visible navigation and keyboard targets

