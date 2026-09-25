<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    // Get all clients
    public function index()
    {
        $clients = Client::orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $clients
        ]);
    }

    // Create a client
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|string|max:255|unique:clients,client_id',
            'client_name' => 'required|string|max:255',
            'client_company' => 'nullable|string|max:255',
            'client_email' => 'nullable|email|max:255',
            'client_phone' => 'required|string|max:50',
            'client_address' => 'nullable|string',
            'client_otherphone' => 'nullable|string|max:50',
            'client_status' => 'nullable|string|max:50',
            'client_tin' => 'nullable|string|max:100',
            'client_country' => 'nullable|string|max:100',
            'client_date_added' => 'nullable|date',
        ]);

        $client = Client::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Client created successfully',
            'data' => $client
        ], 201);
    }

    // Get one client
    public function show($id)
    {
        $client = Client::find($id);

        if (!$client) {
            return response()->json([
                'success' => false,
                'message' => 'Client not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $client
        ]);
    }

    // Update client
    public function update(Request $request, $id)
    {
        $client = Client::find($id);

        if (!$client) {
            return response()->json([
                'success' => false,
                'message' => 'Client not found'
            ], 404);
        }

        $validated = $request->validate([
            'client_id' => 'sometimes|string|max:255|unique:clients,client_id,' . $id,
            'client_name' => 'required|string|max:255',
            'client_company' => 'nullable|string|max:255',
            'client_email' => 'nullable|email|max:255',
            'client_phone' => 'required|string|max:50',
            'client_address' => 'nullable|string',
            'client_otherphone' => 'nullable|string|max:50',
            'client_status' => 'nullable|string|max:50',
            'client_tin' => 'nullable|string|max:100',
            'client_country' => 'nullable|string|max:100',
            'client_date_added' => 'nullable|date',
        ]);

        $client->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Client updated successfully',
            'data' => $client
        ]);
    }

    // Delete client
    public function destroy($id)
    {
        $client = Client::find($id);

        if (!$client) {
            return response()->json([
                'success' => false,
                'message' => 'Client not found'
            ], 404);
        }

        $client->delete();

        return response()->json([
            'success' => true,
            'message' => 'Client deleted successfully'
        ]);
    }
}
