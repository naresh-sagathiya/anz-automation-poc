@mobile @mfa @github-oauth
Feature: Mobile GitHub OAuth authentication with MFA
  In order to authenticate mobile users through GitHub
  As a banking application
  I want GitHub MFA to complete before the mobile dashboard is opened

  @smoke
  Scenario: GitHub OAuth and MFA succeed on mobile
    Given I open the mobile GitHub OAuth mock
    When I authorize the GitHub OAuth request
    And I complete the GitHub MFA challenge with a valid code
    Then the mobile dashboard should be displayed

  @regression
  Scenario: Invalid GitHub MFA blocks mobile login
    Given I open the mobile GitHub OAuth mock
    When I authorize the GitHub OAuth request
    And I complete the GitHub MFA challenge with an invalid code
    Then the mobile login error should be displayed

  @regression
  Scenario: Denied GitHub authorization blocks mobile login
    Given I open the mobile GitHub OAuth mock
    When I deny the GitHub OAuth request
    Then the mobile login error should be displayed

  @real-oauth
  Scenario: Real GitHub OAuth smoke reaches the mobile dashboard
    Given the real GitHub OAuth environment is configured
    When I open the real mobile GitHub OAuth authorization URL
    And I complete the real GitHub MFA challenge with the configured TOTP
    Then the mobile dashboard should be displayed
