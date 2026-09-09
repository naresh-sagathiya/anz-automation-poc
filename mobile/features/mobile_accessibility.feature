@mobile @ID-M13 @accessibility
Feature: Banking Scenario - Mobile accessibility scan
  In order to verify the mobile banking experience is being assessed with the correct viewport and WCAG rules
  As a mobile user
  I want the mobile login, dashboard, and transfer pages to produce a valid accessibility scan result that surfaces viewport-specific issues

  Scenario Outline: Mobile login, dashboard, and transfer views produce a valid WCAG 2.1 AA scan with measurable violations
    Given I use the mobile "<profile>" profile
    And I open the parabank mobile site
    When I run a WCAG 2.1 AA accessibility scan on the mobile "<screen>" page
    Then the mobile accessibility scan for "<screen>" should complete and report at least one mobile accessibility finding

    Examples:
      | profile | screen |
      | android | login |
      | android | dashboard |
      | android | transfer |
      | ios | login |
      | ios | dashboard |
      | ios | transfer |
