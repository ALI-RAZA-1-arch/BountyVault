import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"
import { Severity, ReportStatus, BountyStatus } from "../types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  try { return format(new Date(dateStr), 'MMM d, yyyy') } catch { return dateStr }
}

export function formatRelativeDate(dateStr?: string) {
  if (!dateStr) return '-'
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }) } catch { return dateStr }
}

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'Critical': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
    case 'High': return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
    case 'Medium': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
    case 'Low': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
    case 'Informative': return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
    default: return 'bg-gray-500/10 text-gray-500'
  }
}

export function getStatusColor(status: ReportStatus): string {
  switch (status) {
    case 'Draft': return 'bg-gray-500/10 text-gray-500'
    case 'Ready to Submit': return 'bg-blue-500/10 text-blue-500'
    case 'Pending': return 'bg-amber-500/10 text-amber-500'
    case 'Submitted': return 'bg-purple-500/10 text-purple-500'
    case 'Triaged': return 'bg-indigo-500/10 text-indigo-500'
    case 'Accepted': return 'bg-green-500/10 text-green-500'
    case 'Resolved': return 'bg-emerald-500/10 text-emerald-500'
    case 'Rejected': return 'bg-red-500/10 text-red-500'
    case 'Duplicate': return 'bg-orange-500/10 text-orange-500'
    case 'Informative': return 'bg-gray-500/10 text-gray-500'
    case 'Closed': return 'bg-gray-500/10 text-gray-500'
    default: return 'bg-gray-500/10 text-gray-500'
  }
}

export function getBountyStatusColor(status: BountyStatus): string {
  switch (status) {
    case 'None': return 'bg-gray-500/10 text-gray-500'
    case 'Pending': return 'bg-yellow-500/10 text-yellow-500'
    case 'Awarded': return 'bg-green-500/10 text-green-500'
    case 'Paid': return 'bg-emerald-500/10 text-emerald-500'
    case 'Cancelled': return 'bg-red-500/10 text-red-500'
    default: return 'bg-gray-500/10 text-gray-500'
  }
}

export function truncate(str: string | undefined, length: number) {
  if (!str) return ''
  return str.length > length ? str.substring(0, length) + '...' : str
}
