<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Services\TwilioVideoService;
use Illuminate\Http\Request;

class AppointmentOnlineController extends Controller
{
    public function __construct(private readonly TwilioVideoService $twilio)
    {
    }

    public function token(Request $request, Appointment $appointment)
    {
        $user = $request->user();
        $role = $request->query('role', $user->hasRole('doctor') ? 'doctor' : 'patient');

        $isDoctor = $user->doctor && $appointment->doctor_id === $user->doctor->id;
        $isPatient = $user->patient && $appointment->patient_id === $user->patient->id;

        if (! $isDoctor && ! $isPatient) {
            abort(403);
        }

        if ($appointment->appointment_type !== 'online') {
            return response()->json(['success' => false, 'message' => 'Appointment is not online'], 422);
        }

        if ($appointment->status !== 'confirmed' || $appointment->areeba_payment_status !== 'paid') {
            return response()->json(['success' => false, 'message' => 'Appointment not ready for online session'], 422);
        }

        if (! $appointment->twilio_room_sid) {
            $room = $this->twilio->createRoom($appointment);
            $appointment->twilio_room_sid = $room['sid'] ?? null;
            $appointment->online_meeting_url = $room['url'] ?? null;
            $appointment->save();
        }

        try {
            $token = $this->twilio->generateAccessToken($user, $appointment, $role);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to generate Twilio token: '.$e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'room_sid' => $appointment->twilio_room_sid,
                'meeting_url' => $appointment->online_meeting_url,
                'token' => $token,
            ],
        ]);
    }
}
