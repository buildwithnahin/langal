<?php

namespace App\Services;

use App\Models\DataOperatorNotification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class DataOperatorNotificationService
{
    /**
     * Send notification to all data operators
     */
    public function notifyAllDataOperators(
        string $type,
        string $title,
        string $message,
        ?int $senderId = null,
        ?string $relatedEntityType = null,
        ?string $relatedEntityId = null,
        string $priority = 'normal'
    ): int {
        try {
            // Get all active data operators
            $dataOperators = User::where('user_type', 'data_operator')
                ->where('is_active', true)
                ->get();

            $count = 0;
            foreach ($dataOperators as $operator) {
                DataOperatorNotification::create([
                    'recipient_id' => $operator->user_id,
                    'sender_id' => $senderId,
                    'notification_type' => $type,
                    'title' => $title,
                    'message' => $message,
                    'related_entity_type' => $relatedEntityType,
                    'related_entity_id' => $relatedEntityId,
                    'priority' => $priority,
                ]);
                $count++;
            }

            Log::info('Data operator notifications sent', [
                'type' => $type,
                'count' => $count,
            ]);

            return $count;
        } catch (\Exception $e) {
            Log::error('Failed to send data operator notifications', [
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Notify when a new farmer registers
     */
    public function notifyNewFarmerRegistration(User $farmer, array $farmerDetails = []): int
    {
        $farmerName = $farmerDetails['name'] ?? 'অজানা';
        $farmerPhone = $farmer->phone ?? '';
        
        return $this->notifyAllDataOperators(
            'new_farmer_registration',
            'নতুন কৃষক নিবন্ধন',
            "নতুন কৃষক নিবন্ধিত হয়েছেন: {$farmerName} ({$farmerPhone})",
            $farmer->user_id,
            'user',
            (string)$farmer->user_id,
            'normal'
        );
    }

    /**
     * Notify when a new expert registers
     */
    public function notifyNewExpertRegistration(User $expert, array $expertDetails = []): int
    {
        $expertName = $expertDetails['name'] ?? 'অজানা';
        $expertPhone = $expert->phone ?? '';
        
        return $this->notifyAllDataOperators(
            'new_expert_registration',
            'নতুন বিশেষজ্ঞ নিবন্ধন',
            "নতুন বিশেষজ্ঞ নিবন্ধিত হয়েছেন: {$expertName} ({$expertPhone})",
            $expert->user_id,
            'user',
            (string)$expert->user_id,
            'normal'
        );
    }

    /**
     * Notify when a new customer registers
     */
    public function notifyNewCustomerRegistration(User $customer, array $customerDetails = []): int
    {
        $customerName = $customerDetails['name'] ?? 'অজানা';
        $customerPhone = $customer->phone ?? '';
        
        return $this->notifyAllDataOperators(
            'new_customer_registration',
            'নতুন ক্রেতা নিবন্ধন',
            "নতুন ক্রেতা নিবন্ধিত হয়েছেন: {$customerName} ({$customerPhone})",
            $customer->user_id,
            'user',
            (string)$customer->user_id,
            'normal'
        );
    }

    /**
     * Notify when a post is reported
     */
    public function notifyPostReport(int $reporterId, int $postId, string $reason): int
    {
        return $this->notifyAllDataOperators(
            'post_report',
            'পোস্ট রিপোর্ট',
            "একটি পোস্ট রিপোর্ট করা হয়েছে। কারণ: {$reason}",
            $reporterId,
            'post_report',
            (string)$postId,
            'high'
        );
    }

    /**
     * Notify when a comment is reported
     */
    public function notifyCommentReport(int $reporterId, int $commentId, string $reason): int
    {
        return $this->notifyAllDataOperators(
            'comment_report',
            'মন্তব্য রিপোর্ট',
            "একটি মন্তব্য রিপোর্ট করা হয়েছে। কারণ: {$reason}",
            $reporterId,
            'comment_report',
            (string)$commentId,
            'high'
        );
    }

    /**
     * Get unread count for a data operator
     */
    public function getUnreadCount(int $userId): int
    {
        return DataOperatorNotification::forRecipient($userId)
            ->unread()
            ->count();
    }

    /**
     * Get notifications for a data operator
     */
    public function getNotifications(int $userId, int $limit = 20, int $offset = 0)
    {
        return DataOperatorNotification::forRecipient($userId)
            ->with('sender')
            ->orderBy('created_at', 'desc')
            ->skip($offset)
            ->take($limit)
            ->get();
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(int $notificationId): bool
    {
        $notification = DataOperatorNotification::find($notificationId);
        if ($notification) {
            $notification->markAsRead();
            return true;
        }
        return false;
    }

    /**
     * Mark all notifications as read for a user
     */
    public function markAllAsRead(int $userId): int
    {
        return DataOperatorNotification::forRecipient($userId)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }
}
