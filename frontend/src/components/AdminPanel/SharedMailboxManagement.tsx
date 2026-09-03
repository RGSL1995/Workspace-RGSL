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
      // Fetch shared mailboxes
      const mailboxRes = await fetch(`${API_URL}/api/email-connections/shared/list/all`, {
        credentials: 'include',
      });
      if (mailboxRes.ok) {
        const data = await mailboxRes.json();
        setMailboxes(data);
      }

      // Fetch all employees
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
      <h3 className="text-lg font-display font-bold text-cyan-300 tracking-wider">
        SHARED MAILBOX MANAGEMENT
      </h3>

      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Mailbox List */}
          <div className="lg:col-span-1 space-y-2">
            <div className="text-[11px] font-mono uppercase text-slate-400 mb-3">
              SHARED INBOXES ({mailboxes.length})
            </div>
            {mailboxes.length === 0 ? (
              <div className="text-xs text-slate-500 py-4">No shared mailboxes</div>
            ) : (
              <div className="space-y-2">
                {mailboxes.map((mailbox) => (
                  <motion.button
                    key={mailbox._id}
                    onClick={() => setSelectedMailbox(mailbox)}
                    whileHover={{ x: 2 }}
                    className={`w-full text-left p-3 rounded border transition-all ${
                      selectedMailbox?._id === mailbox._id
                        ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300'
                        : 'bg-slate-900/40 border-white/10 text-slate-300 hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="font-mono text-xs font-semibold truncate">
                      {mailbox.email}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {mailbox.authorized_employees.length} members
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Mailbox Details */}
          {selectedMailbox && (
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 rounded-lg border border-cyan-500/30 bg-slate-950/40 backdrop-blur-sm">
                <div className="mb-4">
                  <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                    Mailbox Details
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] text-slate-400">Email</div>
                      <div className="text-sm font-mono text-cyan-300">{selectedMailbox.email}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Company</div>
                      <div className="text-sm text-slate-300">{selectedMailbox.company}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Created</div>
                      <div className="text-sm text-slate-300">
                        {new Date(selectedMailbox.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employee List */}
                <div>
                  <div className="text-[11px] font-mono uppercase text-slate-400 mb-2">
                    Assigned Employees
                  </div>
                  {selectedMailbox.authorized_employees.length === 0 ? (
                    <div className="text-xs text-slate-500 py-2">No employees assigned</div>
                  ) : (
                    <div className="space-y-2">
                      {selectedMailbox.authorized_employees.map((emp) => (
                        <motion.div
                          key={emp._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-white/10"
                        >
                          <div>
                            <div className="text-xs font-semibold text-slate-200">{emp.name}</div>
                            <div className="text-[10px] text-slate-400">{emp.email}</div>
                          </div>
                          <button
                            onClick={() => removeEmployeeFromMailbox(selectedMailbox._id, emp._id)}
                            className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Remove employee"
                          >
                            <X size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Employee */}
                {getUnassignedEmployees().length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-[11px] font-mono uppercase text-slate-400 mb-2">
                      Add Employee
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm rounded bg-slate-900/60 border border-white/15 text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="">Select employee...</option>
                        {getUnassignedEmployees().map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} ({emp.email})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={addEmployeeToMailbox}
                        disabled={!selectedEmployee}
                        className="px-3 py-1.5 rounded bg-cyan-500/30 border border-cyan-500/60 text-cyan-300 hover:bg-cyan-500/40 disabled:opacity-50 transition-all flex items-center gap-1"
                      >
                        <Plus size={16} />
                        <span className="text-sm">Add</span>
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
