@api @customers
Feature: Banking customer API

  @A4 @smoke @customer
  Scenario: Get customer details using valid customer ID
    Given I login with username "alice" and password "Password123!"
    When I request customer details for customer ID "CUST-001"
    Then the response status should be 200
    And the customer response should contain customer details