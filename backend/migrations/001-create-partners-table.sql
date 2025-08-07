-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    normalized_name VARCHAR(100) NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    total_transactions INT NOT NULL DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_normalized_name (normalized_name),
    KEY idx_status (status)
);

-- Backup old revenue data
CREATE TABLE IF NOT EXISTS revenues_backup AS SELECT * FROM revenues;

-- Add partner_id column to revenues
ALTER TABLE revenues ADD COLUMN partner_id INT AFTER date;

-- Reset revenues table (as requested)
TRUNCATE TABLE revenues;

-- Add foreign key constraint
ALTER TABLE revenues 
ADD CONSTRAINT fk_revenue_partner 
FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE RESTRICT;

-- Remove old partner column (after confirming data is backed up)
-- ALTER TABLE revenues DROP COLUMN partner;