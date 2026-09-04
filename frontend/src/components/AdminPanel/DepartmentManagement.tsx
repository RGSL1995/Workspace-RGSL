import { useEffect, useState } from 'react';
import { Trash2, Users, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface Department {
  _id: string;
  name: string;
  description?: string;
  head_id?: { _id?: string; name: string; email: string };
  employee_count: number;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  departments?: string[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptsRes, empsRes] = await Promise.all([
        fetch(`${API_URL}/api/departments`, { credentials: 'include' }),
        fetch(`${API_URL}/api/employees`, { credentials: 'include' }),
      ]);

      if (deptsRes.ok) {
        setDepartments(await deptsRes.json());
      }
      if (empsRes.ok) {
        setEmployees(await empsRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (!window.confirm('Are you sure? This will remove all department assignments.')) return;

    try {
      const res = await fetch(`${API_URL}/api/departments/${deptId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setDepartments(departments.filter((d) => d._id !== deptId));
        setSelectedDept(null);
      }
    } catch (error) {
      console.error('Failed to delete department:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Department List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Departments ({departments.length})
          </h3>
        </div>

        {departments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No departments configured yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {departments.map((dept) => (
              <motion.div
                key={dept._id}
                onClick={() => setSelectedDept(dept)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedDept?._id === dept._id
                    ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{dept.name}</h4>
                    {dept.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{dept.description}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDepartment(dept._id);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-brand-500" />
                    {dept.employee_count} employees
                  </span>
                  {dept.head_id && <span>Head: {dept.head_id.name}</span>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Department Details */}
      {selectedDept && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-5 space-y-3"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {selectedDept.name} — Personnel Assignments
          </h3>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {employees
              .filter(
                (emp) =>
                  emp.departments?.includes(selectedDept.name) ||
                  emp._id === selectedDept.head_id?._id
              )
              .map((emp) => (
                <div
                  key={emp._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{emp.name}</p>
                    <p className="text-slate-400 text-[11px]">{emp.email}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
                    {emp.role.replace('_', ' ')}
                  </span>
                </div>
              ))}

            {employees.filter((emp) => emp.departments?.includes(selectedDept.name)).length ===
              0 && (
              <p className="text-center text-slate-400 text-xs py-4">No employees assigned</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
