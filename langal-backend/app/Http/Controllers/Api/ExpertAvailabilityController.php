<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expert;
use App\Models\ExpertAvailability;
use App\Models\ExpertUnavailableDate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ExpertAvailabilityController extends Controller
{
    /**
     * Get expert's availability schedule
     * GET /api/experts/{expertId}/availability
     */
    public function index(int $expertId): JsonResponse
    {
        try {
            $availability = ExpertAvailability::where('expert_id', $expertId)
                ->where('is_active', true)
                ->orderBy('day_of_week')
                ->orderBy('start_time')
                ->get();

            $unavailableDates = ExpertUnavailableDate::where('expert_id', $expertId)
                ->where('unavailable_date', '>=', now()->toDateString())
                ->orderBy('unavailable_date')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'availability' => $availability,
                    'unavailable_dates' => $unavailableDates,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch availability',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Set/Update expert's availability
     * POST /api/expert/availability
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'schedules' => 'required|array|min:1',
            'schedules.*.day_of_week' => 'required|integer|min:0|max:6',
            'schedules.*.start_time' => 'required|date_format:H:i',
            'schedules.*.end_time' => 'required|date_format:H:i|after:schedules.*.start_time',
            'schedules.*.slot_duration_minutes' => 'nullable|integer|min:15|max:120',
            'schedules.*.max_appointments_per_slot' => 'nullable|integer|min:1|max:5',
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
            $expertId = $user->user_id;

            // Delete existing availability
            ExpertAvailability::where('expert_id', $expertId)->delete();

            $schedules = [];
            foreach ($request->schedules as $schedule) {
                $schedules[] = ExpertAvailability::create([
                    'expert_id' => $expertId,
                    'day_of_week' => $schedule['day_of_week'],
                    'start_time' => $schedule['start_time'],
                    'end_time' => $schedule['end_time'],
                    'slot_duration_minutes' => $schedule['slot_duration_minutes'] ?? 30,
                    'max_appointments_per_slot' => $schedule['max_appointments_per_slot'] ?? 1,
                    'is_active' => true,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Availability updated successfully',
                'message_bn' => 'সময়সূচী সফলভাবে আপডেট হয়েছে',
                'data' => $schedules,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update availability',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete specific availability slot
     * DELETE /api/expert/availability/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $user = Auth::user();
            
            $availability = ExpertAvailability::where('availability_id', $id)
                ->where('expert_id', $user->user_id)
                ->first();

            if (!$availability) {
                return response()->json([
                    'success' => false,
                    'message' => 'Availability slot not found',
                ], 404);
            }

            $availability->delete();

            return response()->json([
                'success' => true,
                'message' => 'Availability slot deleted',
                'message_bn' => 'সময়সূচী মুছে ফেলা হয়েছে',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete availability',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Add unavailable date
     * POST /api/expert/unavailable-dates
     */
    public function addUnavailableDate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'unavailable_date' => 'required|date|after_or_equal:today',
            'reason' => 'nullable|string|max:255',
            'reason_bn' => 'nullable|string|max:255',
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

            $unavailableDate = ExpertUnavailableDate::create([
                'expert_id' => $user->user_id,
                'unavailable_date' => $request->unavailable_date,
                'reason' => $request->reason,
                'reason_bn' => $request->reason_bn,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Unavailable date added',
                'message_bn' => 'ছুটির দিন যোগ করা হয়েছে',
                'data' => $unavailableDate,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add unavailable date',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove unavailable date
     * DELETE /api/expert/unavailable-dates/{id}
     */
    public function removeUnavailableDate(int $id): JsonResponse
    {
        try {
            $user = Auth::user();

            $unavailableDate = ExpertUnavailableDate::where('id', $id)
                ->where('expert_id', $user->user_id)
                ->first();

            if (!$unavailableDate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unavailable date not found',
                ], 404);
            }

            $unavailableDate->delete();

            return response()->json([
                'success' => true,
                'message' => 'Unavailable date removed',
                'message_bn' => 'ছুটির দিন মুছে ফেলা হয়েছে',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove unavailable date',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available time slots for a specific date
     * GET /api/experts/{expertId}/slots?date=2026-01-10
     */
    public function getAvailableSlots(Request $request, int $expertId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date|after_or_equal:today',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $date = Carbon::parse($request->date);
            $dayOfWeek = $date->dayOfWeek;

            // Check if expert has marked this date as unavailable
            $isUnavailable = ExpertUnavailableDate::where('expert_id', $expertId)
                ->where('unavailable_date', $date->toDateString())
                ->exists();

            if ($isUnavailable) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'date' => $date->toDateString(),
                        'is_available' => false,
                        'message' => 'Expert is not available on this date',
                        'message_bn' => 'বিশেষজ্ঞ এই দিনে পাওয়া যাবে না',
                        'slots' => [],
                    ],
                ]);
            }

            // Get availability for this day
            $availability = ExpertAvailability::where('expert_id', $expertId)
                ->where('day_of_week', $dayOfWeek)
                ->where('is_active', true)
                ->get();

            if ($availability->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'date' => $date->toDateString(),
                        'is_available' => false,
                        'message' => 'Expert has no availability on this day',
                        'message_bn' => 'বিশেষজ্ঞ এই দিনে কাজ করেন না',
                        'slots' => [],
                    ],
                ]);
            }

            // Generate time slots
            $slots = [];
            foreach ($availability as $avail) {
                $startTime = Carbon::parse($date->toDateString() . ' ' . $avail->start_time);
                $endTime = Carbon::parse($date->toDateString() . ' ' . $avail->end_time);
                $slotDuration = $avail->slot_duration_minutes;

                while ($startTime->addMinutes($slotDuration)->lte($endTime)) {
                    $slotStart = $startTime->copy()->subMinutes($slotDuration);
                    $slotEnd = $startTime->copy();

                    // Check if slot is already booked
                    $bookedCount = \App\Models\ConsultationAppointment::where('expert_id', $expertId)
                        ->where('appointment_date', $date->toDateString())
                        ->where('start_time', $slotStart->format('H:i:s'))
                        ->whereIn('status', ['pending', 'confirmed'])
                        ->count();

                    $isSlotAvailable = $bookedCount < $avail->max_appointments_per_slot;

                    // Skip past slots for today
                    if ($date->isToday() && $slotStart->lt(now())) {
                        continue;
                    }

                    $slots[] = [
                        'start_time' => $slotStart->format('H:i'),
                        'end_time' => $slotEnd->format('H:i'),
                        'is_available' => $isSlotAvailable,
                        'booked_count' => $bookedCount,
                        'max_capacity' => $avail->max_appointments_per_slot,
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'date' => $date->toDateString(),
                    'day_name' => $date->format('l'),
                    'day_name_bn' => $this->getBanglaDay($dayOfWeek),
                    'is_available' => count($slots) > 0,
                    'slots' => $slots,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available slots',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get Bangla day name
     */
    private function getBanglaDay(int $dayOfWeek): string
    {
        $days = [
            0 => 'রবিবার',
            1 => 'সোমবার',
            2 => 'মঙ্গলবার',
            3 => 'বুধবার',
            4 => 'বৃহস্পতিবার',
            5 => 'শুক্রবার',
            6 => 'শনিবার',
        ];
        return $days[$dayOfWeek] ?? '';
    }
}
