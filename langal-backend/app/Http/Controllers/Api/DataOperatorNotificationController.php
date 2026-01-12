<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DataOperatorNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DataOperatorNotificationController extends Controller
{
    protected $notificationService;

    public function __construct(DataOperatorNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get all notifications for the authenticated data operator
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Verify user is data operator
            if ($user->user_type !== 'data_operator') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                    'message_bn' => 'অনুমোদিত নয়',
                ], 403);
            }

            $limit = $request->get('limit', 20);
            $offset = $request->get('offset', 0);

            $notifications = $this->notificationService->getNotifications(
                $user->user_id,
                $limit,
                $offset
            );

            $unreadCount = $this->notificationService->getUnreadCount($user->user_id);

            return response()->json([
                'success' => true,
                'data' => [
                    'notifications' => $notifications,
                    'unread_count' => $unreadCount,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications',
                'message_bn' => 'নোটিফিকেশন লোড করতে ব্যর্থ',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get unread notification count
     */
    public function unreadCount()
    {
        try {
            $user = Auth::user();
            
            if ($user->user_type !== 'data_operator') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $count = $this->notificationService->getUnreadCount($user->user_id);

            return response()->json([
                'success' => true,
                'data' => [
                    'unread_count' => $count,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get unread count',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            if ($user->user_type !== 'data_operator') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $result = $this->notificationService->markAsRead($id);

            return response()->json([
                'success' => $result,
                'message' => $result ? 'Marked as read' : 'Notification not found',
                'message_bn' => $result ? 'পঠিত হিসেবে চিহ্নিত' : 'নোটিফিকেশন পাওয়া যায়নি',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark as read',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead()
    {
        try {
            $user = Auth::user();
            
            if ($user->user_type !== 'data_operator') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $count = $this->notificationService->markAllAsRead($user->user_id);

            return response()->json([
                'success' => true,
                'message' => 'All marked as read',
                'message_bn' => 'সব পঠিত হিসেবে চিহ্নিত',
                'data' => [
                    'marked_count' => $count,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all as read',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
