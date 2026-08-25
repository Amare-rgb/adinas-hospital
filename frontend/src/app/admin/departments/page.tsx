// app/admin/departments/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Building2, Stethoscope, Heart, Brain, Bone, Shield } from 'lucide-react';

// Helper to assign a random icon and color to each new department
const getDepartmentIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('cardio') || lower.includes('heart')) return { Icon: Heart, color: 'text-red-500 bg-red-100 dark:bg-red-900/30' };
  if (lower.includes('brain') || lower.includes('neuro')) return { Icon: Brain, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' };
  if (lower.includes('bone') || lower.includes('ortho')) return { Icon: Bone, color: 'text-green-500 bg-green-100 dark:bg-green-900/30' };
  if (lower.includes('emergency') || lower.includes('shield')) return { Icon: Shield, color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' };
  return { Icon: Stethoscope, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' };
};

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch existing departments on page load
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setFetching(true);
    try {
      const res = await fetch('http://localhost:5000/api/departments');
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data || []);
      } else {
        toast.error('Failed to load departments');
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast.error('Could not connect to server');
    } finally {
      setFetching(false);
    }
  };

  // Handle form submission to add a new department
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Department name is required');

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Department "${name}" added successfully!`);
        setName('');
        setDescription('');
        fetchDepartments(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to add department');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a department
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`http://localhost:5000/api/departments/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Department deleted successfully');
        fetchDepartments(); // Refresh list
      } else {
        toast.error(data.error || 'Failed to delete department');
      }
    } catch (error) {
      toast.error('Failed to delete department');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Departments
        </h1>
      </div>

      {/* 1. MINIMIZED FORM CARD */}
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
              <Plus className="w-5 h-5" />
            </div>
            Add New Department
          </h2>
        </div>
        
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#2A3380]/50 focus:border-[#2A3380] outline-none transition-all text-sm shadow-sm"
                  placeholder="e.g., Cardiology, Pediatrics..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Description <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#2A3380]/50 focus:border-[#2A3380] outline-none transition-all text-sm shadow-sm"
                  placeholder="e.g., Heart and vascular care"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2A3380] hover:bg-[#1E3A8A] text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Department
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. SIMPLE CARD LIST */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            All Departments
          </h2>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            {departments.length} Total
          </span>
        </div>

        <div className="p-6 sm:p-8">
          {fetching ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-8 h-8 text-[#2A3380] animate-spin mb-2" />
              <p className="text-sm">Loading departments...</p>
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-semibold text-gray-600 dark:text-gray-300">No departments added yet</p>
              <p className="text-sm mt-1">Start by creating a new department above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {departments.map((dept) => {
                const { Icon, color } = getDepartmentIcon(dept.name);
                return (
                  <div
                    key={dept.id}
                    className="group relative flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-[#2A3380]/30 dark:hover:border-[#2A3380]/50 hover:shadow-md transition-all duration-200"
                  >
                    {/* Department Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-800 dark:text-white text-sm truncate">
                          {dept.name}
                        </h3>
                        <button
                          onClick={() => handleDelete(dept.id)}
                          disabled={deletingId === dept.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete department"
                        >
                          {deletingId === dept.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {dept.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {dept.description}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1.5 font-mono">
                        ID: {dept.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}