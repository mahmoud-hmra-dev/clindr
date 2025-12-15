<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class DoctorAvailabilityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'doctor_id' => $this->doctor_id,
            'clinic_id' => $this->clinic_id,
            'date' => optional($this->date)->format('Y-m-d'),
            'start_time' => $this->formatTime($this->start_time),
            'end_time' => $this->formatTime($this->end_time),
            'availability_type' => $this->availability_type,
            'clinic' => $this->when(
                $this->availability_type === 'clinic' || $this->clinic,
                function () {
                    if (! $this->clinic) {
                        return null;
                    }

                    return [
                        'id' => $this->clinic->id,
                        'name' => $this->clinic->name,
                    ];
                }
            ),
            'status' => $this->status,
            'day_of_week' => $this->day_of_week,
            'slot_capacity' => $this->slot_capacity,
            'fee_amount' => $this->fee_amount,
        ];
    }

    private function formatTime($value): ?string
    {
        $time = $value;
        try {
            if ($time instanceof \Carbon\CarbonInterface) {
                return $time->format('H:i:s');
            }
            if (is_string($time) && $time !== '') {
                $parsed = \Carbon\Carbon::createFromFormat('H:i:s', $time)
                    ?: \Carbon\Carbon::createFromFormat('H:i', $time);

                return $parsed?->format('H:i:s');
            }
        } catch (\Throwable $e) {
            return null;
        }

        return null;
    }
}
