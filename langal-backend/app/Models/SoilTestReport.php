<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SoilTestReport extends Model
{
    protected $table = 'soil_test_reports';
    protected $primaryKey = 'report_id';
    
    protected $fillable = [
        'data_operator_id',
        'farmer_id',
        'postal_code',
        'village',
        'field_size',
        'current_crop',
        'test_date',
        'nitrogen',
        'phosphorus',
        'potassium',
        'ph_level',
        'ec_value',
        'soil_moisture',
        'soil_temperature',
        'organic_matter',
        'soil_type',
        'calcium',
        'magnesium',
        'sulfur',
        'zinc',
        'iron',
        'health_rating',
        'fertilizer_recommendation',
        'crop_recommendation',
        'notes',
    ];

    protected $casts = [
        'field_size' => 'decimal:2',
        'nitrogen' => 'decimal:2',
        'phosphorus' => 'decimal:2',
        'potassium' => 'decimal:2',
        'ph_level' => 'decimal:2',
        'ec_value' => 'decimal:2',
        'soil_moisture' => 'decimal:2',
        'soil_temperature' => 'decimal:2',
        'organic_matter' => 'decimal:2',
        'calcium' => 'decimal:2',
        'magnesium' => 'decimal:2',
        'sulfur' => 'decimal:2',
        'zinc' => 'decimal:2',
        'iron' => 'decimal:2',
        'test_date' => 'date',
    ];

    /**
     * Get the data operator who created this report
     */
    public function dataOperator()
    {
        return $this->belongsTo(User::class, 'data_operator_id', 'user_id');
    }

    /**
     * Get the farmer for this soil test
     */
    public function farmer()
    {
        return $this->belongsTo(User::class, 'farmer_id', 'user_id');
    }

    /**
     * Get the location information
     */
    public function location()
    {
        return $this->belongsTo(Location::class, 'postal_code', 'postal_code');
    }
}
