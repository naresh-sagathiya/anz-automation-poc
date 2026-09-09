Feature: ParaBank horizontal access control

  @horizontal-access
  Scenario: A user cannot access another user's account data
    Given the customer is on the ParaBank home page
    When the customer registers a new user using registration test data
    And the customer navigates to Accounts Overview
    And the customer records the first account for horizontal access testing
    And a second user is registered in a separate browser context
    When the second user attempts to access the first user account data
    Then the second user should not see the first user account data