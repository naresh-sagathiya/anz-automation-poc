@mobile @ID-M14 @touch-target-size
Feature: Banking mobile touch target size compliance
  In order to ensure accessible mobile banking interactions
  As a mobile user
  I want critical banking controls to meet minimum touch target size and spacing

  Scenario: Login controls meet touch target size and spacing
    Given I open the mobile banking touch target screen "login"
    When I measure all interactive touch targets on the screen
    Then each interactive element meets the minimum touch target size
    And interactive elements have adequate spacing

  Scenario: Account quick actions meet touch target size and spacing
    Given I open the mobile banking touch target screen "account-overview"
    When I measure all interactive touch targets on the screen
    Then each interactive element meets the minimum touch target size
    And interactive elements have adequate spacing

  Scenario: Payment actions meet touch target size and spacing
    Given I open the mobile banking touch target screen "payments"
    When I measure all interactive touch targets on the screen
    Then each interactive element meets the minimum touch target size
    And interactive elements have adequate spacing