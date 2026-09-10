Feature: ABC Bank native Android launch
  As an ABC Bank automation engineer
  I want to verify the native app can be launched through Appium

  @android @abc-bank @smoke
  Scenario: Launch ABC Bank
    Given I launch ABC Bank
    Then the ABC Bank main activity should be displayed

  @android @abc-bank @login
  Scenario: Login to ABC Bank
    Given I launch ABC Bank
    When I enter the ABC Bank credentials
    And I click the ABC Bank login button
    And I enter the ABC Bank verification code
    And I click the ABC Bank verify button
    Then ABC Bank should remain active after verification

  @android @abc-bank @manual-verification
  Scenario: Login and wait for manual verification
    Given I launch ABC Bank
    When I enter the ABC Bank credentials
    And I click the ABC Bank login button
    Then the ABC Bank verification screen should be displayed

  @android @abc-bank @manual-verification-submit
  Scenario: Submit manually entered verification code
    Given I launch ABC Bank
    When I enter the ABC Bank credentials
    And I click the ABC Bank login button
    And I enter the verification code manually in the emulator
    Then ABC Bank should remain active after verification