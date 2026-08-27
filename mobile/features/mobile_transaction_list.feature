@mobile @ID-M7 @transaction-list
Feature: Mobile banking transaction list behavior
  In order to verify transaction browsing quality on mobile banking
  As a mobile user
  I want additional transaction loads and refresh to behave correctly without duplicate rows

  Scenario: Additional transaction loads do not duplicate transactions
    Given I open the mobile transaction list screen for ID-M7
    And I capture the initial transaction list snapshot
    When I create 4 additional transfer transactions for the current mobile account
    And I open the updated account activity from Accounts Overview
    And I scroll through the account activity list on mobile
    Then the transaction list grows after lazy-load
    And the transaction list contains no duplicate rows after lazy-load

  Scenario: Refresh reloads transaction list correctly on mobile
    Given I open the mobile transaction list screen for ID-M7
    And I capture the initial transaction list snapshot
    When I create 2 additional transfer transactions for the current mobile account
    And I open the updated account activity from Accounts Overview
    And I scroll through the account activity list on mobile
    And I refresh the transaction list on mobile
    Then refresh resets the list and keeps data consistent