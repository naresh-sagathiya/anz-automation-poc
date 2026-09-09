Feature: ParaBank account number display on Accounts Overview

  @account-number-visibility
  Scenario: Account number is displayed without a mask or reveal control
    Given the customer is on the ParaBank home page
    When the customer registers a new user using registration test data
    And the customer navigates to Accounts Overview
    Then the first account number is visible on the overview page
    And the first account number is not masked
    And no account number masking or reveal control is available
    And a screenshot of the account overview is captured as evidence
