Feature: Servicing
  Scenario: User reviews account details
    Given the customer is on the servicing page
    When the customer opens the account summary
    Then the customer's account information should be displayed

