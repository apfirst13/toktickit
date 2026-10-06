import { useEffect, useState } from "react";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

interface UserManagementProps {
  currentUser: { id: number; role: string; fullName: string };
}

export function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT" | "RESET">("CREATE");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: "IT_STAFF",
    isActive: true,
    initialPassword: ""
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("isActive", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` }
      });
      
      if (res.status === 401 || res.status === 403) {
        setError("You do not have permission to view this page.");
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser.role === 'ADMINISTRATOR') {
      fetchUsers();
    } else {
      setError("You do not have permission to view this page.");
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, currentUser.role]);

  const openCreateModal = () => {
    setModalMode("CREATE");
    setSelectedUser(null);
    setFormData({ email: "", fullName: "", role: "IT_STAFF", isActive: true, initialPassword: "" });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setModalMode("EDIT");
    setSelectedUser(user);
    setFormData({ email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive, initialPassword: "" });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openResetModal = (user: User) => {
    setModalMode("RESET");
    setSelectedUser(user);
    setFormData({ ...formData, initialPassword: "" });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      let url = "/api/admin/users";
      let method = "POST";
      let body: any = {};

      if (modalMode === "CREATE") {
        if (!formData.email || !formData.fullName || !formData.initialPassword) {
          throw new Error("Please fill out all required fields.");
        }
        body = {
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
          initialPassword: formData.initialPassword
        };
      } else if (modalMode === "EDIT" && selectedUser) {
        url = `/api/admin/users/${selectedUser.id}`;
        method = "PATCH";
        body = {
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
          isActive: formData.isActive
        };
      } else if (modalMode === "RESET" && selectedUser) {
        if (!formData.initialPassword) {
          throw new Error("Password is required.");
        }
        url = `/api/admin/users/${selectedUser.id}/reset-password`;
        method = "POST";
        body = { initialPassword: formData.initialPassword };
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "An error occurred while saving.");
      }

      setSuccessMessage(modalMode === "CREATE" ? "User created successfully." : modalMode === "RESET" ? "Password reset successfully." : "User updated successfully.");
      setIsModalOpen(false);
      fetchUsers();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, initialPassword: pass });
  };

  if (error === "You do not have permission to view this page.") {
    return (
      <div className="container mt-4" data-testid="forbidden-message">
        <div className="alert alert-danger">
          <h4>Forbidden</h4>
          <p>You do not have permission to access the Administrator area.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>User Management</h2>
        <button className="btn btn-primary" onClick={openCreateModal} data-testid="create-user-btn">
          + Create User
        </button>
      </div>

      {successMessage && (
        <div className="alert alert-success" data-testid="success-message">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" data-testid="error-message">
          {error}
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="search-input"
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                data-testid="role-filter"
              >
                <option value="">All Roles</option>
                <option value="ADMINISTRATOR">Administrator</option>
                <option value="IT_STAFF">IT Staff</option>
                <option value="REQUESTER">Requester</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                data-testid="status-filter"
              >
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div data-testid="loading-indicator">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="alert alert-info" data-testid="empty-message">
          No users match your filters.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} data-testid={`user-row-${u.id}`}>
                  <td>{u.id}</td>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMINISTRATOR' ? 'bg-danger' : u.role === 'IT_STAFF' ? 'bg-primary' : 'bg-secondary'}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'bg-success' : 'bg-dark'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => openEditModal(u)} data-testid={`edit-btn-${u.id}`}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-outline-warning" onClick={() => openResetModal(u)} data-testid={`reset-btn-${u.id}`}>
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSave}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {modalMode === "CREATE" ? "Create User" : modalMode === "EDIT" ? "Edit User" : "Reset Password"}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
                </div>
                <div className="modal-body">
                  {formError && (
                    <div className="alert alert-danger" data-testid="modal-error">
                      {formError}
                    </div>
                  )}

                  {(modalMode === "CREATE" || modalMode === "EDIT") && (
                    <>
                      <div className="mb-3">
                        <label htmlFor="umEmail" className="form-label">Email address</label>
                        <input
                          id="umEmail"
                          type="email"
                          className="form-control"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          data-testid="input-email"
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="umFullName" className="form-label">Full Name</label>
                        <input
                          id="umFullName"
                          type="text"
                          className="form-control"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          data-testid="input-fullname"
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="umRole" className="form-label">Role</label>
                        <select
                          id="umRole"
                          className="form-select"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          data-testid="input-role"
                        >
                          <option value="REQUESTER">Requester</option>
                          <option value="IT_STAFF">IT Staff</option>
                          <option value="ADMINISTRATOR">Administrator</option>
                        </select>
                      </div>
                    </>
                  )}

                  {modalMode === "EDIT" && (
                    <div className="mb-3 form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="isActiveCheck"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        data-testid="input-isactive"
                      />
                      <label className="form-check-label" htmlFor="isActiveCheck">
                        Account is Active
                      </label>
                    </div>
                  )}

                  {(modalMode === "CREATE" || modalMode === "RESET") && (
                    <div className="mb-3">
                      <label htmlFor="umTempPassword" className="form-label">Temporary Password</label>
                      <div className="input-group">
                        <input
                          id="umTempPassword"
                          type="text"
                          className="form-control"
                          required
                          value={formData.initialPassword}
                          onChange={(e) => setFormData({ ...formData, initialPassword: e.target.value })}
                          data-testid="input-password"
                        />
                        <button type="button" className="btn btn-outline-secondary" onClick={generatePassword} data-testid="generate-pw-btn">
                          Generate
                        </button>
                      </div>
                      <small className="text-muted">The user will be forced to change this upon first login.</small>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving} data-testid="save-btn">
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
