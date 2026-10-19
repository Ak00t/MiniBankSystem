-- =========================================================================
-- Customer Portal (G1) -- Customer Transaction History Performance Indexes
-- Database: cbd
-- Table: bank_transactions
-- File: idx_customer_transaction_history.sql
--
-- Purpose:
--   Optimizes paginated, filtered transaction history queries executed by
--   sp_get_customer_transaction_history.
--
-- Index Architecture Rationale:
--   1. Leftmost Prefix Equality:
--      Filters on source_account_id and destination_account_id cleanly leverage
--      the leading column of each composite index.
--   2. Inverted Chronological Sort Optimization:
--      The (initiated_at, transaction_id) suffix allows MySQL 8 to satisfy
--      `ORDER BY initiated_at DESC, transaction_id DESC` directly via reverse
--      index lookup without triggering a filesort on the bank_transactions table.
--   3. Sargable Range Scan:
--      Date filtering on initiated_at (from_date, to_date) operates as an efficient
--      range scan on the second composite column.
--   4. Minimal Index Footprint:
--      Only two composite indexes are created to avoid write/insert amplification
--      and excessive buffer pool pressure.
-- =========================================================================

-- Index 1: Optimizes the source account branch and ordering
CREATE INDEX idx_source_acc_initiated
ON bank_transactions(source_account_id, initiated_at, transaction_id);

-- Index 2: Optimizes the destination account branch and ordering
CREATE INDEX idx_dest_acc_initiated
ON bank_transactions(destination_account_id, initiated_at, transaction_id);
