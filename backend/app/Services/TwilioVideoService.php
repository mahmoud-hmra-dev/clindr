<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Support\Str;
use Twilio\Jwt\AccessToken;
use Twilio\Jwt\Grants\VideoGrant;
use Twilio\Rest\Client;

class TwilioVideoService
{
    public function createRoom(Appointment $appointment): array
    {
        $accountSid = env('TWILIO_ACCOUNT_SID');
        $authToken = env('TWILIO_AUTH_TOKEN');
        $roomName = 'appointment-'.$appointment->id;

        if (! $accountSid || ! $authToken || ! class_exists(Client::class)) {
            // Fallback: simulate SID to allow downstream flows in non-configured environments
            return [
                'sid' => 'RM-'.Str::uuid(),
                'name' => $roomName,
                'url' => 'https://video.twilio.com/rooms/'.$roomName,
            ];
        }

        $client = new Client($accountSid, $authToken);

        $room = $client->video->v1->rooms->create([
            'uniqueName' => $roomName,
            'type' => 'group',
        ]);

        return [
            'sid' => $room->sid,
            'name' => $room->uniqueName ?? $roomName,
            'url' => 'https://video.twilio.com/rooms/'.$roomName,
        ];
    }

    public function generateAccessToken(User $user, Appointment $appointment, string $role = 'participant'): string
    {
        $apiKey = env('TWILIO_API_KEY');
        $apiSecret = env('TWILIO_API_SECRET');
        $accountSid = env('TWILIO_ACCOUNT_SID');
        $serviceSid = env('TWILIO_VIDEO_SERVICE_SID', $accountSid);

        if (! $apiKey || ! $apiSecret || ! $accountSid || ! class_exists(AccessToken::class) || ! class_exists(VideoGrant::class)) {
            throw new \RuntimeException('Twilio credentials or SDK are not configured.');
        }

        $identity = ($role ?: 'participant').'-user-'.$user->id;
        $token = new AccessToken($accountSid, $apiKey, $apiSecret, 3600, $identity);

        $grant = new VideoGrant();
        $grant->setRoom('appointment-'.$appointment->id);
        if ($serviceSid) {
            $grant->setRoom('appointment-'.$appointment->id);
        }
        $token->addGrant($grant);

        return $token->toJWT();
    }
}
