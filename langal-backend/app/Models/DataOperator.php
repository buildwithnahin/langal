<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DataOperator extends Model
{
    use HasFactory;

    protected $table = 'data_operators';
    protected $primaryKey = 'data_operator_id';

    // Disable updated_at since table only has created_at
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    /**
     * Relationship with User
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
