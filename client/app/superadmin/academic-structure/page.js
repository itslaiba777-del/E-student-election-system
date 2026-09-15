'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { academicStructureAPI, universityAPI } from '../../../lib/api';
import ConfirmationModal from '../../../components/ConfirmationModal';
import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  GitFork,
  ShieldCheck,
  Users,
  Vote,
  BarChart2,
  Shield,
  LogOut,
  Plus,
  PlusCircle,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Download,
  Info,
  CheckCircle2,
  School,
  X,
  Search,
  Bell,
  MoreVertical,
} from 'lucide-react';

export default function SuperAdminAcademicStructurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlUniId = searchParams.get('university_id');

  // Universities List State
  const [universities, setUniversities] = useState([
    { id: 1, name: 'COMSATS University Islamabad' },
    { id: 2, name: 'National University of Sciences & Technology' },
    { id: 3, name: 'Lahore University of Management Sciences' },
  ]);
  const [selectedUniId, setSelectedUniId] = useState(urlUniId ? Number(urlUniId) : 1);

  // Hierarchy Data State (Faculties -> Departments -> Programs)
  const [faculties, setFaculties] = useState([
    {
      id: 101,
      university_id: 1,
      name: 'Faculty of Engineering & Technology',
      expanded: true,
      departments: [
        {
          id: 201,
          faculty_id: 101,
          name: 'Department of Computer Science',
          expanded: true,
          programs: [
            { id: 301, department_id: 201, name: 'BS Computer Science (Core)' },
            { id: 302, department_id: 201, name: 'MS Information Technology' },
          ],
        },
        {
          id: 202,
          faculty_id: 101,
          name: 'Department of Electrical Engineering',
          expanded: false,
          programs: [
            { id: 303, department_id: 202, name: 'BS Electrical Engineering' },
          ],
        },
      ],
    },
    {
      id: 102,
      university_id: 1,
      name: 'Faculty of Business & Management',
      expanded: false,
      departments: [
        {
          id: 203,
          faculty_id: 102,
          name: 'Department of Business Administration',
          expanded: false,
          programs: [
            { id: 304, department_id: 203, name: 'Bachelor of Business Administration (BBA)' },
          ],
        },
      ],
    },
  ]);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('faculty'); // 'faculty' | 'department' | 'program'
  const [editingItem, setEditingItem] = useState(null); // Null if creating
  const [parentId, setParentId] = useState(null); // faculty_id or department_id when adding child
  const [nodeName, setNodeName] = useState('');
  const [processing, setProcessing] = useState(false);

  // Confirmation Modal for Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null); // { type, id, name }

  useEffect(() => {
    fetchUniversities();
  }, []);

  useEffect(() => {
    if (selectedUniId) {
      fetchHierarchy(selectedUniId);
    }
  }, [selectedUniId]);

  const fetchUniversities = async () => {
    try {
      const res = await universityAPI.getAll();
      if (res.data.universities && res.data.universities.length > 0) {
        setUniversities(res.data.universities);
        if (!urlUniId) setSelectedUniId(res.data.universities[0].id);
      }
    } catch (err) {
      console.warn('Universities list fallback:', err);
    }
  };

  const fetchHierarchy = async (uniId) => {
    try {
      const res = await academicStructureAPI.getHierarchy(uniId);
      if (res.data.faculties && res.data.faculties.length > 0) {
        setFaculties(res.data.faculties);
      }
    } catch (err) {
      console.warn('Hierarchy fetch fallback:', err);
    }
  };

  // Toggle Expansion Handlers
  const toggleFacultyExpand = (facId) => {
    setFaculties((prev) =>
      prev.map((f) => (f.id === facId ? { ...f, expanded: !f.expanded } : f))
    );
  };

  const toggleDeptExpand = (facId, deptId) => {
    setFaculties((prev) =>
      prev.map((f) => {
        if (f.id !== facId) return f;
        return {
          ...f,
          departments: f.departments.map((d) =>
            d.id === deptId ? { ...d, expanded: !d.expanded } : d
          ),
        };
      })
    );
  };

  // Open Add Modals
  const handleOpenAddFaculty = () => {
    setModalType('faculty');
    setEditingItem(null);
    setNodeName('');
    setIsModalOpen(true);
  };

  const handleOpenAddDept = (facId, e) => {
    e.stopPropagation();
    setModalType('department');
    setEditingItem(null);
    setParentId(facId);
    setNodeName('');
    setIsModalOpen(true);
  };

  const handleOpenAddProgram = (deptId, e) => {
    e.stopPropagation();
    setModalType('program');
    setEditingItem(null);
    setParentId(deptId);
    setNodeName('');
    setIsModalOpen(true);
  };

  // Open Edit Modals
  const handleOpenEdit = (type, item, e) => {
    e.stopPropagation();
    setModalType(type);
    setEditingItem(item);
    setNodeName(item.name);
    setIsModalOpen(true);
  };

  // Open Delete Modals
  const handleOpenDelete = (type, item, e) => {
    e.stopPropagation();
    setDeletingItem({ type, id: item.id, name: item.name });
    setIsDeleteModalOpen(true);
  };

  // Form Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      if (editingItem) {
        // Edit existing node
        if (modalType === 'faculty') {
          await academicStructureAPI.updateFaculty(editingItem.id, { name: nodeName });
          setFaculties((prev) =>
            prev.map((f) => (f.id === editingItem.id ? { ...f, name: nodeName } : f))
          );
        } else if (modalType === 'department') {
          await academicStructureAPI.updateDepartment(editingItem.id, { name: nodeName });
          setFaculties((prev) =>
            prev.map((f) => ({
              ...f,
              departments: f.departments.map((d) =>
                d.id === editingItem.id ? { ...d, name: nodeName } : d
              ),
            }))
          );
        } else if (modalType === 'program') {
          await academicStructureAPI.updateProgram(editingItem.id, { name: nodeName });
          setFaculties((prev) =>
            prev.map((f) => ({
              ...f,
              departments: f.departments.map((d) => ({
                ...d,
                programs: d.programs.map((p) =>
                  p.id === editingItem.id ? { ...p, name: nodeName } : p
                ),
              })),
            }))
          );
        }
      } else {
        // Add new node
        if (modalType === 'faculty') {
          const res = await academicStructureAPI.createFaculty({
            university_id: selectedUniId,
            name: nodeName,
          });
          const newFac = res.data.faculty || {
            id: Date.now(),
            university_id: selectedUniId,
            name: nodeName,
            expanded: true,
            departments: [],
          };
          setFaculties((prev) => [...prev, newFac]);
        } else if (modalType === 'department') {
          const res = await academicStructureAPI.createDepartment({
            faculty_id: parentId,
            name: nodeName,
          });
          const newDept = res.data.department || {
            id: Date.now(),
            faculty_id: parentId,
            name: nodeName,
            expanded: true,
            programs: [],
          };
          setFaculties((prev) =>
            prev.map((f) =>
              f.id === parentId
                ? { ...f, expanded: true, departments: [...f.departments, newDept] }
                : f
            )
          );
        } else if (modalType === 'program') {
          const res = await academicStructureAPI.createProgram({
            department_id: parentId,
            name: nodeName,
          });
          const newProg = res.data.program || {
            id: Date.now(),
            department_id: parentId,
            name: nodeName,
          };
          setFaculties((prev) =>
            prev.map((f) => ({
              ...f,
              departments: f.departments.map((d) =>
                d.id === parentId
                  ? { ...d, expanded: true, programs: [...d.programs, newProg] }
                  : d
              ),
            }))
          );
        }
      }
    } catch (err) {
      console.warn('Hierarchy save API fallback:', err);
    } finally {
      setProcessing(false);
      setIsModalOpen(false);
    }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setProcessing(true);

    try {
      if (deletingItem.type === 'faculty') {
        await academicStructureAPI.deleteFaculty(deletingItem.id);
        setFaculties((prev) => prev.filter((f) => f.id !== deletingItem.id));
      } else if (deletingItem.type === 'department') {
        await academicStructureAPI.deleteDepartment(deletingItem.id);
        setFaculties((prev) =>
          prev.map((f) => ({
            ...f,
            departments: f.departments.filter((d) => d.id !== deletingItem.id),
          }))
        );
      } else if (deletingItem.type === 'program') {
        await academicStructureAPI.deleteProgram(deletingItem.id);
        setFaculties((prev) =>
          prev.map((f) => ({
            ...f,
            departments: f.departments.map((d) => ({
              ...d,
              programs: d.programs.filter((p) => p.id !== deletingItem.id),
            })),
          }))
        );
      }
    } catch (err) {
      console.warn('Hierarchy delete API fallback:', err);
    } finally {
      setProcessing(false);
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
    }
  };

  // Export Hierarchy Function
  const exportStructure = () => {
    const selectedUni = universities.find((u) => u.id === selectedUniId);
    const exportData = {
      university: selectedUni ? selectedUni.name : 'University Structure',
      exported_at: new Date().toISOString(),
      faculties: faculties,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${
      selectedUni ? selectedUni.name.replace(/\s+/g, '_') : 'Academic_Structure'
    }_Hierarchy.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/select-university');
    }
  };

  // Live Counts for Quick Summary Card
  const totalFacultiesCount = faculties.length;
  const totalDepartmentsCount = faculties.reduce(
    (acc, f) => acc + (f.departments ? f.departments.length : 0),
    0
  );

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 fixed left-0 top-0 hidden lg:flex flex-col bg-[#efeeea] border-r border-[#c0c9bb] p-6 z-50 h-screen justify-between">
        <div className="space-y-6">
          <div className="px-2">
            <span className="font-black text-xl text-[#00450d] tracking-tight">Campus Vote</span>
            <p className="text-xs text-[#717a6d] font-bold uppercase tracking-wider mt-0.5">
              SuperAdmin Portal
            </p>
          </div>

          <nav className="space-y-1">
            <Link
              href="/superadmin/dashboard"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#717a6d]" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/superadmin/universities"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-[#717a6d]" />
              <span>Universities</span>
            </Link>

            <Link
              href="/superadmin/academic-structure"
              className="flex items-center space-x-3 px-4 py-3 bg-[#a0f399] text-[#217128] rounded-xl font-bold text-xs shadow-xs"
            >
              <GitFork className="w-4 h-4 text-[#00450d]" />
              <span>Academic Structure</span>
            </Link>

            <Link
              href="/superadmin/manage-admins"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[#717a6d]" />
              <span>Manage Admins</span>
            </Link>

            <Link
              href="/superadmin/elections"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <Vote className="w-4 h-4 text-[#717a6d]" />
              <span>Elections</span>
            </Link>

            <Link
              href="/superadmin/reports"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <BarChart2 className="w-4 h-4 text-[#717a6d]" />
              <span>Reports</span>
            </Link>

            <Link
              href="/superadmin/settings"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <Shield className="w-4 h-4 text-[#717a6d]" />
              <span>System Settings</span>
            </Link>
          </nav>
        </div>

        <div className="space-y-1 pt-4 border-t border-[#c0c9bb]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-xl font-bold text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-64 flex-1 min-h-screen p-6 md:p-8 max-w-7xl space-y-8">
        {/* Page Header & Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c0c9bb] pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#00450d] tracking-tight">
              Academic Structure Management
            </h1>
            <p className="text-xs text-[#41493e] mt-1">
              Manage organization hierarchy, faculties, departments, and academic programs.
            </p>
          </div>

          {/* University Scoping Dropdown */}
          <div className="flex items-center space-x-3 bg-white border border-[#c0c9bb] rounded-2xl p-2 px-4 shadow-xs shrink-0">
            <GraduationCap className="w-5 h-5 text-[#00450d]" />
            <select
              value={selectedUniId}
              onChange={(e) => setSelectedUniId(Number(e.target.value))}
              className="bg-transparent border-none text-xs font-bold text-[#1b1c1a] focus:outline-none cursor-pointer pr-4"
            >
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Management Tools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Summary Card (Left 1 Col) */}
          <div className="bg-[#00450d] text-white p-6 rounded-2xl shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="space-y-4 relative z-10">
              <span className="text-[11px] font-bold text-[#acf4a4] uppercase tracking-wider">
                Quick Summary
              </span>
              <div className="space-y-1">
                <div className="text-4xl font-black">{totalFacultiesCount}</div>
                <div className="text-xs text-[#acf4a4] font-semibold">Faculties Registered</div>
              </div>
              <div className="space-y-1 pt-2 border-t border-white/20">
                <div className="text-2xl font-extrabold">{totalDepartmentsCount}</div>
                <div className="text-xs text-[#acf4a4] font-semibold">Departments Active</div>
              </div>
            </div>

            <div className="pt-4 relative z-10">
              <button
                onClick={handleOpenAddFaculty}
                className="w-full bg-[#acf4a4] hover:bg-[#98f994] text-[#002204] py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Faculty</span>
              </button>
            </div>
          </div>

          {/* Main Tree View Card (Right 2 Cols) */}
          <div className="lg:col-span-2 bg-white border border-[#c0c9bb] rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#c0c9bb] bg-[#f4f4f0] flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#1b1c1a] uppercase tracking-wider">
                Hierarchy Tree
              </h2>
              <button
                onClick={exportStructure}
                className="flex items-center space-x-1.5 text-xs text-[#00450d] font-bold hover:underline"
              >
                <Download className="w-4 h-4" />
                <span>Export Structure</span>
              </button>
            </div>

            {/* Expandable Tree Content */}
            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
              {faculties.map((fac) => (
                <div key={fac.id} className="space-y-2 border border-[#c0c9bb]/60 rounded-xl p-3">
                  {/* Faculty Row */}
                  <div
                    onClick={() => toggleFacultyExpand(fac.id)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#f4f4f0] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      {fac.expanded ? (
                        <ChevronDown className="w-4 h-4 text-[#717a6d]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#717a6d]" />
                      )}
                      <Building2 className="w-4 h-4 text-[#00450d]" />
                      <span className="text-xs font-extrabold text-[#1b1c1a]">{fac.name}</span>
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleOpenAddDept(fac.id, e)}
                        className="p-1 text-[#005312] hover:bg-[#a0f399]/40 rounded-md"
                        title="Add Department"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleOpenEdit('faculty', fac, e)}
                        className="p-1 text-[#717a6d] hover:bg-[#e9e8e4] rounded-md"
                        title="Edit Faculty"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleOpenDelete('faculty', fac, e)}
                        className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-md"
                        title="Delete Faculty"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Departments Container */}
                  {fac.expanded && fac.departments && (
                    <div className="ml-6 border-l-2 border-[#c0c9bb] pl-4 space-y-2 pt-1">
                      {fac.departments.map((dept) => (
                        <div key={dept.id} className="space-y-2">
                          {/* Department Row */}
                          <div
                            onClick={() => toggleDeptExpand(fac.id, dept.id)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#f4f4f0] transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center space-x-3">
                              {dept.expanded ? (
                                <ChevronDown className="w-4 h-4 text-[#717a6d]" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-[#717a6d]" />
                              )}
                              <GitFork className="w-4 h-4 text-[#005312]" />
                              <span className="text-xs font-bold text-[#41493e]">{dept.name}</span>
                            </div>

                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => handleOpenAddProgram(dept.id, e)}
                                className="p-1 text-[#005312] hover:bg-[#a0f399]/40 rounded-md"
                                title="Add Program"
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleOpenEdit('department', dept, e)}
                                className="p-1 text-[#717a6d] hover:bg-[#e9e8e4] rounded-md"
                                title="Edit Department"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleOpenDelete('department', dept, e)}
                                className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-md"
                                title="Delete Department"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Programs Container */}
                          {dept.expanded && dept.programs && (
                            <div className="ml-6 border-l border-[#c0c9bb]/50 pl-4 space-y-1 pt-1">
                              {dept.programs.map((prog) => (
                                <div
                                  key={prog.id}
                                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[#f4f4f0] transition-colors group"
                                >
                                  <div className="flex items-center space-x-3">
                                    <School className="w-3.5 h-3.5 text-[#717a6d]" />
                                    <span className="text-xs text-[#41493e] font-medium">
                                      {prog.name}{' '}
                                      <span className="text-[10px] text-[#717a6d] italic">(Optional)</span>
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => handleOpenEdit('program', prog, e)}
                                      className="p-1 text-[#717a6d] hover:bg-[#e9e8e4] rounded-md"
                                      title="Edit Program"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => handleOpenDelete('program', prog, e)}
                                      className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-md"
                                      title="Delete Program"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration Tips Section */}
        <div className="bg-[#f4f4f0] p-6 rounded-2xl border border-[#c0c9bb] grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-2 uppercase tracking-wider">
              <Info className="w-4 h-4 text-[#00450d]" />
              <span>Configuration Guidance</span>
            </h4>
            <ul className="space-y-1 text-xs text-[#41493e]">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#005312]" />
                <span>Hierarchy updates are instantly synchronized across election scopes.</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#005312]" />
                <span>Programs must be linked to a Department to appear on candidate ballots.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Modal: Add / Edit Hierarchy Node */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1b1c1a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#c0c9bb] p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-[#c0c9bb] pb-4">
              <h3 className="text-lg font-bold text-[#00450d] capitalize">
                {editingItem ? `Edit ${modalType}` : `Add New ${modalType}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-[#e9e8e4] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#717a6d]" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1b1c1a] capitalize">
                  {modalType} Name
                </label>
                <input
                  type="text"
                  required
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  placeholder={`e.g. ${
                    modalType === 'faculty'
                      ? 'Faculty of Engineering'
                      : modalType === 'department'
                      ? 'Department of Computer Science'
                      : 'BS Computer Science'
                  }`}
                  className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 border border-[#717a6d] text-[#41493e] font-bold text-xs rounded-xl hover:bg-[#e9e8e4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 h-11 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-xl shadow-md capitalize"
                >
                  {processing ? 'Saving...' : editingItem ? 'Save Changes' : `Add ${modalType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal — Delete Hierarchy Node (Cascading Warning) */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        iconType="warning"
        heading={`Delete ${deletingItem?.type}?`}
        description={`WARNING: Deleting ${deletingItem?.name} will permanently remove all associated child departments, academic programs, student scopes, and candidate nominations under this branch.`}
        confirmLabel={processing ? 'Deleting...' : 'Delete Node'}
        confirmButtonStyle="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
