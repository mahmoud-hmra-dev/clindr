<?php

namespace App\Http\Controllers\API\Patient;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Events\MessageSent;

class ChatController extends Controller
{
    public function conversations(Request $request)
    {
        $patient = $request->user()->patient;
        abort_unless($patient, 403);

        $conversations = Conversation::with(['doctor.user'])
            ->where('patient_id', $patient->id)
            ->orderByDesc('last_message_at')
            ->get();

        return response()->json(['success' => true, 'data' => $conversations]);
    }

    public function messages(Request $request, Conversation $conversation)
    {
        $patient = $request->user()->patient;
        abort_unless($patient && $conversation->patient_id === $patient->id, 403);

        $messages = $conversation->messages()->with('sender')->orderBy('sent_at', 'asc')->get();

        return response()->json(['success' => true, 'data' => $messages]);
    }

    public function send(Request $request)
    {
        $patient = $request->user()->patient;
        abort_unless($patient, 403);

        $validated = $request->validate([
            'conversation_id' => 'nullable|exists:conversations,id',
            'doctor_id' => 'nullable|exists:doctors,id',
            'body' => 'nullable|string',
            'message_type' => 'nullable|string|in:text,file,image,audio',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png,webp,gif,mp3,ogg,wav|max:10240',
        ]);

        $conversation = null;
        if (!empty($validated['conversation_id'])) {
            $conversation = Conversation::where('id', $validated['conversation_id'])
                ->where('patient_id', $patient->id)->firstOrFail();
        } elseif (!empty($validated['doctor_id'])) {
            $doctor = Doctor::findOrFail($validated['doctor_id']);
            $conversation = DB::transaction(function () use ($doctor, $patient) {
                return Conversation::firstOrCreate(
                    ['doctor_id' => $doctor->id, 'patient_id' => $patient->id],
                    ['last_message_at' => now()]
                );
            });
        } else {
            abort(422, 'doctor_id or conversation_id is required');
        }

        $message = null;
        DB::transaction(function () use (&$message, $conversation, $request) {
            $attachmentUrl = null;
            if ($request->hasFile('attachment')) {
                $stored = $request->file('attachment')->store('chat', 'public');
                $attachmentUrl = $stored ? asset('storage/'.$stored) : null;
            }

            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $request->user()->id,
                'body' => $request->input('body'),
                'message_type' => $request->input('message_type', $attachmentUrl ? 'file' : 'text'),
                'attachment_url' => $attachmentUrl,
                'sent_at' => now(),
                'status' => 'sent',
            ]);
            $conversation->update([
                'last_message_at' => $message->sent_at,
                'unread_doctor' => true,
                'unread_patient' => false,
            ]);
        });

        broadcast(new MessageSent($message))->toOthers();

        return response()->json(['success' => true, 'data' => $message], 201);
    }
}
