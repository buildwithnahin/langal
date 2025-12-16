<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FieldDataReport extends Model
{
    protected $table = 'field_data_reports';
    protected $primaryKey = 'report_id';
    
    protected $fillable = [
        'data_operator_id',
        'postal_code',
        'village',
        'weather_condition',
        'temperature',
        'rainfall',
        'crop_condition',
        'pest_disease',
        'soil_moisture',
        'irrigation_status',
        'notes',
        'report_date',
    ];

    protected $casts = [
        'temperature' => 'decimal:2',
        'rainfall' => 'decimal:2',
        'report_date' => 'date',
    ];

    /**
     * Get the data operator who created this report
     */
    public function dataOperator()
    {
        return $this->belongsTo(User::class, 'data_operator_id', 'user_id');
    }

    /**
     * Get the location information
     */
    public function location()
    {
        return $this->belongsTo(Location::class, 'postal_code', 'postal_code');
    }
}
