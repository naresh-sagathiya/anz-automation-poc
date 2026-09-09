Feature: Scheduled future-dated payment

  @w12
  Scenario: Store a future-dated payment in the configured timezone
    Given the scheduled-payment form is open
    When I enter a dynamically generated valid payment amount
    And I select the future payment date "tomorrow"
    And I submit the scheduled payment
    Then the payment instruction should be stored with the selected date
    And the stored timezone should be the configured timezone
    And the payment status should be "scheduled"

  @w12
  Scenario: Roll a weekend payment date to the next business day
    Given the scheduled-payment form is open
    When I enter a dynamically generated valid payment amount
    And I select the future payment date "next Saturday"
    And the next business day after the selected weekend date is a holiday
    And I submit the scheduled payment
    Then the payment instruction should be stored with the next business date
    And the payment status should be "scheduled"