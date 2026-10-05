-- ============================================================
-- Tekno Citra Negara Business Center
-- Database schema for POS application
-- 4 tables only, as required by the project specification.
-- ============================================================

-- users: admin + kasir data
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'KASIR') NOT NULL DEFAULT 'KASIR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- products: inventory for Business Center
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  price DECIMAL(12,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(255) NULL,
  description TEXT NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- members: customer membership list
CREATE TABLE IF NOT EXISTS members (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- transactions: main sales record, with JSON item detail for the 4-table requirement
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  transaction_number VARCHAR(50) NOT NULL UNIQUE,
  cashier_id VARCHAR(64) NOT NULL,
  cashier_name VARCHAR(100) NOT NULL,
  member_id VARCHAR(64) NULL,
  member_name VARCHAR(100) NULL,
  payment_method ENUM('TUNAI', 'QRIS', 'DEBIT') NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  amount_received DECIMAL(12,2) NULL,
  change_amount DECIMAL(12,2) NULL,
  items JSON NOT NULL,
  status ENUM('COMPLETED') NOT NULL DEFAULT 'COMPLETED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SAMPLE DATA (development only)
-- ============================================================

INSERT INTO users (id, name, username, password_hash, role) VALUES
  ('user-admin', 'Administrator', 'admin', '$2a$10$G5I3rG4W7PYgunVtG1nDs.aCk5h8opjlt9VzceQ2naXo4jvBC6O7y', 'ADMIN'),
  ('user-kasir', 'Kasir Pertama', 'kasir', '$2a$10$Y8LqqbM4tBAjF0VebH7gA.Wyihd4rP3d9n3hD1m1nS9JvKB4cNQKG', 'KASIR')
ON DUPLICATE KEY UPDATE name = VALUES(name), username = VALUES(username), password_hash = VALUES(password_hash), role = VALUES(role);

INSERT INTO products (id, name, code, price, stock, image_url, description, status) VALUES
  ('prod-1', 'Mouse Wireless Logitech', 'MWS-001', 120000, 12, 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=500&q=80', 'Mouse wireless ergonomis', 'ACTIVE'),
  ('prod-2', 'Kabel LAN Cat6', 'LAN-006', 35000, 8, 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80', 'Kabel jaringan CAT6', 'ACTIVE'),
  ('prod-3', 'Flashdisk 32GB', 'FD-032', 70000, 5, 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=500&q=80', 'Flashdisk USB 3.0', 'ACTIVE'),
  ('prod-4', 'Kabel HDMI', 'HDMI-01', 45000, 2, 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=500&q=80', 'Kabel HDMI 2m', 'ACTIVE'),
  ('prod-5', 'Keyboard USB', 'KB-USB', 180000, 0, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=500&q=80', 'Keyboard mekanik USB', 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), code = VALUES(code), price = VALUES(price), stock = VALUES(stock), image_url = VALUES(image_url), description = VALUES(description), status = VALUES(status);

INSERT INTO members (id, name, code, phone) VALUES
  ('member-1', 'Rina Putri', 'MBR-1001', '081234567890'),
  ('member-2', 'Budi Santoso', 'MBR-1002', '082345678901')
ON DUPLICATE KEY UPDATE name = VALUES(name), code = VALUES(code), phone = VALUES(phone);

INSERT INTO transactions (id, transaction_number, cashier_id, cashier_name, member_id, member_name, payment_method, total, amount_received, change_amount, items) VALUES
  ('trx-001', 'TRX-2026-0001', 'user-kasir', 'Kasir Pertama', 'member-1', 'Rina Putri', 'TUNAI', 500000, 500000, 0, '[{"productId":"prod-1","name":"Mouse Wireless Logitech","price":120000,"quantity":2},{"productId":"prod-7","name":"Kertas A4 80gsm","price":25000,"quantity":8}]'),
  ('trx-002', 'TRX-2026-0002', 'user-kasir', 'Kasir Pertama', NULL, NULL, 'QRIS', 235000, NULL, NULL, '[{"productId":"prod-3","name":"Flashdisk 32GB","price":70000,"quantity":1},{"productId":"prod-8","name":"Tinta Printer","price":95000,"quantity":1}]')
ON DUPLICATE KEY UPDATE cashier_id = VALUES(cashier_id), cashier_name = VALUES(cashier_name), member_id = VALUES(member_id), member_name = VALUES(member_name), payment_method = VALUES(payment_method), total = VALUES(total), amount_received = VALUES(amount_received), change_amount = VALUES(change_amount), items = VALUES(items), status = VALUES(status);
