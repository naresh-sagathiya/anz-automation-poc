@mobile @ID-M15 @visual-baselines
Feature: Mobile visual baselines
  In order to detect unintended visual regressions on mobile banking screens
  As a mobile banking user
  I want dashboard and transfer screens baselined for each device profile
  with balances and dates masked

  Scenario Outline: Dashboard and transfer screens match visual baselines
    Given I use the mobile "<profile>" profile
    When I capture the mobile dashboard visual baseline
    And I capture the mobile transfer visual baseline
    Then the mobile visual baselines should match for the "<profile>" device

    Examples:
      | profile |
      | android |
      | ios     |
