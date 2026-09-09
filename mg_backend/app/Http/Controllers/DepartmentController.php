<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Department;

class DepartmentController extends Controller
{
    // Get all departments
    public function index()
    {
        $departments = Department::orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $departments
        ]);
    }

    // Create department
    public function store(Request $request)
    {
        $validated = $request->validate([
            'department_id' => 'required|string|max:255|unique:departments,department_id',
            'department_name' => 'required|string|max:255',
            'number_of_people' => 'nullable|integer|min:0',
            'department_status' => 'nullable|string|max:50',
            'department_description' => 'nullable|string',
        ]);

        $department = Department::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Department created successfully',
            'data' => $department
        ], 201);
    }

    // Get single department
    public function show($id)
    {
        $department = Department::find($id);

        if (!$department) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $department
        ]);
    }

    // Update department
    public function update(Request $request, $id)
    {
        $department = Department::find($id);

        if (!$department) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }

        $validated = $request->validate([
            'department_id' => 'required|string|max:255|unique:departments,department_id,' . $id,
            'department_name' => 'required|string|max:255',
            'number_of_people' => 'nullable|integer|min:0',
            'department_status' => 'nullable|string|max:50',
            'department_description' => 'nullable|string',
        ]);

        $department->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Department updated successfully',
            'data' => $department
        ]);
    }

    // Delete department
    public function destroy($id)
    {
        $department = Department::find($id);

        if (!$department) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }

        $department->delete();

        return response()->json([
            'success' => true,
            'message' => 'Department deleted successfully'
        ]);
    }
}
