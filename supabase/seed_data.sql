-- SAKU Seed Data
-- Sistem Aplikasi Keuangan UMKM
-- This file contains initial data for transaction categories

-- =====================================================
-- TRANSACTION CATEGORIES SEED DATA
-- =====================================================

-- Insert revenue categories
INSERT INTO transaction_categories (name, type, has_item_field, display_order, is_active) VALUES
-- Revenue categories (no item tracking needed)
('Penjualan Produk', 'revenue', false, 1, true),
('Penjualan Jasa', 'revenue', false, 2, true),
('Pendapatan Lain-lain', 'revenue', false, 3, true)

ON CONFLICT DO NOTHING;

-- Insert expense categories with item tracking
INSERT INTO transaction_categories (name, type, has_item_field, display_order, is_active) VALUES
-- Expense categories WITH item tracking (inventory/supplies)
('Pembelian Barang Dagangan', 'expense', true, 4, true),
('Bahan Baku', 'expense', true, 5, true),
('Perlengkapan & Supplies', 'expense', true, 6, true)

ON CONFLICT DO NOTHING;

-- Insert expense categories without item tracking
INSERT INTO transaction_categories (name, type, has_item_field, display_order, is_active) VALUES
-- Expense categories WITHOUT item tracking (services/recurring costs)
('Gaji & Upah', 'expense', false, 7, true),
('Sewa', 'expense', false, 8, true),
('Utilitas (Listrik, Air, Internet)', 'expense', false, 9, true),
('Marketing & Promosi', 'expense', false, 10, true),
('Transportasi & Logistik', 'expense', false, 11, true),
('Perawatan & Perbaikan', 'expense', false, 12, true),
('Biaya Administrasi', 'expense', false, 13, true),
('Lain-lain', 'expense', false, 14, true)

ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Run this to verify the seed data was inserted correctly:
-- SELECT name, type, has_item_field, display_order FROM transaction_categories ORDER BY display_order;

-- =====================================================
-- NOTES
-- =====================================================

-- Categories with has_item_field = true will show:
-- - Item Name field
-- - Quantity field
-- - Unit field (pcs, box, kg, liter, etc.)
--
-- Categories with has_item_field = false will only show:
-- - Notes field
--
-- This allows for:
-- 1. Better inventory tracking for physical goods
-- 2. Simplified data entry for services and recurring costs
-- 3. Future features like stock management and item history
