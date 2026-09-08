@mobile @ID-M2 @mfa-login
Feature: Banking Scenario - Login and MFA on mobile
  In order to verify mobile login and OTP handling on narrow screens
  As a mobile banking user
  I want login and one-time-code entry to work with mobile viewport behavior and autofill semantics

  Scenario: Android mobile login and OTP entry succeed
    Given I use the mobile "android" profile
    And I open the SeleniumBase MFA login page on mobile
    When I fill the SeleniumBase mobile login credentials
    And I paste the generated TOTP into the mobile MFA field
    And the pasted TOTP is accepted on the mobile screen
    When I submit the mobile MFA login
    Then the SeleniumBase mobile login succeeds

  Scenario: iOS mobile login and OTP entry succeed
    Given I use the mobile "ios" profile
    And I open the SeleniumBase MFA login page on mobile
    When I fill the SeleniumBase mobile login credentials
    And I paste the generated TOTP into the mobile MFA field
    And the pasted TOTP is accepted on the mobile screen
    When I submit the mobile MFA login
    Then the SeleniumBase mobile login succeeds

  Scenario: Mobile OTP field exposes autofill metadata
    Given I use the mobile "android" profile
    And I open the SeleniumBase MFA login page on mobile
    When I fill the SeleniumBase mobile login credentials
    And I paste the generated TOTP into the mobile MFA field
    Then the mobile MFA field supports one-time-code autofill

  Scenario: Mobile OTP value accepts clipboard paste
    Given I use the mobile "ios" profile
    And I open the SeleniumBase MFA login page on mobile
    When I fill the SeleniumBase mobile login credentials
    And I paste the generated TOTP into the mobile MFA field
    Then the pasted TOTP is accepted on the mobile screen
