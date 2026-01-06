<?php

namespace App\Services;

use App\Models\NotificationQueue;
use App\Models\NotificationToken;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    protected $fcmServerKey;
    protected $fcmUrl = 'https://fcm.googleapis.com/fcm/send';

    public function __construct()
    {
        $this->fcmServerKey = config('services.fcm.server_key');
    }

    /**
     * Send notification to a specific user
     * 
     * @param int $userId
     * @param string $title
     * @param string $body
     * @param array $data Additional data payload
     * @param string $priority 'normal' or 'high'
     * @return bool
     */
    public function sendToUser(
        int $userId,
        string $title,
        string $body,
        array $data = [],
        string $priority = 'normal'
    ): bool {
        try {
            // Get user's device tokens
            $tokens = NotificationToken::where('user_id', $userId)
                ->where('is_active', true)
                ->pluck('device_token')
                ->toArray();

            if (empty($tokens)) {
                // Queue notification for when user registers a token
                $this->queueNotification($userId, $title, $body, $data, $priority);
                return false;
            }

            // Send to FCM
            $result = $this->sendFcmNotification($tokens, $title, $body, $data, $priority);

            // Log notification
            $this->logNotification($userId, $title, $body, $data, $result);

            return $result;
        } catch (\Exception $e) {
            Log::error('Failed to send notification', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send notification to multiple users
     */
    public function sendToUsers(
        array $userIds,
        string $title,
        string $body,
        array $data = [],
        string $priority = 'normal'
    ): array {
        $results = [];
        
        foreach ($userIds as $userId) {
            $results[$userId] = $this->sendToUser($userId, $title, $body, $data, $priority);
        }

        return $results;
    }

    /**
     * Send notification to a topic
     */
    public function sendToTopic(
        string $topic,
        string $title,
        string $body,
        array $data = []
    ): bool {
        try {
            $payload = [
                'to' => '/topics/' . $topic,
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                    'sound' => 'default',
                ],
                'data' => $data,
            ];

            return $this->sendToFcm($payload);
        } catch (\Exception $e) {
            Log::error('Failed to send topic notification', [
                'topic' => $topic,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send FCM notification
     */
    private function sendFcmNotification(
        array $tokens,
        string $title,
        string $body,
        array $data,
        string $priority
    ): bool {
        if (empty($this->fcmServerKey)) {
            Log::warning('FCM server key not configured');
            return false;
        }

        $payload = [
            'registration_ids' => $tokens,
            'notification' => [
                'title' => $title,
                'body' => $body,
                'sound' => 'default',
                'badge' => 1,
                'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
            ],
            'data' => array_merge($data, [
                'title' => $title,
                'body' => $body,
                'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
            ]),
            'priority' => $priority,
            'content_available' => true,
        ];

        // For call notifications, add high priority settings
        if (isset($data['type']) && in_array($data['type'], ['incoming_call', 'call_ended'])) {
            $payload['priority'] = 'high';
            $payload['android'] = [
                'priority' => 'high',
                'notification' => [
                    'channel_id' => 'call_channel',
                    'sound' => 'ringtone',
                ],
            ];
        }

        return $this->sendToFcm($payload);
    }

    /**
     * Send payload to FCM
     */
    private function sendToFcm(array $payload): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->fcmServerKey,
                'Content-Type' => 'application/json',
            ])->post($this->fcmUrl, $payload);

            if ($response->successful()) {
                $result = $response->json();
                
                // Handle failed tokens
                if (isset($result['results'])) {
                    $this->handleFcmResults($payload['registration_ids'] ?? [], $result['results']);
                }

                return ($result['success'] ?? 0) > 0;
            }

            Log::error('FCM request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('FCM request exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Handle FCM response results
     */
    private function handleFcmResults(array $tokens, array $results): void
    {
        foreach ($results as $index => $result) {
            if (isset($result['error'])) {
                $token = $tokens[$index] ?? null;
                
                if ($token && in_array($result['error'], ['NotRegistered', 'InvalidRegistration'])) {
                    // Deactivate invalid token
                    NotificationToken::where('device_token', $token)
                        ->update(['is_active' => false]);
                }
            }
        }
    }

    /**
     * Queue notification for later delivery
     */
    private function queueNotification(
        int $userId,
        string $title,
        string $body,
        array $data,
        string $priority
    ): void {
        NotificationQueue::create([
            'user_id' => $userId,
            'title' => $title,
            'body' => $body,
            'data' => json_encode($data),
            'priority' => $priority,
            'status' => 'pending',
        ]);
    }

    /**
     * Log notification
     */
    private function logNotification(
        int $userId,
        string $title,
        string $body,
        array $data,
        bool $success
    ): void {
        // Store in notifications table for history
        \App\Models\User::find($userId)?->notifications()->create([
            'title' => $title,
            'message' => $body,
            'notification_type' => $data['type'] ?? 'general',
            'data' => json_encode($data),
            'is_read' => false,
        ]);
    }

    /**
     * Register device token
     */
    public function registerToken(int $userId, string $token, string $deviceType = 'android'): NotificationToken
    {
        // Deactivate existing tokens for this device
        NotificationToken::where('device_token', $token)->update(['is_active' => false]);

        // Create or update token
        return NotificationToken::updateOrCreate(
            ['user_id' => $userId, 'device_token' => $token],
            [
                'device_type' => $deviceType,
                'is_active' => true,
                'last_used_at' => now(),
            ]
        );
    }

    /**
     * Unregister device token
     */
    public function unregisterToken(string $token): bool
    {
        return NotificationToken::where('device_token', $token)
            ->update(['is_active' => false]) > 0;
    }

    /**
     * Process queued notifications
     * This should be called by a scheduled job
     */
    public function processQueue(): int
    {
        $processed = 0;
        
        $pendingNotifications = NotificationQueue::where('status', 'pending')
            ->where('retry_count', '<', 3)
            ->limit(100)
            ->get();

        foreach ($pendingNotifications as $notification) {
            $tokens = NotificationToken::where('user_id', $notification->user_id)
                ->where('is_active', true)
                ->pluck('device_token')
                ->toArray();

            if (!empty($tokens)) {
                $data = json_decode($notification->data, true) ?? [];
                $success = $this->sendFcmNotification(
                    $tokens,
                    $notification->title,
                    $notification->body,
                    $data,
                    $notification->priority
                );

                if ($success) {
                    $notification->update([
                        'status' => 'sent',
                        'sent_at' => now(),
                    ]);
                    $processed++;
                } else {
                    $notification->increment('retry_count');
                    if ($notification->retry_count >= 3) {
                        $notification->update(['status' => 'failed']);
                    }
                }
            }
        }

        return $processed;
    }

    /**
     * Send appointment reminder
     */
    public function sendAppointmentReminder(
        int $userId,
        int $appointmentId,
        string $expertName,
        string $time,
        int $minutesBefore = 30
    ): bool {
        $title = 'পরামর্শের রিমাইন্ডার';
        $body = "{$minutesBefore} মিনিট পরে {$expertName} এর সাথে আপনার পরামর্শ শুরু হবে";

        return $this->sendToUser($userId, $title, $body, [
            'type' => 'appointment_reminder',
            'appointment_id' => $appointmentId,
            'minutes_before' => $minutesBefore,
        ], 'high');
    }
}
