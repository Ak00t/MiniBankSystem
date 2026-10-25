import { useState, useEffect, type FormEvent } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { staffApi } from '../../../services/apiClient';
import type { StaffResponse, StaffRoleOption } from '../../../types/api.types';
import type { AxiosError } from 'axios';

interface StaffRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffResponse | null;
  onSuccess: () => void;
}

interface DisplayRole {
  id: number;
  code: string;
  label: string;
  description: string;
}

const FALLBACK_ROLES: DisplayRole[] = [
  { id: 1, code: 'ADMIN', label: 'Administrator', description: 'Full access to all system configurations, staff management, and oversight.' },
  { id: 2, code: 'TELLER', label: 'Teller', description: 'Handles day-to-day transactions, customer onboarding, and account services.' },
  { id: 4, code: 'AUDITOR', label: 'Auditor', description: 'Read-only audit inspection, compliance tracking, and report generation.' },
];

export default function StaffRoleModal({
  isOpen,
  onClose,
  staff,
  onSuccess,
}: StaffRoleModalProps) {
  const [roles, setRoles] = useState<DisplayRole[]>(FALLBACK_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch roles dynamically from backend to match exact database IDs
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    staffApi
      .getRoles()
      .then((res) => {
        if (!isMounted) return;
        const permitted = (res.data || [])
          .filter((r: StaffRoleOption) => {
            const code = (r.roleCode || '').toUpperCase();
            return ['ADMIN', 'TELLER', 'AUDITOR'].includes(code);
          })
          .map((r: StaffRoleOption) => ({
            id: r.roleId,
            code: r.roleCode.toUpperCase(),
            label: r.roleName || r.roleCode,
            description:
              r.description ||
              (r.roleCode === 'ADMIN'
                ? 'Full access to all system configurations, staff management, and oversight.'
                : r.roleCode === 'TELLER'
                ? 'Handles day-to-day transactions, customer onboarding, and account services.'
                : 'Read-only audit inspection, compliance tracking, and report generation.'),
          }));

        if (permitted.length > 0) {
          setRoles(permitted);
        }
      })
      .catch(() => {
        setRoles(FALLBACK_ROLES);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Set default selection when modal opens or staff changes
  useEffect(() => {
    if (staff) {
      setApiError(null);
      // If current role is known, default selectedRoleId to a different target role (e.g. ADMIN)
      const currentCode = (staff.roleCode || '').toUpperCase();
      if (currentCode === 'TELLER' || currentCode === 'AUDITOR') {
        const adminRole = roles.find((r) => r.code === 'ADMIN');
        if (adminRole) {
          setSelectedRoleId(adminRole.id);
          return;
        }
      }
      // Otherwise default to the first role that is NOT current
      const differentRole = roles.find((r) => r.id !== staff.roleId);
      if (differentRole) {
        setSelectedRoleId(differentRole.id);
      }
    }
  }, [staff, roles]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!staff) return;

    if (staff.roleId && staff.roleId === selectedRoleId) {
      setApiError('Staff member is already assigned to this role.');
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      await staffApi.changeRole(staff.staffId, { roleId: selectedRoleId });
      onSuccess();
      onClose();
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      if (error.response?.data?.message) {
        setApiError(error.response.data.message);
      } else {
        setApiError('Failed to change staff role.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!staff) return null;

  const currentRoleCode = staff.roleCode || (staff.staffNo.includes('TLR') ? 'TELLER' : staff.staffNo.includes('AUD') ? 'AUDITOR' : staff.staffNo.includes('ADM') ? 'ADMIN' : 'UNKNOWN');
  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isSameRole = staff.roleId ? staff.roleId === selectedRoleId : staff.roleCode === selectedRole?.code;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Change Role: ${staff.fullName || staff.username}`}
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={isLoading}
            disabled={isSameRole || isLoading}
            onClick={handleSubmit}
          >
            Update Role
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {apiError}
          </div>
        )}

        {/* Current Staff Information Banner */}
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium">Current Staff No:</span>
            <span className="font-mono font-bold text-gray-800">{staff.staffNo}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium">Current Assigned Role:</span>
            <span className="rounded bg-blue-100 text-blue-800 font-semibold px-2 py-0.5">
              {staff.roleName || currentRoleCode}
            </span>
          </div>
        </div>

        {/* Dynamic ID Update Notice */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Dynamic Staff ID Update Notice
          </p>
          <p className="text-blue-800">
            When an Admin changes a Teller's or Auditor's role to <strong>Admin</strong> (or between roles), their <strong>Staff No.</strong> automatically updates to reflect the new role prefix (e.g. <span className="font-mono font-medium">STF-ADM-XXXX</span>).
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Select New Target Role
          </label>
          <div className="space-y-2">
            {roles.map((role) => {
              const isCurrent = (staff.roleId && staff.roleId === role.id) || staff.roleCode === role.code;
              return (
                <label
                  key={role.id}
                  className={[
                    'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                    isCurrent
                      ? 'border-gray-200 bg-gray-50/70 opacity-70 cursor-not-allowed'
                      : selectedRoleId === role.id
                      ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 cursor-pointer'
                      : 'border-gray-200 hover:bg-gray-50 cursor-pointer',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="staffRole"
                    value={role.id}
                    checked={selectedRoleId === role.id}
                    disabled={isCurrent || isLoading}
                    onChange={() => setSelectedRoleId(role.id)}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{role.label}</span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono font-medium text-gray-600">
                          {role.code}
                        </span>
                      </div>
                      {isCurrent && (
                        <span className="text-xs text-gray-500 font-medium">
                          (Current Role)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
