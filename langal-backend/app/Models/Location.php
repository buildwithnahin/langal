<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    protected $table = 'location';
    protected $primaryKey = 'postal_code';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'postal_code',
        'division',
        'division_bn',
        'district',
        'district_bn',
        'upazila',
        'upazila_bn',
        'post_office',
        'post_office_bn',
    ];

    /**
     * Get all field reports for this location
     */
    public function fieldReports()
    {
        return $this->hasMany(FieldDataReport::class, 'postal_code', 'postal_code');
    }
}
