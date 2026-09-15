CREATE DATABASE IF NOT EXISTS dollar_exchange CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dollar_exchange;

DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS deal_timeline_events;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS customers;

CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NULL,
    company_name VARCHAR(150) NULL,
    notes TEXT NULL,
    preferred_channel ENUM('WhatsApp','Messenger','Telegram','Phone','Platform') DEFAULT 'WhatsApp',
    avatar_color VARCHAR(30) DEFAULT 'bg-indigo-600',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role ENUM('owner','customer') NOT NULL,
    customer_id INT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    company_name VARCHAR(150) NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    requested_usd_amount DECIMAL(12,2) NOT NULL,
    target_rate DECIMAL(8,2) NULL,
    notes TEXT NULL,
    status ENUM('new','under_discussion','pending','converted','cancelled','rejected','archived') DEFAULT 'pending',
    converted_deal_id INT NULL,
    preferred_channel VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE deals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deal_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    dollar_amount DECIMAL(12,2) NOT NULL,
    exchange_rate DECIMAL(8,2) NOT NULL,
    expected_bdt_amount DECIMAL(14,2) NOT NULL,
    paid_amount DECIMAL(14,2) DEFAULT 0,
    due_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    status ENUM('draft','dollar_sent_pending','awaiting_confirmation','fundify_verification_pending','active_due','partially_paid','completed','disputed','cancelled') DEFAULT 'draft',
    notes TEXT NULL,
    dollar_proof_url VARCHAR(500) NULL,
    dollar_proof_uploaded_at TIMESTAMP NULL,
    confirmed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    linked_request_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_request_id) REFERENCES requests(id) ON DELETE SET NULL
) ENGINE=InnoDB;

ALTER TABLE requests ADD FOREIGN KEY (converted_deal_id) REFERENCES deals(id) ON DELETE SET NULL;

CREATE TABLE deal_timeline_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deal_id INT NOT NULL,
    event_type ENUM('deal_created','dollar_proof_uploaded','receipt_confirmed','receipt_disputed','payment_proof_submitted','payment_approved','payment_declined','balance_adjusted','deal_completed','deal_cancelled') NOT NULL,
    actor_role ENUM('owner','customer','system') NOT NULL,
    actor_name VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    amount_usd DECIMAL(12,2) NULL,
    amount_bdt DECIMAL(14,2) NULL,
    exchange_rate DECIMAL(8,2) NULL,
    proof_image_url VARCHAR(500) NULL,
    proof_type ENUM('usd_sent','bdt_paid') NULL,
    proof_status ENUM('pending','approved','rejected','disputed') NULL,
    payment_event_id VARCHAR(50) NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deal_id INT NULL,
    deal_number VARCHAR(20) NULL,
    customer_id INT NULL,
    customer_name VARCHAR(100) NOT NULL,
    event_type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    amount_usd DECIMAL(12,2) NULL,
    amount_bdt DECIMAL(14,2) NULL,
    badge_type ENUM('info','warning','success','danger','purple') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_customers_created_at ON customers (created_at, id);
CREATE INDEX idx_customers_phone ON customers (phone);
CREATE INDEX idx_customers_company_name ON customers (company_name);
CREATE INDEX idx_requests_customer_status_created ON requests (customer_id, status, created_at, id);
CREATE INDEX idx_requests_status_created ON requests (status, created_at, id);
CREATE INDEX idx_requests_converted_deal ON requests (converted_deal_id);
CREATE INDEX idx_deals_customer_status_created ON deals (customer_id, status, created_at, id);
CREATE INDEX idx_deals_status_created ON deals (status, created_at, id);
CREATE INDEX idx_deals_due_created ON deals (due_amount, created_at, id);
CREATE INDEX idx_timeline_deal_created ON deal_timeline_events (deal_id, created_at, id);
CREATE INDEX idx_activities_created ON activities (created_at, id);
