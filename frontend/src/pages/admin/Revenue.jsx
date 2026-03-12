import { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../../services/api';
import { Calendar, TrendingUp, Users } from 'lucide-react';

const getDefaultMonth = () => new Date().toISOString().slice(0, 7);

const Revenue = () => {
  const [loading, setLoading] = useState(true);
  const [settlingTechId, setSettlingTechId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getDefaultMonth());
  const [overview, setOverview] = useState({
    summary: {
      totalGross: 0,
      totalPlatformRevenue: 0,
      totalTechnicianPayable: 0,
      completedPayments: 0,
    },
    monthly: [],
  });
  const [payouts, setPayouts] = useState({
    month: getDefaultMonth(),
    monthLabel: '',
    totals: {
      totalTechnicianPayable: 0,
      totalSettled: 0,
      totalPending: 0,
    },
    technicians: [],
  });

  const formatCurrency = (amount) => `NPR ${Number(amount || 0).toLocaleString('en-NP', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const loadData = async (month) => {
    setLoading(true);
    try {
      const [overviewRes, payoutsRes] = await Promise.all([
        adminAPI.getFinanceOverview({ months: 12 }),
        adminAPI.getPayoutSettlements({ month }),
      ]);

      setOverview(overviewRes.data?.data || overview);
      setPayouts(payoutsRes.data?.data || payouts);
    } catch (error) {
      console.error('Failed to load finance data:', error);
      setOverview({
        summary: {
          totalGross: 0,
          totalPlatformRevenue: 0,
          totalTechnicianPayable: 0,
          completedPayments: 0,
        },
        monthly: [],
      });
      setPayouts({
        month,
        monthLabel: '',
        totals: {
          totalTechnicianPayable: 0,
          totalSettled: 0,
          totalPending: 0,
        },
        technicians: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedMonth);
  }, [selectedMonth]);

  const maxPlatformRevenue = useMemo(() => {
    return overview.monthly.reduce((max, item) => Math.max(max, item.platformRevenue || 0), 0);
  }, [overview.monthly]);

  const handleMarkSettled = async (technicianId) => {
    const settlementReference = window.prompt('Settlement reference (optional):', '') || '';
    setSettlingTechId(technicianId);
    try {
      await adminAPI.markPayoutSettled({
        month: selectedMonth,
        technicianId,
        settlementReference,
      });
      await loadData(selectedMonth);
    } catch (error) {
      console.error('Failed to mark payout settled:', error);
      window.alert(error.response?.data?.message || 'Failed to mark payout as settled.');
    } finally {
      setSettlingTechId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-700 text-xl">Loading revenue data...</div>
      </div>
    );
  }

  return (
    <div className="admin-page space-y-6">
      <div>
        <h1 className="admin-page-title mb-2">Revenue and Payouts</h1>
        <p className="admin-page-subtitle">Graph and settlements are now driven by the same completed payment aggregation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="admin-card p-4">
          <p className="text-sm text-gray-600">Gross Collections</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview.summary.totalGross)}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-sm text-gray-600">Platform Revenue (5%)</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(overview.summary.totalPlatformRevenue)}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-sm text-gray-600">Technician Payable (95%)</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(overview.summary.totalTechnicianPayable)}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-sm text-gray-600">Completed Payments</p>
          <p className="text-2xl font-bold text-gray-900">{overview.summary.completedPayments}</p>
        </div>
      </div>

      <div className="admin-card-pad">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={22} className="text-blue-600" />
          <h2 className="admin-section-title">Monthly Graph Source (Completed Payments)</h2>
        </div>

        {overview.monthly.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp size={56} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-800 text-lg mb-2">No completed payments yet</p>
            <p className="text-gray-600 text-sm">This graph will populate as soon as a payment is verified.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overview.monthly.map((item) => {
              const widthPercent = maxPlatformRevenue > 0
                ? Math.max(6, Math.round((item.platformRevenue / maxPlatformRevenue) * 100))
                : 6;

              return (
                <div key={item.monthKey} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-600">{item.completedPayments} payments</p>
                  </div>

                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div className="h-3 bg-gradient-to-r from-emerald-500 to-green-600" style={{ width: `${widthPercent}%` }} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <p className="text-gray-700">Gross: <span className="font-semibold">{formatCurrency(item.gross)}</span></p>
                    <p className="text-gray-700">Platform: <span className="font-semibold text-green-700">{formatCurrency(item.platformRevenue)}</span></p>
                    <p className="text-gray-700">Technician payable: <span className="font-semibold text-blue-700">{formatCurrency(item.technicianPayable)}</span></p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="admin-card-pad">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Users size={22} className="text-blue-600" />
            <h2 className="admin-section-title">Monthly Technician Settlement</h2>
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-600" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-3 rounded-lg border border-gray-200 bg-white">
            <p className="text-xs text-gray-600">Total Payable ({payouts.monthLabel || selectedMonth})</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(payouts.totals.totalTechnicianPayable)}</p>
          </div>
          <div className="p-3 rounded-lg border border-green-200 bg-green-50">
            <p className="text-xs text-green-700">Settled</p>
            <p className="text-lg font-bold text-green-700">{formatCurrency(payouts.totals.totalSettled)}</p>
          </div>
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
            <p className="text-xs text-amber-700">Pending</p>
            <p className="text-lg font-bold text-amber-700">{formatCurrency(payouts.totals.totalPending)}</p>
          </div>
        </div>

        {payouts.technicians.length === 0 ? (
          <p className="text-sm text-gray-600">No technician payouts found for this month.</p>
        ) : (
          <div className="space-y-3">
            {payouts.technicians.map((tech) => (
              <div key={tech.technicianId} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-semibold text-gray-900">{tech.technicianName}</p>
                    <p className="text-sm text-gray-600">{tech.totalJobs} completed jobs</p>
                    <p className="text-sm text-gray-600">Bank: {tech.bankName || 'Not set'} / {tech.accountNumber || 'Not set'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Payable</p>
                    <p className="text-xl font-bold text-blue-700">{formatCurrency(tech.technicianAmount)}</p>
                    <p className="text-xs text-gray-500">Platform fee: {formatCurrency(tech.platformFee)}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm">
                    <span className={`font-semibold ${tech.status === 'settled' ? 'text-green-700' : 'text-amber-700'}`}>
                      {tech.status === 'settled' ? 'Settled' : 'Pending'}
                    </span>
                    {tech.settlementReference ? ` - Ref: ${tech.settlementReference}` : ''}
                  </div>

                  {tech.status !== 'settled' && (
                    <button
                      type="button"
                      disabled={settlingTechId === tech.technicianId}
                      onClick={() => handleMarkSettled(tech.technicianId)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded text-sm font-medium"
                    >
                      {settlingTechId === tech.technicianId ? 'Saving...' : 'Mark Settled'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Revenue;
