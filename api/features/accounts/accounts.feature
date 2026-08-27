Feature: ParaBank account APIs
  Background:
    Given the ParaBank Account API is available

  @smoke @account 
  Scenario: Get Accounts and Account by ID
    When I request the accounts for the configured customer
    And I request one account by ID from the accounts list
    Then the accounts list response matches the account list schema
    And the account detail response matches the account schema
    And every returned account has numeric balances, ISO currency, and masked account number

  @smoke @account 
  Scenario: Balance Reconciliation
    When I request one account by ID from the configured customer
    And I request the transaction history for that account
    Then the transaction history response matches the transaction list schema
    And the transaction history reconciles with the current account balance
    And the account available, current, and pending balances are internally consistent

  @smoke @account
  Scenario: Transaction List - Filters and Paging
    When I request transactions for an account with transaction history
    And I request transactions using supported ParaBank filters
    Then every filtered transaction satisfies the requested filter
    And paginated transaction pages have no duplicates
    And the total transaction count remains consistent across pages
