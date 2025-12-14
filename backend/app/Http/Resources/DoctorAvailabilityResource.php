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
            'day_of_week' => $this->day_of_week,
            'start_time' => $this->start_time,
            'slot_capacity' => $this->slot_capacity,
            'fee_amount' => $this->fee_amount,
            // compatibility: compute an end_time (+1h) for consumers that still expect it
            'end_time' => $this->computeEndTime(),
        ];
    }

    private function computeEndTime(): ?string
    {
        $start = $this->start_time;
        try {
            if ($start instanceof \Carbon\CarbonInterface) {
                return $start->copy()->addHour()->format('H:i');
            }
            if (is_string($start) && $start !== '') {
                $parsed = \Carbon\Carbon::createFromFormat('H:i:s', $start) ?: \Carbon\Carbon::createFromFormat('H:i', $start);
                if ($parsed) {
                    return $parsed->addHour()->format('H:i');
                }
            }
        } catch (\Throwable $e) {
            return null;
        }

        return null;
    }
}
