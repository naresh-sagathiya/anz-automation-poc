Feature: ParaBank Customer API

  @smoke @customer
  Scenario: Get customer details using valid customer ID
    Given the Customer API is available
    When I request customer details for customer ID 12212
    Then the response status should be 200
    And the customer response should contain customer details