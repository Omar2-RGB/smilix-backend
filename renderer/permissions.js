const permissions = {
  admin: ["dashboard", "patients", "appointments", "treatments", "payments", "invoices", "users"],

  doctor: ["dashboard", "patients", "appointments", "treatments"],

  receptionist: ["dashboard", "patients", "appointments"],

  accountant: ["dashboard", "payments", "invoices"]
};

function canAccess(page) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user || !user.role) return false;

  const allowed = permissions[user.role] || [];
  return allowed.includes(page);
}