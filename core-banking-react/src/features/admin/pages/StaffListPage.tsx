import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import Button from '../../../components/common/Button';
import DataTable from '../../../components/common/DataTable';
import StaffCreateModal from '../components/StaffCreateModal';
import StaffEditModal from '../components/StaffEditModal';
import StaffRoleModal from '../components/StaffRoleModal';
import StaffResetPasswordModal from '../components/StaffResetPasswordModal';
import StaffDetailsModal from '../components/StaffDetailsModal';
import ConfirmModal from '../components/ConfirmModal';
import { staffApi } from '../../../services/apiClient';
import type { StaffResponse, StaffUserStatus } from '../../../types/api.types';
import type { AxiosError } from 'axios';
import { useAuth } from '../../auth/hooks/useAuth';

export default function StaffListPage() {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState<StaffResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Dropdown menu state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown-container]')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const loadStaff = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await staffApi.getAll();
      setStaffList(res.data);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      if (axErr.response?.status === 403) {
        setError('Access denied. You do not have permission to view staff records.');
      } else {
        setError('Failed to load staff list. Please verify the backend service is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleShowSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Filtered staff list (client-side search & status filtering over real backend data)
  const filteredStaff = useMemo(() => {
    return staffList.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.fullName && item.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.staffNo && item.staffNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.roleCode && item.roleCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.roleName && item.roleName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.phone && item.phone.includes(searchTerm));

      const matchesStatus =
        statusFilter === 'ALL' || item.status === (statusFilter as StaffUserStatus);

      return matchesSearch && matchesStatus;
    });
  }, [staffList, searchTerm, statusFilter]);

  // Handle deactivation
  const handleConfirmDeactivate = async () => {
    if (!selectedStaff) return;

    const currentUsername = user?.username?.trim().toLowerCase();
    const targetUsername = selectedStaff.username?.trim().toLowerCase();
    const isSelf = !!currentUsername && !!targetUsername && currentUsername === targetUsername;
    const roleCode = (selectedStaff.roleCode || (selectedStaff.staffNo?.includes('TLR') ? 'TELLER' : selectedStaff.staffNo?.includes('AUD') ? 'AUDITOR' : selectedStaff.staffNo?.includes('ADM') ? 'ADMIN' : '')).toUpperCase();

    if (roleCode === 'ADMIN' || isSelf) {
      setError(isSelf ? 'Administrators cannot deactivate their own account.' : 'Administrators cannot deactivate other administrators.');
      setIsDeactivateConfirmOpen(false);
      return;
    }

    setDeactivateLoading(true);
    try {
      await staffApi.deactivate(selectedStaff.staffId);
      handleShowSuccess(`Staff account "${selectedStaff.username}" has been deactivated.`);
      setIsDeactivateConfirmOpen(false);
      setSelectedStaff(null);
      loadStaff();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr.response?.data?.message || 'Failed to deactivate staff account.');
    } finally {
      setDeactivateLoading(false);
    }
  };

  const columns = [
    {
      key: 'staffNo',
      header: 'Staff No.',
      render: (row: StaffResponse) => (
        <span className="font-mono text-xs font-semibold text-gray-800">
          {row.staffNo}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row: StaffResponse) => {
        const code = (row.roleCode || (row.staffNo?.includes('TLR') ? 'TELLER' : row.staffNo?.includes('AUD') ? 'AUDITOR' : row.staffNo?.includes('ADM') ? 'ADMIN' : 'STAFF')).toUpperCase();
        const roleColors: Record<string, string> = {
          ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
          TELLER: 'bg-blue-100 text-blue-700 border-blue-200',
          AUDITOR: 'bg-amber-100 text-amber-700 border-amber-200',
        };
        return (
          <span
            className={[
              'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border',
              roleColors[code] || 'bg-gray-100 text-gray-700 border-gray-200',
            ].join(' ')}
          >
            {row.roleName || code}
          </span>
        );
      },
    },
    {
      key: 'username',
      header: 'Username / Name',
      render: (row: StaffResponse) => (
        <div>
          <button
            onClick={() => {
              setSelectedStaff(row);
              setIsDetailsOpen(true);
            }}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left block"
          >
            {row.username}
          </button>
          <span className="text-xs text-gray-500 block truncate max-w-[160px]">
            {row.fullName || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact Info',
      render: (row: StaffResponse) => (
        <div className="text-xs">
          <p className="text-gray-700 truncate max-w-[180px]">{row.email || '—'}</p>
          <p className="text-gray-400">{row.phone || '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: StaffResponse) => {
        const statusColors: Record<string, string> = {
          ACTIVE: 'bg-green-100 text-green-700',
          DEACTIVATED: 'bg-red-100 text-red-700',
        };
        return (
          <span
            className={[
              'rounded-full px-2.5 py-0.5 text-xs font-semibold',
              statusColors[row.status] || 'bg-gray-100 text-gray-700',
            ].join(' ')}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      key: 'mustChangePassword',
      header: 'Must Reset Pwd',
      render: (row: StaffResponse) =>
        row.mustChangePassword ? (
          <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
            Yes
          </span>
        ) : (
          <span className="text-xs text-gray-400">No</span>
        ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      render: (row: StaffResponse) => (
        <span className="text-xs text-gray-500">
          {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (row: StaffResponse) => {
        const currentUsername = user?.username?.trim().toLowerCase();
        const rowUsername = row.username?.trim().toLowerCase();
        const isSelf = !!currentUsername && !!rowUsername && currentUsername === rowUsername;

        const roleCode = (row.roleCode || (row.staffNo?.includes('TLR') ? 'TELLER' : row.staffNo?.includes('AUD') ? 'AUDITOR' : row.staffNo?.includes('ADM') ? 'ADMIN' : '')).toUpperCase();
        const isRowAdmin = roleCode === 'ADMIN';
        const isOtherAdmin = isRowAdmin && !isSelf;

        const isDeactivated = row.status === 'DEACTIVATED';

        // RBAC Permissions:
        // Admin to Other Admin: An Admin can ONLY view details of another Admin. All other actions (Edit Information, Change Role, Reset Password, Deactivate) must be hidden.
        // Admin to Themselves: An Admin modifying their own profile can ONLY do "View Details", "Edit Information", and "Reset Password".
        const canEdit = !isOtherAdmin && !isDeactivated;
        const canChangeRole = !isRowAdmin && !isSelf && !isDeactivated;
        const canResetPassword = !isOtherAdmin && !isDeactivated;
        const canDeactivate = !isRowAdmin && !isSelf && !isDeactivated;

        const isOpen = openDropdownId === row.staffId;
        const rowIndex = filteredStaff.findIndex((s) => s.staffId === row.staffId);
        const isNearBottom = filteredStaff.length > 2 && rowIndex >= filteredStaff.length - 2;

        return (
          <div className="relative inline-block text-left" data-dropdown-container>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdownId(isOpen ? null : row.staffId);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
              aria-expanded={isOpen}
            >
              <span>Actions</span>
              <svg
                className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div
                className={`absolute right-0 z-50 w-44 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 ${
                  isNearBottom ? 'bottom-full mb-1 origin-bottom-right' : 'top-full mt-1 origin-top-right'
                }`}
              >
                <div className="py-1">
                  {/* View Details - Always accessible */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdownId(null);
                      setSelectedStaff(row);
                      setIsDetailsOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="h-4 w-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>View Details</span>
                  </button>

                  {/* Edit Information */}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdownId(null);
                        setSelectedStaff(row);
                        setIsEditOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <svg className="h-4 w-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Information</span>
                    </button>
                  )}

                  {/* Change Role */}
                  {canChangeRole && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdownId(null);
                        setSelectedStaff(row);
                        setIsRoleOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-50 transition-colors"
                    >
                      <svg className="h-4 w-4 text-purple-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Change Role</span>
                    </button>
                  )}

                  {/* Reset Password */}
                  {canResetPassword && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdownId(null);
                        setSelectedStaff(row);
                        setIsResetPasswordOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <svg className="h-4 w-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span>Reset Password</span>
                    </button>
                  )}
                </div>

                {/* Deactivate */}
                {canDeactivate && (
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdownId(null);
                        setSelectedStaff(row);
                        setIsDeactivateConfirmOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="h-4 w-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <span>Deactivate</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <AdminLayout pageTitle="Staff Management">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Staff Accounts</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Create, update, assign roles, reset credentials, and manage staff access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStaff}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg
              className={['h-4 w-4', isLoading ? 'animate-spin' : ''].join(' ')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Create Staff
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3">
          <svg className="h-5 w-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold">Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters & Search Card */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by username, name, email, staff no, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-xs font-semibold uppercase text-gray-500">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses ({staffList.length})</option>
              <option value="ACTIVE">
                Active ({staffList.filter((s) => s.status === 'ACTIVE').length})
              </option>
              <option value="DEACTIVATED">
                Deactivated ({staffList.filter((s) => s.status === 'DEACTIVATED').length})
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Showing {filteredStaff.length} of {staffList.length} staff records
          </p>
        </div>

        <div className="p-4 min-h-[360px]">
          <DataTable
            columns={columns}
            data={filteredStaff}
            isLoading={isLoading}
            emptyMessage={
              searchTerm || statusFilter !== 'ALL'
                ? 'No staff members match the selected search/filter criteria.'
                : 'No staff members registered in the system.'
            }
            keyExtractor={(row: StaffResponse) => row.staffId}
          />
        </div>
      </div>

      {/* Modals */}
      <StaffCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          handleShowSuccess('Staff account created successfully.');
          loadStaff();
        }}
      />

      <StaffDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        staff={selectedStaff}
        onEdit={(staff) => {
          setSelectedStaff(staff);
          setIsEditOpen(true);
        }}
        onChangeRole={(staff) => {
          setSelectedStaff(staff);
          setIsRoleOpen(true);
        }}
        onResetPassword={(staff) => {
          setSelectedStaff(staff);
          setIsResetPasswordOpen(true);
        }}
      />

      <StaffEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        staff={selectedStaff}
        onSuccess={() => {
          handleShowSuccess('Staff information updated successfully.');
          loadStaff();
        }}
      />

      <StaffRoleModal
        isOpen={isRoleOpen}
        onClose={() => setIsRoleOpen(false)}
        staff={selectedStaff}
        onSuccess={() => {
          handleShowSuccess('Staff role and Staff No. updated successfully.');
          loadStaff();
        }}
      />

      <StaffResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        staff={selectedStaff}
        onSuccess={() => {
          handleShowSuccess('Password setup link has been sent to staff email.');
          loadStaff();
        }}
      />

      <ConfirmModal
        isOpen={isDeactivateConfirmOpen}
        onClose={() => setIsDeactivateConfirmOpen(false)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Staff Account"
        message={`Are you sure you want to deactivate staff account "${selectedStaff?.username}"? This will immediately revoke their active sessions and prevent future logins.`}
        confirmText="Deactivate Staff"
        variant="danger"
        isLoading={deactivateLoading}
      />
    </AdminLayout>
  );
}
