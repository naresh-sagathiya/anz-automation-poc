@mobile @ID-M10 @offline-reconnect
Feature: Mobile transfer behavior during offline and reconnect
  In order to protect users during unstable network conditions
  As a mobile banking user
  I want a clear offline message and safe recovery without duplicate debit

  Scenario: Going offline mid-payment shows clear feedback and reconnect creates no duplicate debit
    Given I open and login to parabank mobile for ID-M10
    And I open the transfer page for ID-M10
    And I prepare valid transfer details for ID-M10
    When I start the ID-M10 transfer and switch offline immediately
    Then a clear offline message is shown for ID-M10
    When I reconnect and retry the ID-M10 transfer once
    Then reconnect causes no duplicate debit for ID-M10