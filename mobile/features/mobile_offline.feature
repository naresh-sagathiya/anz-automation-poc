@mobile @M11 @offline
Feature: Mobile execution without a live backend
  In order to run mobile checks in isolated environments
  As an automation engineer
  I want mobile scenarios to use HAR recordings and route mocks

  Scenario: M11 loads the mobile entry page from offline test data
    Given I enable the mobile HAR recording and route mocks
    When I open the offline mobile ParaBank page
    Then the offline mobile page should be displayed
    And the offline mobile page should not request the live backend