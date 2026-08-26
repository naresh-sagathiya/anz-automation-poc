Feature: Android emulator Chrome flow
  In order to verify the app runs on a real Android emulator browser
  As a user of the Android emulator Chrome session
  I want to load the ParaBank login and interact with the mobile site

  @android @chrome
  Scenario: Login through Chrome on Android emulator
    Given I launch Chrome on the Android emulator
    And I open the ParaBank login page
    When I login with the Android emulator credentials
    Then I should see the account overview page
