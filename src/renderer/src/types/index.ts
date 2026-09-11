export type ReportStatus = 'Draft' | 'Ready to Submit' | 'Pending' | 'Submitted' | 'Triaged' | 'Accepted' | 'Resolved' | 'Rejected' | 'Duplicate' | 'Informative' | 'Not Applicable' | 'Closed'
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informative'
export type BountyStatus = 'None' | 'Pending' | 'Awarded' | 'Paid' | 'Cancelled'
export type ProgramStatus = 'Active' | 'Paused' | 'Closed'
export type ResponseType = 'Acknowledgement' | 'Question' | 'Triaged' | 'Accepted' | 'Rejected' | 'Duplicate' | 'Informative' | 'Bounty' | 'Resolved' | 'Other'

export interface Company { id: number; name: string; website?: string; notes?: string; program_count?: number; report_count?: number; accepted_count?: number; total_bounty?: number; created_at: string; updated_at: string }
export interface Program { id: number; company_id: number; company_name?: string; platform_id?: number; platform_name?: string; name: string; website?: string; program_url?: string; type: string; scope?: string; out_of_scope?: string; rules?: string; notes?: string; status: ProgramStatus; start_date?: string; end_date?: string; report_count?: number; accepted_count?: number; total_bounty?: number; created_at: string; updated_at: string }
export interface Report { id: number; title: string; company_id?: number; company_name?: string; program_id?: number; program_name?: string; target?: string; vuln_type_id?: number; vuln_type_name?: string; severity: Severity; cvss?: string; url?: string; description?: string; impact?: string; steps?: string; source?: string; status: ReportStatus; platform_id?: number; platform_name?: string; external_id?: string; external_url?: string; date_discovered?: string; date_submitted?: string; notes?: string; is_duplicate: boolean; duplicate_of?: string; bounty_amount?: number; bounty_currency?: string; bounty_status?: BountyStatus; created_at: string; updated_at: string }
export interface ReportTimeline { id: number; report_id: number; event_type: string; description?: string; event_date: string; created_at: string }
export interface Response { id: number; report_id: number; report_title?: string; response_date: string; response_text?: string; response_type: ResponseType; notes?: string; created_at: string }
export interface Bounty { id: number; report_id: number; report_title?: string; company_id?: number; company_name?: string; amount: number; currency: string; status: BountyStatus; date_awarded?: string; date_paid?: string; payment_method?: string; platform?: string; reference_id?: string; notes?: string; created_at: string; updated_at: string }
export interface Attachment { id: number; report_id: number; filename: string; filepath: string; filetype?: string; filesize?: number; created_at: string }
export interface Note { id: number; report_id?: number; title?: string; content?: string; note_type: string; created_at: string; updated_at: string }
export interface Retest { id: number; report_id: number; retest_date: string; result: string; notes?: string; created_at: string }
export interface WorkflowDefinition { id: number; name: string; description?: string; category: string; inputs_json: string; steps_json: string; filename?: string; created_at: string; updated_at: string }
export interface WorkflowStep { name: string; command: string; description?: string; continue_on_error?: boolean }
export interface WorkflowInput { name: string; type: string; description?: string; required?: boolean }
export interface WorkflowRun { id: number; workflow_id: number; workflow_name: string; workflow_def_name?: string; target_input?: string; inputs_json: string; company_id?: number; program_id?: number; report_id?: number; status: string; started_at?: string; ended_at?: string; logs?: string; created_at: string }
export interface WorkflowOutput { id: number; run_id: number; filename: string; filepath: string; created_at: string }
export interface Platform { id: number; name: string; url?: string; created_at: string }
export interface VulnerabilityType { id: number; name: string; is_custom: boolean; created_at: string }
export interface DashboardStats { totalReports: number; accepted: number; submitted: number; resolved: number; duplicates: number; rejected: number; totalBounty: number; pendingBounty: number; companies: number; programs: number; recentReports: Report[]; recentRuns: WorkflowRun[]; statusBreakdown: { status: string; count: number }[]; bountyByMonth: { month: string; total: number }[] }
