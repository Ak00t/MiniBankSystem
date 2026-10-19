-- =========================================================================
-- Customer Portal (G1) -- Customer Account Statement Stored Procedure
-- Database: cbd
-- File: sp_customer_account_statement.sql
-- 
-- Description:
--   Retrieves historical account statement data for an authenticated customer
--   and selected account over any given date range (from_date to to_date).
--   Returns 2 Result Sets:
--     Result Set 1: Header & Summary (Account/Customer Info + Opening/Closing
--                   Balances + Credit/Debit Totals & Counts)
--     Result Set 2: Transaction Rows (Ordered chronological ledger entries
--                   with running balances)
--
-- Security & Invariants:
--   1. Authenticated Principal Only: Accepts p_customer_id VARCHAR(36) (UUID).
--      Strictly validates that the account belongs to this authenticated customer.
--      Raises SQLSTATE '45000' immediately if account is not found or does not
--      belong to the customer.
--   2. Account Opening Date Boundary: Enforces that p_from_date cannot be earlier
--      than DATE(accounts.opened_at). Raises SQLSTATE '45000' if p_from_date
--      predates account inception.
--   3. Direct Ledger Resolution: Avoids relying on ledger_accounts.customer_account_id
--      which is NULL for pooled GL accounts. Matches source_account_id (line_no=1)
--      and destination_account_id (line_no=2). Excludes fee lines (line_no=3).
--   4. Historical Balance Reconstruction: Reconstructs opening balance from
--      historical ledger movements without relying on accounts.current_balance
--      for ordinary periods.
--   5. SARGable Index Range Filter: Uses t.completed_at >= from_datetime AND
--      t.completed_at < to_datetime_exclusive (no index-disabling DATE() wrapping).
-- =========================================================================

DROP PROCEDURE IF EXISTS sp_get_customer_account_statement;

DELIMITER $$

