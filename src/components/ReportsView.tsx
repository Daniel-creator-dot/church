import React, { useState } from 'react';
import { 
  Member, 
  Visitor, 
  GivingRecord, 
  AttendanceRecord, 
  Department, 
  FinanceTransaction, 
  Role 
} from '../types';
import { downloadCsv } from '../utils/export';

interface ReportsViewProps {
  activeRole: Role;
  members: Member[];
  visitors: Visitor[];
  giving: GivingRecord[];
  attendance: AttendanceRecord[];
  departments: Department[];
  transactions: FinanceTransaction[];
  currentMemberId?: string;
  currencySymbol?: string;
  currencyCode?: string;
  formatCurrency?: (amount: number) => string;
}

// Function to print executive briefing content only
const printExecutiveBriefing = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printContent = element.innerHTML;
  const printWindow = window.open('', '', 'width=800,height=1000');
  
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Executive Briefing</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 20px;
              color: #000;
            }
            .border-2 {
              border: 2px solid #000;
              padding: 30px;
            }
            .text-center { text-align: center; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .space-y-8 > * + * { margin-top: 2rem; }
            .border-b { border-bottom: 1px solid #e2e8f0; }
            .pb-6 { padding-bottom: 1.5rem; }
            .text-2xl { font-size: 1.5rem; font-weight: 900; }
            .tracking-tight { letter-spacing: -0.025em; }
            .uppercase { text-transform: uppercase; }
            .text-slate-900 { color: #0f172a; }
            .text-[10px] { font-size: 0.625rem; }
            .text-slate-500 { color: #64748b; }
            .tracking-widest { letter-spacing: 0.1em; }
            .font-extrabold { font-weight: 800; }
            .pt-1 { padding-top: 0.25rem; }
            .text-slate-400 { color: #94a3b8; }
            .font-mono { font-family: monospace; }
            .text-xs { font-size: 0.75rem; }
            .font-bold { font-weight: 700; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
            .gap-4 { gap: 1rem; }
            .pt-4 { padding-top: 1rem; }
            .pb-1\.5 { padding-bottom: 0.375rem; }
            .border-slate-200 { border-color: #e2e8f0; }
            .text-slate-950 { color: #020617; }
            .text-\[\.F59E0B\] { color: #F59E0B; }
            .font-extrabold { font-weight: 800; }
            .text-sm { font-size: 0.875rem; }
            .text-slate-600 { color: #475569; }
            .text-slate-700 { color: #334155; }
            .text-slate-800 { color: #1e293b; }
            .text-lg { font-size: 1.125rem; }
            .font-semibold { font-weight: 600; }
            .mt-2 { margin-top: 0.5rem; }
            .whitespace-nowrap { white-space: nowrap; }
            .text-right { text-align: right; }
            .font-black { font-weight: 900; }
            .text-base { font-size: 1rem; }
            .italic { font-style: italic; }
            .text-justify { text-align: justify; }
            .leading-relaxed { line-height: 1.625; }
            .text-amber-600 { color: #d97706; }
            .mt-6 { margin-top: 1.5rem; }
            .flex { display: flex; }
            .justify-center { justify-content: center; }
            .gap-3 { gap: 0.75rem; }
            .bg-white { background: white; }
            .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
            .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
            .rounded-xl { border-radius: 0.75rem; }
            .font-bold { font-weight: 700; }
            .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
            .hover\:bg-amber-600:hover { background: #d97706; }
            .transition-all { transition: all 0.2s; }
            .duration-200 { transition-duration: 200ms; }
          </style>
        </head>
        <body>
          <div class="border-2">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
};

export default function ReportsView({
  activeRole,
  members,
  visitors,
  giving,
  attendance,
  departments,
  transactions,
  currentMemberId,
  currencySymbol = '$',
  currencyCode = 'USD',
  formatCurrency = (amount: number) => `${currencySymbol}${amount.toLocaleString()}`,
}: ReportsViewProps) {
  
  const [reportTab, setReportTab] = useState<'finance' | 'attendance' | 'departments' | 'visitors'>('finance');
  const [showExecutivePrintout, setShowExecutivePrintout] = useState(false);

  // Checks
  const isFinanceOfficerOrAdmin = ['Super Admin', 'Pastor', 'Church Administrator', 'Finance Officer'].includes(activeRole);

  // 1. FINANCIAL COMPUTATIONS
  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Breakdown by Category for pie/bar graph
  const financeCategories = [
    { category: 'Tithe', amount: transactions.filter(t => t.category === 'Tithe').reduce((sum, t) => sum + t.amount, 0) },
    { category: 'Offering', amount: transactions.filter(t => t.category === 'Offering').reduce((sum, t) => sum + t.amount, 0) },
    { category: 'Project Funds', amount: transactions.filter(t => t.category === 'Project Funds' || t.category === 'Project').reduce((sum, t) => sum + t.amount, 0) },
    { category: 'Welfare', amount: transactions.filter(t => t.category === 'Welfare' || t.category === 'Welfare Disbursements').reduce((sum, t) => sum + t.amount, 0) },
    { category: 'Seed Offering', amount: transactions.filter(t => t.category === 'Seed' || t.category === 'Seed Offering').reduce((sum, t) => sum + t.amount, 0) },
  ];
  const maxFinanceAmount = Math.max(...financeCategories.map(c => c.amount), 1);

  // 2. MEMBERSHIP & VISITOR STATISTICS
  const totalCongregationCount = members.length;
  const activeMembersCount = members.filter(m => m.membershipStatus === 'Active').length;
  const inactiveMembersCount = members.filter(m => m.membershipStatus === 'Inactive').length;

  const totalVisitorsCount = visitors.length;
  const convertedVisitorsCount = visitors.filter(v => v.status === 'Converted').length;
  const visitorConversionRate = totalVisitorsCount > 0 
    ? Math.round((convertedVisitorsCount / totalVisitorsCount) * 100) 
    : 0;

  // 3. ATTENDANCE ANALYTICS
  const averageAttendance = attendance.length > 0
    ? Math.round(attendance.reduce((sum, a) => sum + a.headcount, 0) / attendance.length)
    : 0;
  
  const peakAttendanceRecord = attendance.length > 0
    ? [...attendance].sort((a, b) => b.headcount - a.headcount)[0]
    : null;

  const exportGivingStatement = () => {
    downloadCsv(
      `giving-statement-${new Date().toISOString().split('T')[0]}.csv`,
      ['Date', 'Donor', 'Type', 'Amount', 'Payment Method', 'Receipt'],
      giving.map((g) => [g.date, g.donorName, g.type, String(g.amount), g.paymentMethod, g.receiptNumber])
    );
  };

  const exportAttendanceReport = () => {
    downloadCsv(
      `attendance-report-${new Date().toISOString().split('T')[0]}.csv`,
      ['Date', 'Service Type', 'Headcount', 'Notes'],
      attendance.map((a) => [a.date, a.serviceType, String(a.headcount), a.notes])
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Tab Switcher Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button 
            id="tab-rep-finance"
            onClick={() => setReportTab('finance')}
            className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 ${reportTab === 'finance' ? 'bg-white text-slate-800 border-b-2 border-amber-500 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <i className="bi bi-cash-coin text-amber-500 text-sm"></i> Finance Auditing
          </button>
          <button 
            id="tab-rep-attn"
            onClick={() => setReportTab('attendance')}
            className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 ${reportTab === 'attendance' ? 'bg-white text-slate-800 border-b-2 border-amber-500 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <i className="bi bi-graph-up text-blue-600 text-sm"></i> Attendance & Growth
          </button>
          <button 
            id="tab-rep-depts"
            onClick={() => setReportTab('departments')}
            className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 ${reportTab === 'departments' ? 'bg-white text-slate-800 border-b-2 border-amber-500 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <i className="bi bi-briefcase text-indigo-500 text-sm"></i> Departments Analysis
          </button>
          <button 
            id="tab-rep-visitors"
            onClick={() => setReportTab('visitors')}
            className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 ${reportTab === 'visitors' ? 'bg-white text-slate-800 border-b-2 border-amber-500 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <i className="bi bi-people text-slate-500 text-sm"></i> Visitor Conversions
          </button>
        </div>

        {isFinanceOfficerOrAdmin && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={exportGivingStatement}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1"
            >
              <i className="bi bi-download"></i> Giving CSV
            </button>
            <button
              type="button"
              onClick={exportAttendanceReport}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1"
            >
              <i className="bi bi-download"></i> Attendance CSV
            </button>
            <button 
              id="gen-exec-pdf-btn"
              onClick={() => setShowExecutivePrintout(true)}
              className="btn-primary text-xs flex items-center justify-center gap-1.5"
            >
              <i className="bi bi-printer text-amber-500 text-sm"></i> Print Executive Briefing
            </button>
          </div>
        )}
      </div>

      {/* VIEW PANEL: 1. FINANCE REPORT */}
      {reportTab === 'finance' && (
        <div className="space-y-6">
          
          {/* Executive Finances KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Total Church Income</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-500 rounded-xl border border-amber-200 flex items-center justify-center">
                  <i className="bi bi-graph-up-arrow text-xl"></i>
                </div>
                <span className="text-3xl font-black text-slate-800">{formatCurrency(totalIncome)}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Sum of Tithes, Offerings, Seeds & Project Contributions</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Administrative Expenses</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center justify-center">
                  <i className="bi bi-graph-down-arrow text-xl"></i>
                </div>
                <span className="text-3xl font-black text-slate-800">{formatCurrency(totalExpense)}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Welfare grants, utilities, repairs & general operations</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Operating net Balance</span>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${netBalance >= 0 ? 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-500 border-amber-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                  <i className="bi bi-activity text-xl"></i>
                </div>
                <span className="text-3xl font-black text-slate-800">{formatCurrency(netBalance)}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Total cash reserves available inside operations</p>
            </div>
          </div>

          {/* Graph Breakdown and Ledger Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Category distribution visualizer */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Revenue Stream Audits</h3>
                <p className="text-xs text-slate-500">Contributions itemized by corporate ledger category</p>
              </div>

              <div className="space-y-4 pt-2">
                {financeCategories.map(cat => {
                  const percent = maxFinanceAmount > 0 ? (cat.amount / maxFinanceAmount) * 100 : 0;
                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{cat.category}</span>
                        <span className="font-mono">{formatCurrency(cat.amount)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-xl overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-xl transition-all duration-1000" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Complete finance transactional history ledger logs */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Church Operational Ledger Statement</h3>
                <p className="text-xs text-slate-500">Live journal entries of cash inflows and outflows</p>
              </div>

              {isFinanceOfficerOrAdmin ? (
                <div className="overflow-x-auto">
                  <table className="table-elegant">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Incurred By</th>
                        <th className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(t => (
                        <tr key={t.id}>
                          <td className="whitespace-nowrap font-mono">{t.date}</td>
                          <td>
                            <span className={`badge ${
                              t.type === 'Income' ? 'badge-amber' : 'badge-rose'
                            }`}>
                              {t.category}
                            </span>
                          </td>
                          <td className="text-slate-500">{t.description}</td>
                          <td className="text-slate-700">{t.approvedBy}</td>
                          <td className="text-right font-bold text-slate-800">
                            <span className={t.type === 'Income' ? 'text-amber-500' : 'text-rose-500'}>
                              {t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                  <i className="bi bi-shield-exclamation text-amber-500 mr-1"></i> Restricted Access: Detailed financial statements are only visible to Pastor, Finance Officers, and administrators.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW PANEL: 2. ATTENDANCE & GROWTH REPORT */}
      {reportTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Congregant Growth Pool</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center justify-center">
                  <i className="bi bi-people text-amber-500 text-xl"></i>
                </div>
                <span className="text-3xl font-black text-slate-800">{totalCongregationCount}</span>
              </div>
              <p className="text-[10px] text-slate-500">Active and baptized registered members on file</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Average Service Headcount</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-500 rounded-xl border border-amber-200 flex items-center justify-center">
                  <i className="bi bi-graph-up-arrow text-xl"></i>
                </div>
                <span className="text-3xl font-black text-slate-800">{averageAttendance}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Mean headcount over past services on record</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Record Peak Headcount</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl border border-rose-200 flex items-center justify-center">
                  <i className="bi bi-clock-history text-xl"></i>
                </div>
                <span className="text-3xl font-black text-slate-800">{peakAttendanceRecord?.headcount || 0}</span>
              </div>
              <p className="text-[10px] text-slate-500">Recorded on {peakAttendanceRecord?.date || 'N/A'}</p>
            </div>
          </div>

          {/* Historical detailed list */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Consolidated Attendance audit</h3>
              <p className="text-xs text-slate-500">Timeline records of all gathered services</p>
            </div>

            <div className="overflow-x-auto">
              <table className="table-elegant">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Meeting Service Type</th>
                    <th>Log Remarks</th>
                    <th className="text-center">Workers Present</th>
                    <th className="text-right">Attendance Count</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(a => (
                    <tr key={a.id}>
                      <td className="font-bold text-slate-800 font-mono">{a.date}</td>
                      <td>
                        <span className="badge-amber text-[9px] uppercase font-bold">{a.serviceType}</span>
                      </td>
                      <td className="text-slate-500 max-w-xs truncate">"{a.notes}"</td>
                      <td className="text-center text-slate-700">{a.attendedMemberIds.length} Leaders</td>
                      <td className="text-right text-base font-black text-slate-800 font-mono">{a.headcount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW PANEL: 3. DEPARTMENTS REPORT */}
      {reportTab === 'departments' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Departmental Budgets & Workers Pool</h3>
            <p className="text-xs text-slate-500">Budget limitations, total expenditure, and staff allocation stats</p>
          </div>

          <div className="overflow-x-auto">
            <table className="table-elegant">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Assigned Leader</th>
                  <th className="text-center">Allocated Budget</th>
                  <th className="text-center">Recorded Expenditure</th>
                  <th className="text-center">Available Reserves</th>
                  <th className="text-right">Workers count</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(d => {
                  const balance = d.budget - d.spent;
                  return (
                    <tr key={d.id}>
                      <td className="font-bold text-slate-800 uppercase tracking-wider">{d.name}</td>
                      <td className="text-amber-600 font-semibold">{d.leaderName || 'Vacant'}</td>
                      <td className="text-center font-mono">{formatCurrency(d.budget)}</td>
                      <td className="text-center text-rose-500 font-mono">{formatCurrency(d.spent)}</td>
                      <td className={`text-center font-mono ${balance >= 0 ? 'text-amber-500 font-bold' : 'text-rose-500 font-bold'}`}>
                        {formatCurrency(balance)}
                      </td>
                      <td className="text-right text-base font-black text-slate-800">{d.membersCount} Workers</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW PANEL: 4. VISITORS AUDIT */}
      {reportTab === 'visitors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">First-Time Visitors pool</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 rounded-xl border border-amber-200 flex items-center justify-center">
                  <i className="bi bi-people text-amber-500 text-xl"></i>
                </div>
                <span className="text-3xl font-black text-slate-800">{totalVisitorsCount}</span>
              </div>
              <p className="text-[10px] text-slate-500">All registered guests since launching tracking</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Converts to Membership</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center justify-center">
                  <i className="bi bi-check-circle-fill text-amber-500 text-xl"></i>
                </div>
                <span className="text-3xl font-black text-slate-800">{convertedVisitorsCount}</span>
              </div>
              <p className="text-[10px] text-slate-500">Visitors converted into full-time registered members</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Conversion Yield Rate</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-500 rounded-xl border border-amber-200 flex items-center justify-center">
                  <i className="bi bi-graph-up-arrow text-xl text-amber-500"></i>
                </div>
                <span className="text-3xl font-black text-slate-800">{visitorConversionRate}%</span>
              </div>
              <p className="text-[10px] text-slate-500">Conversion percentage index yield</p>
            </div>
          </div>

          {/* Visitor List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Visitor follow-up & Outreach records</h3>
              <p className="text-xs text-slate-500">Status timelines of all visiting souls</p>
            </div>

            <div className="overflow-x-auto">
              <table className="table-elegant">
                <thead>
                  <tr>
                    <th>Visitor Name</th>
                    <th>Visit Date</th>
                    <th>Invited By</th>
                    <th>Assigned Follow-Up Officer</th>
                    <th className="text-right">Outeach Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map(v => (
                    <tr key={v.id}>
                      <td className="font-bold text-slate-800">{v.name}</td>
                      <td className="font-mono">{v.visitDate}</td>
                      <td className="text-slate-500">{v.invitedBy}</td>
                      <td className="text-amber-600 font-semibold">{v.assignedFollowUpOfficer || 'Unassigned'}</td>
                      <td className="text-right">
                        <span className={`badge ${
                          v.status === 'Converted' ? 'badge-amber' :
                          v.status === 'Lost' ? 'badge-slate' : 'badge-emerald'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTIVE PRINT MODAL DRAWER REPRESENTATION */}
      {showExecutivePrintout && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-2xl p-8 relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowExecutivePrintout(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 font-bold text-lg"
            >
              ✕
            </button>
            
            {/* Printable executive frame */}
            <div id="executive-brief-print" className="border-2 border-slate-900 p-8 rounded-none space-y-8 bg-white font-sans text-slate-800">
              <div className="text-center space-y-2 border-b border-slate-200 pb-6">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Liberty Assemblies of God</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">Executive Ministry Briefing Report</p>
                <div className="text-[10px] text-slate-400 pt-1 font-mono">
                  Generated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • Author: {activeRole}
                </div>
              </div>

              {/* Grid 1: Basic congregation pool */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 font-mono">I. Congregational census</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>• Total Registered Congregation Count: <b className="text-slate-900 font-mono">{totalCongregationCount} members</b></div>
                  <div>• Active, Engaged Congregation: <b className="text-slate-950 font-mono">{activeMembersCount} active</b></div>
                  <div>• Average Sunday Headcount: <b className="text-slate-900 font-mono">{averageAttendance} worshippers</b></div>
                  <div>• First-Time Visitor Conversions Yield: <b className="text-[#F59E0B] font-extrabold font-mono">{visitorConversionRate}%</b></div>
                </div>
              </div>

              {/* Grid 2: Finances */}
              <div className="space-y-4 pt-4">
                <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 font-mono">II. Financial ledger audits</h3>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="block text-slate-450 text-[10px] uppercase font-semibold">Corporate Inflow</span>
                    <span className="text-lg font-black text-[#F59E0B] font-mono">{formatCurrency(totalIncome)}</span>
                  </div>
                  <div>
                    <span className="block text-slate-450 text-[10px] uppercase font-semibold">Total Expenditure</span>
                    <span className="text-lg font-black text-slate-700 font-mono">{formatCurrency(totalExpense)}</span>
                  </div>
                  <div>
                    <span className="block text-slate-450 text-[10px] uppercase font-semibold">Net Cash Balance</span>
                    <span className="text-lg font-black text-[#1A202C] font-mono">{formatCurrency(netBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Sign-offs */}
              <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs">
                <div className="space-y-6">
                  <div className="border-b border-slate-400 mx-auto w-40 h-8"></div>
                  <span className="block text-slate-450 uppercase text-[10px] font-semibold">Church Administrator Signature</span>
                </div>
                <div className="space-y-6">
                  <div className="border-b border-slate-400 mx-auto w-40 h-8"></div>
                  <span className="block text-slate-450 uppercase text-[10px] font-semibold">Resident Pastor Endorsement</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  printExecutiveBriefing('executive-brief-print');
                }}
                className="flex-1 bg-[#F59E0B] hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-none transition-colors flex items-center justify-center gap-2"
              >
                <i className="bi bi-printer text-white"></i> Print PDF Briefing
              </button>
              <button 
                onClick={() => setShowExecutivePrintout(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider py-2.5 rounded-none transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
