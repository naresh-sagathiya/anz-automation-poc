@mobile @ID-M2 @mfa-login
Feature: Banking Scenario - Login and MFA on mobile
  In order to verify mobile login and OTP handling on narrow screens
  As a mobile banking user
  I want login and one-time-code entry to work with mobile viewport behavior and autofill semantics

  Scenario Outline: Mobile login form and OTP entry behave correctly on GitHub demo pages
    Given I use the mobile "<profile>" profile
    And I open the GitHub login page for mobile OTP testing
    When I complete the demo mobile login form
    And I add a one-time-code input with mobile autofill attributes
    Then the OTP field exposes the one-time-code autofill attribute
    And the pasted OTP value is accepted on the mobile screen

    Examples:
      | profile |
      | android |
      | ios |
