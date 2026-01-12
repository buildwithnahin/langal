<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataOperatorNotification extends Model
{
    protected $table = 'data_operator_notifications';
    protected $primaryKey = 'notification_id';

    protected $fillable = [
        'recipient_id',
        'sender_id',
        'notification_type',
        'title',
        'message',
        'related_entity_type',
        'related_entity_id',
        'is_read',
        'read_at',
        'priority',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the recipient (data operator)
     */
    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id', 'user_id');
    }

    /**
     * Get the sender (user who triggered notification)
     */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id', 'user_id');
    }

    /**
     * Scope: Unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope: By recipient
     */
    public function scopeForRecipient($query, $userId)
    {
        return $query->where('recipient_id', $userId);
    }

    /**
     * Scope: By type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('notification_type', $type);
    }

    /**
     * Mark as read
     */
    public function markAsRead()
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }
}
