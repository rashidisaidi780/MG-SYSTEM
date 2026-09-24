<?php

namespace App\Http\Controllers;

use App\Models\UserNotification;
use App\Models\Admin;
use App\Models\User;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $owner = $request->user('sanctum');
        $query = UserNotification::query()
            ->where('recipient_type', get_class($owner))
            ->where('recipient_id', $owner->getKey())
            ->latest();

        if ($request->has('read')) {
            $request->boolean('read')
                ? $query->whereNotNull('read_at')
                : $query->whereNull('read_at');
        }

        return response()->json([
            'success' => true,
            'data' => $query->get()->map(fn (UserNotification $notification) => $this->format($notification)),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|in:info,warning,error,success',
            'actionUrl' => 'nullable|string|max:255',
            'relatedEntity' => 'nullable|string|max:255',
        ]);
        $owner = $request->user('sanctum');

        $attributes = [
            'title' => $validated['title'],
            'message' => $validated['message'],
            'type' => $validated['type'],
            'action_url' => $validated['actionUrl'] ?? null,
            'related_entity' => $validated['relatedEntity'] ?? null,
        ];
        $notification = null;

        foreach (Admin::query()->select('id')->get()->concat(User::query()->select('id')->get()) as $recipient) {
            $created = UserNotification::create([
                ...$attributes,
                'recipient_type' => get_class($recipient),
                'recipient_id' => $recipient->getKey(),
            ]);
            if (get_class($recipient) === get_class($owner) && $recipient->getKey() === $owner->getKey()) {
                $notification = $created;
            }
        }

        return response()->json(['success' => true, 'data' => $this->format($notification)], 201);
    }

    public function update(Request $request, UserNotification $notification)
    {
        $notification = $this->owned($request, $notification);
        if (!$notification) return response()->json(['message' => 'Notification not found'], 404);

        $validated = $request->validate(['read' => 'required|boolean']);
        $notification->update(['read_at' => $validated['read'] ? now() : null]);

        return response()->json(['success' => true, 'data' => $this->format($notification->fresh())]);
    }

    public function markAllRead(Request $request)
    {
        $this->ownedQuery($request)->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, UserNotification $notification)
    {
        $notification = $this->owned($request, $notification);
        if (!$notification) return response()->json(['message' => 'Notification not found'], 404);
        $notification->delete();
        return response()->json(['success' => true]);
    }

    public function destroyAll(Request $request)
    {
        $this->ownedQuery($request)->delete();
        return response()->json(['success' => true]);
    }

    public function unreadCount(Request $request)
    {
        return response()->json(['count' => $this->ownedQuery($request)->whereNull('read_at')->count()]);
    }

    private function ownedQuery(Request $request)
    {
        $owner = $request->user('sanctum');
        return UserNotification::where('recipient_type', get_class($owner))->where('recipient_id', $owner->getKey());
    }

    private function owned(Request $request, UserNotification $notification): ?UserNotification
    {
        return $this->ownedQuery($request)->whereKey($notification->getKey())->first();
    }

    private function format(UserNotification $notification): array
    {
        return [
            'id' => (string) $notification->id,
            'title' => $notification->title,
            'message' => $notification->message,
            'type' => $notification->type,
            'read' => $notification->read_at !== null,
            'actionUrl' => $notification->action_url,
            'relatedEntity' => $notification->related_entity,
            'timestamp' => $notification->created_at?->toISOString(),
        ];
    }
}
