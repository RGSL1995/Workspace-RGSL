import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { motion } from 'motion/react';

interface SharedMailbox {
  _id: string;
  email: string;
  company: string;
  authorized_employees: {
    _id: string;
    name: string;
    email: string;
  }[];
  created_at: string;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SharedMailboxManagement() {
  const [mailboxes, setMailboxes] = useState<SharedMailbox[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMailbox, setSelectedMailbox] = useState<SharedMailbox | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const mailboxRes = await fetch(`${API_URL}/api/email-connections/shared/list/all`, {
        credentials: 'include',
      });
      if (mailboxRes.ok) {
        const data = await mailboxRes.json();
        setMailboxes(data);
      }

      const empRes = await fetch(`${API_URL}/api/employees`, {
        credentials: 'include',
      });
      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEmployeeToMailbox = async () => {
    if (!selectedMailbox || !selectedEmployee) return;

    try {
      const response = await fetch(
        `${API_URL}/api/email-connections/${selectedMailbox._id}/add-employee/${selectedEmployee}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        await fetchData();
        setSelectedEmployee('');
      }
    } catch (error) {
      console.error('Failed to add employee:', error);
    }
  };

  const removeEmployeeFromMailbox = async (mailboxId: string, employeeId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/email-connections/${mailboxId}/remove-employee/${employeeId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to remove employee:', error);
    }
  };

  const getUnassignedEmployees = () => {
    if (!selectedMailbox) return [];
    return employees.filter(
      (emp) => !selectedMailbox.authorized_employees.some((auth) => auth._id === emp._id)
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">
        Shared Mailbox Access Control
      </h3>

      {loading ? (
        <div className="text-center py-8 text-slate-400 text-xs">Loading mailboxes...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Mailbox List */}
          <div className="lg:col-span-1 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Connected Inboxes ({mailboxes.length})
            </div>
            {mailboxes.length === 0 ? (
              <div className="text-xs text-slate-400 py-4">No shared mailboxes connected</div>
            ) : (
              <div className="space-y-2">
                {mailboxes.map((mailbox) => (
                  <motion.button
                    key={mailbox._id}
                    onClick={() => setSelectedMailbox(mailbox)}
                    whileHover={{ x: 2 }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                      selectedMailbox?._id === mailbox._id
                        ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 shadow-xs'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{mailbox.email}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {mailbox.authorized_employees.length} team members
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Mailbox Details */}
          {selectedMailbox && (
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Selected Inbox</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedMailbox.email}
                  </div>
                </div>

                {/* Employee List */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Authorized Team Members ({selectedMailbox.authorized_employees.length})
                  </div>
                  {selectedMailbox.authorized_employees.length === 0 ? (
                    <div className="text-xs text-slate-400 py-2">No team members assigned</div>
                  ) : (
                    <div className="space-y-2">
                      {selectedMailbox.authorized_employees.map((emp) => (
                        <motion.div
                          key={emp._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {emp.name}
                            </div>
                            <div className="text-[11px] text-slate-400">{emp.email}</div>
                          </div>
                          <button
                            onClick={() => removeEmployeeFromMailbox(selectedMailbox._id, emp._id)}
                            className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition-colors"
                            title="Remove access"
                          >
                            <X size={15} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Employee */}
                {getUnassignedEmployees().length > 0 && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Grant Inbox Access
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="">Select team member...</option>
                        {getUnassignedEmployees().map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} ({emp.email})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={addEmployeeToMailbox}
                        disabled={!selectedEmployee}
                        className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus size={15} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
