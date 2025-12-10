<?php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'doctor_id' => $this->doctor_id,
            'patient_id' => $this->patient_id,
            'appointment_type' => $this->appointment_type,
            'visit_type' => $this->visit_type,
            'scheduled_at' => optional($this->scheduled_at)->toIso8601String(),
            'duration_minutes' => $this->duration_minutes,
            'status' => $this->status,
            'reason' => $this->reason,
            'notes' => $this->notes,
            'clinic_location' => $this->clinic_location,
            'online_meeting_url' => $this->online_meeting_url,
            'twilio_room_sid' => $this->twilio_room_sid,
            'areeba_transaction_id' => $this->areeba_transaction_id,
            'areeba_payment_status' => $this->areeba_payment_status,
            'patient_email' => $this->patient_email,
            'patient_phone' => $this->patient_phone,
            'created_by' => $this->created_by,
            'cancelled_by' => $this->cancelled_by,
            'cancelled_reason' => $this->cancelled_reason,

            // 🔹 doctor info (لو محمَّل بـ with)
            'doctor' => $this->whenLoaded('doctor', function () {
                return [
                    'id' => $this->doctor->id,
                    'first_name' => $this->doctor->first_name,
                    'last_name' => $this->doctor->last_name,
                    'display_name' => $this->doctor->display_name,
                    'designation' => $this->doctor->designation,
                    'email' => $this->doctor->email,
                    'phone' => $this->doctor->phone,
                    'city' => $this->doctor->city,
                    'country' => $this->doctor->country,
                    'profile_image_path' => $this->doctor->profile_image_path,
                    'default_fee' => $this->doctor->default_fee,
                ];
            }),
                   'patient' => $this->whenLoaded('patient', function () {
                return [
                    'id' => $this->patient->id,
                    'first_name' => $this->patient->first_name,
                    'last_name' => $this->patient->last_name,
                    'phone' => $this->patient->phone,
                    'email' => $this->patient->email,
                    'user' => $this->patient->relationLoaded('user')
                        ? [
                            'id' => $this->patient->user->id,
                            'name' => $this->patient->user->name,
                            'email' => $this->patient->user->email,
                        ]
                        : null,
                ];
            }),

            // 🔹 booked invoice (السعر الفعلي)
            'invoice' => $this->whenLoaded('invoice', function () {
                return [
                    'id' => $this->invoice->id,
                    'amount' => $this->invoice->amount,
                    'currency' => $this->invoice->currency,
                    'status' => $this->invoice->status,
                ];
            }),
                    'prescriptions' => PrescriptionResource::collection(
                $this->whenLoaded('prescriptions')
            ),

            // 👇 الـ Medical Records المرتبطة بالحجز
            'medical_records' => MedicalRecordResource::collection(
                $this->whenLoaded('medicalRecords')
            ),
        ];
    }
}
