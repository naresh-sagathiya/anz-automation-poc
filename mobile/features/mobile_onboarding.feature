@mobile @ID-M1 @onboarding
Feature: Banking Scenario - Onboarding on mobile

  Scenario Outline: Registration completes on a mobile profile
    Given I use the mobile "<profile>" profile
    And I open the parabank mobile site
    When I register a new mobile customer
    Then mobile registration should complete successfully
    And the mobile page should have no horizontal scroll

    Examples:
      | profile  |
      | android  |
      | ios      |