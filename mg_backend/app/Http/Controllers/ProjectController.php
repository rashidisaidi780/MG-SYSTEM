<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
   
    public function index()
    {
        $projects = Project::latest()->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Projects retrieved successfully.',
            'data' => $projects,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|integer|unique:projects,project_id',
            'project_name' => 'required|string|max:255',
            'client_id' => 'required|exists:clients,id',
            'project_budget' => 'required|numeric|min:0',
            'project_status' => 'required|string|max:50',
            'project_progress' => 'required|integer|min:0|max:100',
            'project_leader' => 'required|exists:users,id',
            'project_start_date' => 'required|date',
            'project_end_date' => 'nullable|date|after_or_equal:project_start_date',
            'project_details' => 'nullable|string',
        ]);

        $project = Project::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Project created successfully.',
            'data' => $project,
        ], 201);
    }

    public function show(Project $project)
    {
        return response()->json([
            'success' => true,
            'message' => 'Project retrieved successfully.',
            'data' => $project,
        ]);
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'project_id' => 'required|integer|unique:projects,project_id,' . $project->id,
            'project_name' => 'required|string|max:255',
            'client_id' => 'required|exists:clients,id',
            'project_budget' => 'required|numeric|min:0',
            'project_status' => 'required|string|max:50',
            'project_progress' => 'required|integer|min:0|max:100',
            'project_leader' => 'required|exists:users,id',
            'project_start_date' => 'required|date',
            'project_end_date' => 'nullable|date|after_or_equal:project_start_date',
            'project_details' => 'nullable|string',
        ]);

        $project->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Project updated successfully.',
            'data' => $project->fresh(),
        ]);
    }

    public function destroy(Project $project)
    {
        $project->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project deleted successfully.',
        ]);
    }
}