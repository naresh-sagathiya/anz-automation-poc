@mobile @ID-M12 @traffic-safety
Feature: Banking Scenario - Traffic safety checks
  In order to protect customer data on mobile banking
  As a mobile banking user
  I want all network traffic to remain secure and free from sensitive account data leakage

  Scenario Outline: Mobile traffic stays HTTPS and excludes sensitive data from URLs and analytics calls
    Given I use the mobile "<profile>" profile
    And I open the parabank mobile site
    And I login with valid mobile credentials
    When I monitor mobile network traffic for sensitive data exposure
    And I navigate to account overview and transfer pages
    Then all mobile network requests use HTTPS
    And no sensitive account data appears in URL query strings
    And no third-party analytics domains are contacted

    Examples:
      | profile |
      | android |
      | ios |
