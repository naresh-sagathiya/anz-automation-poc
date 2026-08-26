Feature: Parabank mobile interactions
  In order to verify mobile-specific behavior on a narrow, touch-enabled screen
  As a user of the Parabank mobile site
  I want to transfer funds and add a payee using an iPad-sized viewport

  Background:
    Given I open the parabank mobile site
    And I login with valid mobile credentials

  @mobile @transfer
  Scenario: Fund transfer on mobile
    When I navigate to the Transfer Funds page
    And I submit a transfer of "100.00" from "12345" to "54321"
    Then the transfer completes and confirmation is visible without scrolling
    And the amount field accepts numeric input on mobile

  @mobile @payee
  Scenario: Payee add on mobile
    When I navigate to the Add Payee page
    And I add a payee with name "My Payee" and phone "1234567890" and account "987654"
    Then the payee form accepts input correctly

  @mobile @validation
  Scenario: Inline validation on mobile payee form
    When I navigate to the Add Payee page
    Then inline validation is visible on a narrow screen
