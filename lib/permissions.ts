// Central place for role → capability checks so pages and API routes agree.
export type Role = "OWNER" | "ADMIN" | "STAFF";

export const permissions = {
  canDeleteCustomer: (role: Role) => role === "OWNER" || role === "ADMIN",
  canDeleteTicket: (role: Role) => role === "OWNER" || role === "ADMIN",
  canManageStaff: (role: Role) => role === "OWNER",
  canEditBusinessSettings: (role: Role) => role === "OWNER",
  canViewReports: (role: Role) => role === "OWNER" || role === "ADMIN",
};
