<?php

namespace App\Http\Controllers\API\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Events\MessageSent;

class ChatController extends Controller
{
    public function conversations(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $conversations = Conversation::with(['patient.user'])
            ->where('doctor_id', $doctor->id)
            ->orderByDesc('last_message_at')
            ->get();

        return response()->json(['success' => true, 'data' => $conversations]);
    }

    public function messages(Request $request, Conversation $conversation)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor && $conversation->doctor_id === $doctor->id, 403);

        $messages = $conversation->messages()->with('sender')->orderBy('sent_at', 'asc')->get();

        return response()->json(['success' => true, 'data' => $messages]);
    }

    public function send(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $validated = $request->validate([
            'conversation_id' => 'required|exists:conversations,id',
            'body' => 'nullable|string',
            'message_type' => 'nullable|string|in:text,file,image,audio',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png,webp,gif,mp3,ogg,wav|max:10240',
        ]);

        $conversation = Conversation::where('id', $validated['conversation_id'])
            ->where('doctor_id', $doctor->id)->firstOrFail();

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
                'unread_patient' => true,
                'unread_doctor' => false,
            ]);
        });

        broadcast(new MessageSent($message))->toOthers();

        return response()->json(['success' => true, 'data' => $message], 201);
    }
}
