<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $account = $request->user('sanctum');
        $canView = fn (string $area): bool => $this->canView($account, $area);

        $queries = [];
        $counts = [
            'invoiceCount' => ['Invoices', 'invoices'],
            'projectCount' => ['Projects', 'projects'],
            'clientCount' => ['Clients', 'clients'],
            'bookingCount' => ['Booking Orders', 'bookings'],
            'officeOrderCount' => ['Office Orders', 'orders'],
        ];

        foreach ($counts as $key => [$area, $table]) {
            if (! $canView($area)) {
                continue;
            }

            $queries[] = DB::table($table)->selectRaw(
                '? as kind, COUNT(*) as total, CAST(NULL AS VARCHAR) as type, CAST(NULL AS VARCHAR) as description, CAST(NULL AS VARCHAR) as due_date, CAST(NULL AS VARCHAR) as status, CAST(NULL AS INTEGER) as progress',
                [$key]
            );
        }

        $deadlineQueries = [
            ['Invoices', DB::table('invoices')
                ->selectRaw("'deadline' as kind, 0 as total, 'Invoice' as type, invoice_id || ' payment' as description, CAST(invoice_due_date AS VARCHAR) as due_date, CAST(invoice_status AS VARCHAR) as status, CAST(NULL AS INTEGER) as progress")
                ->whereNotNull('invoice_due_date')],
            ['Projects', DB::table('projects')
                ->selectRaw("'deadline' as kind, 0 as total, 'Project' as type, project_name || ' deadline' as description, CAST(project_end_date AS VARCHAR) as due_date, CAST(NULL AS VARCHAR) as status, CAST(project_progress AS INTEGER) as progress")
                ->whereNotNull('project_end_date')],
            ['Booking Orders', DB::table('bookings')
                ->selectRaw("'deadline' as kind, 0 as total, 'Booking' as type, booking_id || ' appointment' as description, CAST(booking_date AS VARCHAR) as due_date, CAST(NULL AS VARCHAR) as status, CAST(NULL AS INTEGER) as progress")],
            ['Office Orders', DB::table('orders')
                ->selectRaw("'deadline' as kind, 0 as total, 'Office order' as type, order_id || ' due' as description, CAST(order_date AS VARCHAR) as due_date, CAST(NULL AS VARCHAR) as status, CAST(NULL AS INTEGER) as progress")],
            ['Workers', DB::table('workers')
                ->selectRaw("'deadline' as kind, 0 as total, 'Contract' as type, worker_name || ' contract' as description, CAST(worker_contact_end_date AS VARCHAR) as due_date, CAST(NULL AS VARCHAR) as status, CAST(NULL AS INTEGER) as progress")
                ->whereNotNull('worker_contact_end_date')],
        ];

        foreach ($deadlineQueries as [$area, $query]) {
            if (! $canView($area)) {
                continue;
            }

            $queries[] = $query;
        }

        $summary = [
            'invoiceCount' => 0,
            'projectCount' => 0,
            'clientCount' => 0,
            'bookingCount' => 0,
            'officeOrderCount' => 0,
            'deadlines' => [],
        ];

        if ($queries !== []) {
            $query = array_shift($queries);
            foreach ($queries as $nextQuery) {
                $query->unionAll($nextQuery);
            }

            foreach ($query->get() as $row) {
                if ($row->kind === 'deadline') {
                    $summary['deadlines'][] = [
                        'type' => $row->type,
                        'description' => $row->description,
                        'date' => $row->due_date,
                        'status' => $row->status,
                        'progress' => $row->progress,
                    ];

                    continue;
                }

                $summary[$row->kind] = (int) $row->total;
            }
        }

        return response()->json(['success' => true, 'data' => $summary]);
    }

    private function canView($account, string $area): bool
    {
        if ($account instanceof Admin) {
            return true;
        }

        $permissions = $account?->permissions ?? [];

        if (is_array($permissions) && array_is_list($permissions)) {
            return in_array('*', $permissions, true) || in_array($area, $permissions, true);
        }

        $level = is_array($permissions) ? ($permissions[$area] ?? 'None') : 'None';

        return in_array($level, ['View', 'Edit', 'Both'], true);
    }
}
