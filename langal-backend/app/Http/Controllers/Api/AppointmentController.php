<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsultationAppointment;
use App\Models\ConsultationCall;
use App\Models\Expert;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AppointmentController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * List appointments (for both farmer and expert)
     * GET /api/appointments
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $status = $request->query('status');
            $type = $request->query('type'); // 'upcoming', 'past', 'all'
            $perPage = $request->query('per_page', 10);

            $query = ConsultationAppointment::with(['farmer.profile', 'expert.profile', 'expertQualification']);

            // Filter by user type
            if ($user->user_type === 'farmer') {
                $query->where('farmer_id', $user->user_id);
            } elseif ($user->user_type === 'expert') {
                $query->where('expert_id', $user->user_id);
            }

            // Filter by status
            if ($status) {
                $query->where('status', $status);
            }

            // Filter by time
            if ($type === 'upcoming') {
                $query->where(function ($q) {
                    $q->where('appointment_date', '>', now()->toDateString())
                        ->orWhere(function ($q2) {
                            $q2->where('appointment_date', now()->toDateString())
                                ->where('start_time', '>=', now()->format('H:i:s'));
                        });
                })->whereIn('status', ['pending', 'confirmed']);
            } elseif ($type === 'past') {
                $query->where(function ($q) {
                    $q->where('appointment_date', '<', now()->toDateString())
                        ->orWhereIn('status', ['completed', 'cancelled', 'no_show']);
                });
            }

            $appointments = $query->orderBy('appointment_date', 'desc')
                ->orderBy('start_time', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $appointments,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch appointments',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create new appointment request
     * POST /api/appointments
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'expert_id' => 'required|integer|exists:users,user_id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'consultation_type' => 'required|in:audio_call,video_call,chat',
            'problem_description' => 'nullable|string|max:1000',
            'problem_description_bn' => 'nullable|string|max:1000',
            'crop_type' => 'nullable|string|max:100',
            'urgency_level' => 'nullable|integer|min:1|max:3',
            'farmer_notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();

            if ($user->user_type !== 'farmer') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only farmers can book appointments',
                ], 403);
            }

            // Calculate end time (30 minutes after start)
            $startTime = Carbon::parse($request->start_time);
            $endTime = $startTime->copy()->addMinutes(30);

            // Check if slot is available
            $existingAppointment = ConsultationAppointment::where('expert_id', $request->expert_id)
                ->where('appointment_date', $request->appointment_date)
                ->where('start_time', $startTime->format('H:i:s'))
                ->whereIn('status', ['pending', 'confirmed'])
                ->exists();

            if ($existingAppointment) {
                return response()->json([
                    'success' => false,
                    'message' => 'This time slot is already booked',
                    'message_bn' => 'এই সময়সূচী ইতিমধ্যে বুক করা হয়েছে',
                ], 409);
            }

            // Generate Agora channel name
            $agoraChannel = 'consultation_' . Str::uuid();

            $appointment = ConsultationAppointment::create([
                'farmer_id' => $user->user_id,
                'expert_id' => $request->expert_id,
                'appointment_date' => $request->appointment_date,
                'start_time' => $startTime->format('H:i:s'),
                'end_time' => $endTime->format('H:i:s'),
                'consultation_type' => $request->consultation_type,
                'status' => ConsultationAppointment::STATUS_PENDING,
                'problem_description' => $request->problem_description,
                'problem_description_bn' => $request->problem_description_bn,
                'crop_type' => $request->crop_type,
                'urgency_level' => $request->urgency_level ?? 1,
                'farmer_notes' => $request->farmer_notes,
                'agora_channel_name' => $agoraChannel,
            ]);

            // Load relationships
            $appointment->load(['farmer.profile', 'expert.profile', 'expertQualification']);

            // Send notification to expert
            $this->notificationService->sendToUser(
                $request->expert_id,
                'নতুন পরামর্শ অনুরোধ',
                'একজন কৃষক আপনার সাথে পরামর্শের জন্য অনুরোধ করেছেন',
                [
                    'type' => 'new_appointment',
                    'appointment_id' => $appointment->appointment_id,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Appointment request submitted successfully',
                'message_bn' => 'পরামর্শের অনুরোধ সফলভাবে জমা দেওয়া হয়েছে',
                'data' => $appointment,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get appointment details
     * GET /api/appointments/{id}
     */
    public function show(int $id): JsonResponse
    {
        try {
            $user = Auth::user();

            $appointment = ConsultationAppointment::with([
                'farmer.profile',
                'expert.profile',
                'expertQualification',
                'messages' => function ($query) {
                    $query->orderBy('sent_at', 'desc')->limit(5);
                },
                'prescription',
                'feedback',
            ])->findOrFail($id);

            // Check if user has access
            if ($user->user_id !== $appointment->farmer_id && $user->user_id !== $appointment->expert_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access',
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $appointment,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Appointment not found',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Approve appointment (Expert only)
     * PUT /api/appointments/{id}/approve
     */
    public function approve(int $id): JsonResponse
    {
        try {
            $user = Auth::user();

            $appointment = ConsultationAppointment::findOrFail($id);

            if ($user->user_id !== $appointment->expert_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only the assigned expert can approve',
                ], 403);
            }

            if ($appointment->status !== ConsultationAppointment::STATUS_PENDING) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending appointments can be approved',
                ], 400);
            }

            $appointment->update(['status' => ConsultationAppointment::STATUS_CONFIRMED]);

            // Send notification to farmer
            $this->notificationService->sendToUser(
                $appointment->farmer_id,
                'পরামর্শ নিশ্চিত হয়েছে',
                'আপনার পরামর্শের অনুরোধ নিশ্চিত করা হয়েছে',
                [
                    'type' => 'appointment_confirmed',
                    'appointment_id' => $appointment->appointment_id,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Appointment approved successfully',
                'message_bn' => 'পরামর্শ নিশ্চিত করা হয়েছে',
                'data' => $appointment->fresh()->load(['farmer.profile', 'expert.profile']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject appointment (Expert only)
     * PUT /api/appointments/{id}/reject
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'cancellation_reason' => 'nullable|string|max:500',
        ]);

        try {
            $user = Auth::user();

            $appointment = ConsultationAppointment::findOrFail($id);

            if ($user->user_id !== $appointment->expert_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only the assigned expert can reject',
                ], 403);
            }

            if ($appointment->status !== ConsultationAppointment::STATUS_PENDING) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending appointments can be rejected',
                ], 400);
            }

            $appointment->update([
                'status' => ConsultationAppointment::STATUS_CANCELLED,
                'cancellation_reason' => $request->cancellation_reason,
                'cancelled_by' => $user->user_id,
            ]);

            // Send notification to farmer
            $this->notificationService->sendToUser(
                $appointment->farmer_id,
                'পরামর্শ বাতিল হয়েছে',
                'দুঃখিত, বিশেষজ্ঞ আপনার অনুরোধ প্রত্যাখ্যান করেছেন',
                [
                    'type' => 'appointment_rejected',
                    'appointment_id' => $appointment->appointment_id,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Appointment rejected',
                'message_bn' => 'পরামর্শ বাতিল করা হয়েছে',
                'data' => $appointment,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reschedule appointment (Expert only)
     * PUT /api/appointments/{id}/reschedule
     */
    public function reschedule(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'new_date' => 'required|date|after_or_equal:today',
            'new_start_time' => 'required|date_format:H:i',
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();

            $appointment = ConsultationAppointment::findOrFail($id);

            if ($user->user_id !== $appointment->expert_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only the assigned expert can reschedule',
                ], 403);
            }

            $newStartTime = Carbon::parse($request->new_start_time);
            $newEndTime = $newStartTime->copy()->addMinutes(30);

            // Store original schedule
            $originalDate = $appointment->appointment_date;
            $originalTime = $appointment->start_time;

            $appointment->update([
                'appointment_date' => $request->new_date,
                'start_time' => $newStartTime->format('H:i:s'),
                'end_time' => $newEndTime->format('H:i:s'),
                'status' => ConsultationAppointment::STATUS_PENDING,
                'rescheduled_from' => $originalDate . ' ' . $originalTime,
                'expert_notes' => $request->reason,
            ]);

            // Send notification to farmer
            $this->notificationService->sendToUser(
                $appointment->farmer_id,
                'সময়সূচী পরিবর্তন',
                'বিশেষজ্ঞ নতুন সময় প্রস্তাব করেছেন',
                [
                    'type' => 'appointment_rescheduled',
                    'appointment_id' => $appointment->appointment_id,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Appointment rescheduled',
                'message_bn' => 'সময়সূচী পরিবর্তন করা হয়েছে',
                'data' => $appointment->fresh()->load(['farmer.profile', 'expert.profile']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reschedule appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel appointment (Both farmer and expert)
     * PUT /api/appointments/{id}/cancel
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'cancellation_reason' => 'nullable|string|max:500',
        ]);

        try {
            $user = Auth::user();

            $appointment = ConsultationAppointment::findOrFail($id);

            // Check if user has access
            if ($user->user_id !== $appointment->farmer_id && $user->user_id !== $appointment->expert_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access',
                ], 403);
            }

            if (in_array($appointment->status, [ConsultationAppointment::STATUS_COMPLETED, ConsultationAppointment::STATUS_CANCELLED])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot cancel this appointment',
                ], 400);
            }

            $appointment->update([
                'status' => ConsultationAppointment::STATUS_CANCELLED,
                'cancellation_reason' => $request->cancellation_reason,
                'cancelled_by' => $user->user_id,
            ]);

            // Send notification to other party
            $notifyUserId = $user->user_id === $appointment->farmer_id 
                ? $appointment->expert_id 
                : $appointment->farmer_id;

            $this->notificationService->sendToUser(
                $notifyUserId,
                'পরামর্শ বাতিল',
                'একটি পরামর্শ বাতিল করা হয়েছে',
                [
                    'type' => 'appointment_cancelled',
                    'appointment_id' => $appointment->appointment_id,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Appointment cancelled',
                'message_bn' => 'পরামর্শ বাতিল করা হয়েছে',
                'data' => $appointment,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark appointment as completed (Expert only)
     * PUT /api/appointments/{id}/complete
     */
    public function complete(int $id): JsonResponse
    {
        try {
            $user = Auth::user();

            $appointment = ConsultationAppointment::findOrFail($id);

            if ($user->user_id !== $appointment->expert_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only the expert can mark as complete',
                ], 403);
            }

            if ($appointment->status !== ConsultationAppointment::STATUS_CONFIRMED) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only confirmed appointments can be completed',
                ], 400);
            }

            $appointment->update(['status' => ConsultationAppointment::STATUS_COMPLETED]);

            // Update expert's total consultations
            Expert::where('user_id', $appointment->expert_id)
                ->increment('total_consultations');

            // Send notification to farmer for feedback
            $this->notificationService->sendToUser(
                $appointment->farmer_id,
                'পরামর্শ সম্পন্ন',
                'আপনার পরামর্শ সম্পন্ন হয়েছে। দয়া করে রেটিং দিন।',
                [
                    'type' => 'appointment_completed',
                    'appointment_id' => $appointment->appointment_id,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Appointment completed',
                'message_bn' => 'পরামর্শ সম্পন্ন হয়েছে',
                'data' => $appointment,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get today's appointments count
     * GET /api/appointments/today-count
     */
    public function todayCount(): JsonResponse
    {
        try {
            $user = Auth::user();

            $query = ConsultationAppointment::where('appointment_date', now()->toDateString());

            if ($user->user_type === 'farmer') {
                $query->where('farmer_id', $user->user_id);
            } else {
                $query->where('expert_id', $user->user_id);
            }

            $count = $query->whereIn('status', ['pending', 'confirmed'])->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'today_count' => $count,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get count',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
