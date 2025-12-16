<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    DB::statement("CREATE TABLE IF NOT EXISTS soil_test_reports (
        report_id INT AUTO_INCREMENT PRIMARY KEY,
        data_operator_id INT NOT NULL,
        farmer_id INT NULL,
        postal_code INT NULL,
        village VARCHAR(100) NOT NULL,
        field_size DECIMAL(10,2) NULL COMMENT 'Size in decimal/bigha',
        current_crop VARCHAR(100) NULL,
        test_date DATE NOT NULL,
        nitrogen DECIMAL(8,2) NULL COMMENT 'N in mg/kg or ppm',
        phosphorus DECIMAL(8,2) NULL COMMENT 'P in mg/kg or ppm',
        potassium DECIMAL(8,2) NULL COMMENT 'K in mg/kg or ppm',
        ph_level DECIMAL(4,2) NULL COMMENT 'pH 0-14 scale',
        ec_value DECIMAL(6,2) NULL COMMENT 'EC in dS/m',
        soil_moisture DECIMAL(5,2) NULL COMMENT 'Moisture in percentage',
        soil_temperature DECIMAL(5,2) NULL COMMENT 'Temperature in Celsius',
        organic_matter DECIMAL(5,2) NULL COMMENT 'Organic matter in percentage',
        soil_type ENUM('loamy', 'sandy', 'clay', 'silty') NULL COMMENT 'Soil type',
        calcium DECIMAL(8,2) NULL,
        magnesium DECIMAL(8,2) NULL,
        sulfur DECIMAL(8,2) NULL,
        zinc DECIMAL(8,2) NULL,
        iron DECIMAL(8,2) NULL,
        health_rating ENUM('poor', 'fair', 'good', 'excellent') NULL,
        fertilizer_recommendation TEXT NULL,
        crop_recommendation TEXT NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (data_operator_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (farmer_id) REFERENCES users(user_id) ON DELETE SET NULL,
        FOREIGN KEY (postal_code) REFERENCES location(postal_code) ON DELETE SET NULL,
        INDEX idx_data_operator (data_operator_id),
        INDEX idx_farmer (farmer_id),
        INDEX idx_test_date (test_date)
    )");
    
    echo "Soil test reports table created successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