CREATE PROCEDURE sp_get_customer_account_statement(
    IN p_customer_id    VARCHAR(36),
    IN p_account_number VARCHAR(34),
    IN p_from_date      DATE,
    IN p_to_date        DATE
)
proc_label: BEGIN
    DECLARE v_customer_bin_id BINARY(16);
    DECLARE v_account_id BINARY(16);
    DECLARE v_account_type VARCHAR(15);
    DECLARE v_currency VARCHAR(3);
    DECLARE v_current_balance DECIMAL(18,4);
    DECLARE v_opened_at DATETIME;
    DECLARE v_customer_name VARCHAR(200);
    DECLARE v_phone VARCHAR(32);
    DECLARE v_nrc VARCHAR(50);
    
    DECLARE v_from_datetime DATETIME;
    DECLARE v_to_datetime_exclusive DATETIME;
    
    DECLARE v_opening_balance DECIMAL(18,4);
    DECLARE v_closing_balance DECIMAL(18,4);
    DECLARE v_num_credits INT DEFAULT 0;
    DECLARE v_total_credit DECIMAL(18,4) DEFAULT 0.0000;
    DECLARE v_num_debits INT DEFAULT 0;
    DECLARE v_total_debit DECIMAL(18,4) DEFAULT 0.0000;

    -- -------------------------------------------------------------------------
    -- 1. Date boundaries (Index-friendly, avoids DATE() or CAST() on column)
    -- -------------------------------------------------------------------------
    SET v_from_datetime = CAST(p_from_date AS DATETIME);
    SET v_to_datetime_exclusive = DATE_ADD(CAST(p_to_date AS DATETIME), INTERVAL 1 DAY);

    -- -------------------------------------------------------------------------
    -- 2. Convert UUID and Validate Account Ownership
    -- -------------------------------------------------------------------------
    -- Converts 36-character hyphenated UUID string to BINARY(16)
    SET v_customer_bin_id = UNHEX(REPLACE(p_customer_id, '-', ''));

    SELECT
        a.account_id,
        a.account_type,
        a.currency,
        a.current_balance,
        a.opened_at,
        COALESCE(
            NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''),
            c.full_name
        ) AS customer_name,
        COALESCE(p.phone, c.phone) AS phone,
        p.nrc AS nrc
    INTO
        v_account_id,
        v_account_type,
        v_currency,
        v_current_balance,
        v_opened_at,
        v_customer_name,
        v_phone,
        v_nrc
    FROM accounts a
    JOIN customers c ON a.customer_id = c.customer_id
    LEFT JOIN personal_info p ON c.customer_id = p.customer_id
    WHERE a.account_number = p_account_number
      AND a.customer_id = v_customer_bin_id
      AND c.customer_id = v_customer_bin_id
      AND a.deleted_at IS NULL
    LIMIT 1;

    -- Strict security: If account does not exist or does not belong to the customer, raise error
    IF v_account_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Account not found or access denied for this customer';
    END IF;

    -- -------------------------------------------------------------------------
    -- 3. Validate From Date Against Account Opening Date
    -- -------------------------------------------------------------------------
    IF p_from_date < DATE(v_opened_at) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'From Date cannot be earlier than the account opening date.';
    END IF;

    -- -------------------------------------------------------------------------
    -- 4. Calculate Opening Balance
    -- -------------------------------------------------------------------------
    -- 4a. Most recent completed transaction prior to p_from_date
    SELECT balance_after INTO v_opening_balance
    FROM (
        SELECT le.balance_after, t.completed_at, le.ledger_entry_id
        FROM bank_transactions t
        JOIN ledger_entries le ON le.transaction_id = t.transaction_id AND le.line_no = 1
        WHERE t.source_account_id = v_account_id
          AND t.status = 'COMPLETED'
          AND t.completed_at < v_from_datetime
        UNION ALL
        SELECT le.balance_after, t.completed_at, le.ledger_entry_id
        FROM bank_transactions t
        JOIN ledger_entries le ON le.transaction_id = t.transaction_id AND le.line_no = 2
        WHERE t.destination_account_id = v_account_id
          AND t.status = 'COMPLETED'
          AND t.completed_at < v_from_datetime
    ) prior_txns
    ORDER BY completed_at DESC, ledger_entry_id DESC
    LIMIT 1;

    -- 4b. If no transactions exist prior to from_date:
    IF v_opening_balance IS NULL THEN
        -- Find the initial balance from the very first transaction ever posted
        SELECT balance_before INTO v_opening_balance
        FROM (
            SELECT le.balance_before, t.completed_at, le.ledger_entry_id
            FROM bank_transactions t
            JOIN ledger_entries le ON le.transaction_id = t.transaction_id AND le.line_no = 1
            WHERE t.source_account_id = v_account_id
              AND t.status = 'COMPLETED'
            UNION ALL
            SELECT le.balance_before, t.completed_at, le.ledger_entry_id
            FROM bank_transactions t
            JOIN ledger_entries le ON le.transaction_id = t.transaction_id AND le.line_no = 2
            WHERE t.destination_account_id = v_account_id
              AND t.status = 'COMPLETED'
        ) first_tx
        ORDER BY completed_at ASC, ledger_entry_id ASC
        LIMIT 1;

        -- 4c. If zero transactions have ever posted to the account, balance has never changed (untouched initial deposit)
        IF v_opening_balance IS NULL THEN
            SET v_opening_balance = v_current_balance;
        END IF;
    END IF;

    -- -------------------------------------------------------------------------
    -- 5. Calculate Summary Aggregates within Date Range
    -- -------------------------------------------------------------------------
    SELECT
        COALESCE(SUM(CASE WHEN credit_amount IS NOT NULL THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(credit_amount), 0.0000),
        COALESCE(SUM(CASE WHEN debit_amount IS NOT NULL THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(debit_amount), 0.0000)
    INTO
        v_num_credits,
        v_total_credit,
        v_num_debits,
        v_total_debit
    FROM (
        SELECT NULL AS credit_amount, le.amount AS debit_amount
        FROM bank_transactions t
        JOIN ledger_entries le ON le.transaction_id = t.transaction_id AND le.line_no = 1
        WHERE t.source_account_id = v_account_id
          AND t.status = 'COMPLETED'
          AND t.completed_at >= v_from_datetime
          AND t.completed_at < v_to_datetime_exclusive
        UNION ALL
        SELECT le.amount AS credit_amount, NULL AS debit_amount
        FROM bank_transactions t
        JOIN ledger_entries le ON le.transaction_id = t.transaction_id AND le.line_no = 2
        WHERE t.destination_account_id = v_account_id
          AND t.status = 'COMPLETED'
          AND t.completed_at >= v_from_datetime
          AND t.completed_at < v_to_datetime_exclusive
    ) aggregates;

    -- -------------------------------------------------------------------------
    -- 6. Calculate Closing Balance (Reconciled double-entry formula)
    -- -------------------------------------------------------------------------
    SET v_closing_balance = v_opening_balance + v_total_credit - v_total_debit;

    -- =========================================================================
    -- RESULT SET 1: Header & Summary Result
    -- =========================================================================
    SELECT
        p_account_number             AS account_number,
        v_account_type               AS account_type,
        v_customer_name              AS customer_name,
        v_phone                      AS phone,
        v_nrc                        AS nrc,
        v_currency                   AS currency,
        p_from_date                  AS from_date,
        p_to_date                    AS to_date,
        v_opening_balance            AS opening_balance,
        v_closing_balance            AS closing_balance,
        v_num_credits                AS number_of_credit_entries,
        v_total_credit               AS total_credit,
        v_num_debits                 AS number_of_debit_entries,
        v_total_debit                AS total_debit;

    -- =========================================================================
    -- RESULT SET 2: Transaction Rows
    -- =========================================================================
    SELECT
        txn_time                     AS transaction_date,
        transaction_ref,
        description,
        credit_amount,
        debit_amount,
        balance
    FROM (
        SELECT
            t.completed_at                                 AS txn_time,
            t.transaction_ref,
            COALESCE(le.narration, t.description)         AS description,
            NULL                                           AS credit_amount,
            le.amount                                      AS debit_amount,
            le.balance_after                               AS balance,
            le.ledger_entry_id
        FROM bank_transactions t
        JOIN ledger_entries le ON le.transaction_id = t.transaction_id AND le.line_no = 1
        WHERE t.source_account_id = v_account_id
          AND t.status = 'COMPLETED'
          AND t.completed_at >= v_from_datetime
          AND t.completed_at < v_to_datetime_exclusive

        UNION ALL

        SELECT
            t.completed_at                                 AS txn_time,
            t.transaction_ref,
            COALESCE(le.narration, t.description)         AS description,
            le.amount                                      AS credit_amount,
            NULL                                           AS debit_amount,
            le.balance_after                               AS balance,
            le.ledger_entry_id
        FROM bank_transactions t
        JOIN ledger_entries le ON le.transaction_id = t.transaction_id AND le.line_no = 2
        WHERE t.destination_account_id = v_account_id
          AND t.status = 'COMPLETED'
          AND t.completed_at >= v_from_datetime
          AND t.completed_at < v_to_datetime_exclusive
    ) statement_rows
    ORDER BY txn_time ASC, ledger_entry_id ASC;

END proc_label$$

DELIMITER ;
