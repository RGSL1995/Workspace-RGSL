import { useEffect, useState } from 'react';
import { Plus, Trash2, Users, RefreshCw } from 'lucide-react';
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
    if (!window.confirm('Are you sure? This will remove all assignments.')) return;

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
        <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Department List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm font-semibold text-white tracking-wider">
            DEPARTMENTS ({departments.length})
          </h3>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition-all text-xs font-mono">
            <Plus className="w-3.5 h-3.5" />
            NEW
          </button>
        </div>

        {departments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 font-mono text-xs">
            No departments configured yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {departments.map((dept) => (
              <motion.div
                key={dept._id}
                onClick={() => setSelectedDept(dept)}
                className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedDept?._id === dept._id
                    ? 'bg-cyan-500/20 border-cyan-400'
                    : 'bg-slate-900/60 border-white/10 hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-mono text-sm font-semibold text-white">{dept.name}</h4>
                    {dept.description && (
                      <p className="text-[11px] text-slate-400 mt-1">{dept.description}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDepartment(dept._id);
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {dept.employee_count} employees
                  </span>
                  {dept.head_id && (
                    <span>Head: {dept.head_id.name}</span>
                  )}
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
          className="rounded-lg border border-cyan-500/20 bg-slate-950/80 p-4"
        >
          <h3 className="font-mono text-sm font-semibold text-cyan-300 mb-4">
            {selectedDept.name} - EMPLOYEE ASSIGNMENTS
          </h3>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {employees
              .filter((emp) => emp.departments?.includes(selectedDept.name) || emp._id === selectedDept.head_id?._id)
              .map((emp) => (
                <div
                  key={emp._id}
                  className="flex items-center justify-between p-2.5 rounded bg-slate-900/60 border border-white/5 text-[11px] font-mono"
                >
                  <div>
                    <p className="text-white">{emp.name}</p>
                    <p className="text-slate-500">{emp.email}</p>
                  </div>
                  <span className="text-cyan-300 text-[10px] uppercase">{emp.role}</span>
                </div>
              ))}

            {employees.filter((emp) => emp.departments?.includes(selectedDept.name)).length === 0 && (
              <p className="text-center text-slate-500 text-xs py-4">No employees assigned</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
