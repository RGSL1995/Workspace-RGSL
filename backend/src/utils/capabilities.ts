/**
 * Capability-based access control system
 * Defines what each role can do in the system
 */

export const CAPABILITIES = {
  // BUSINESS OPERATIONS
  VIEW_ANALYTICS: "view_company_analytics",
  MANAGE_EMPLOYEES: "manage_employees",
  MANAGE_DEPARTMENTS: "manage_departments",
  MANAGE_MAILBOXES: "manage_mailbox_access",
  MONITOR_WORKLOAD: "monitor_workload",
  CONNECT_EMAIL: "connect_personal_email",

  // TECHNICAL OPERATIONS
  MANAGE_SYSTEM: "manage_system_settings",
  MANAGE_SECURITY: "manage_security",
  MANAGE_DATABASE: "manage_database",
  VIEW_LOGS: "view_logs",
  MANAGE_INTEGRATIONS: "manage_integrations",
  MANAGE_BACKUPS: "manage_backups",
  MANAGE_USERS: "manage_users",
  ACCESS_ALL: "access_all_features",
};

/**
 * Default capabilities for each role
 */
export const ROLE_CAPABILITIES: Record<string, string[]> = {
  super_admin: [
    // Organization Head - BUSINESS FOCUSED
    CAPABILITIES.VIEW_ANALYTICS,
    CAPABILITIES.MANAGE_EMPLOYEES,
    CAPABILITIES.MANAGE_DEPARTMENTS,
    CAPABILITIES.MANAGE_MAILBOXES,
    CAPABILITIES.MONITOR_WORKLOAD,
    CAPABILITIES.CONNECT_EMAIL,
  ],

  it_admin: [
    // IT Admin - FULL ACCESS (Business + Technical)
    // BUSINESS OPS
    CAPABILITIES.VIEW_ANALYTICS,
    CAPABILITIES.MANAGE_EMPLOYEES,
    CAPABILITIES.MANAGE_DEPARTMENTS,
    CAPABILITIES.MANAGE_MAILBOXES,
    CAPABILITIES.MONITOR_WORKLOAD,
    CAPABILITIES.CONNECT_EMAIL,
    // TECHNICAL OPS
    CAPABILITIES.MANAGE_SYSTEM,
    CAPABILITIES.MANAGE_SECURITY,
    CAPABILITIES.MANAGE_DATABASE,
    CAPABILITIES.VIEW_LOGS,
    CAPABILITIES.MANAGE_INTEGRATIONS,
    CAPABILITIES.MANAGE_BACKUPS,
    CAPABILITIES.MANAGE_USERS,
    CAPABILITIES.ACCESS_ALL,
  ],

  department_head: [
    // Department Head - LIMITED
    CAPABILITIES.VIEW_ANALYTICS,
    CAPABILITIES.MANAGE_EMPLOYEES,
    CAPABILITIES.MONITOR_WORKLOAD,
  ],

  department_person: [
    // Regular Employee - MINIMAL
    CAPABILITIES.CONNECT_EMAIL,
  ],
};

/**
 * Check if a role has a specific capability
 */
export const hasCapability = (
  role: string,
  capability: string,
  customCapabilities?: string[]
): boolean => {
  // If user has custom capabilities, use those
  if (customCapabilities && customCapabilities.length > 0) {
    return customCapabilities.includes(capability);
  }

  // Otherwise use role defaults
  const roleCapabilities = ROLE_CAPABILITIES[role] || [];
  return roleCapabilities.includes(capability);
};

/**
 * Get all capabilities for a role
 */
export const getRoleCapabilities = (
  role: string,
  customCapabilities?: string[]
): string[] => {
  if (customCapabilities && customCapabilities.length > 0) {
    return customCapabilities;
  }
  return ROLE_CAPABILITIES[role] || [];
};

/**
 * Get display name for capability
 */
export const getCapabilityLabel = (capability: string): string => {
  const labels: Record<string, string> = {
    [CAPABILITIES.VIEW_ANALYTICS]: "View Company Analytics",
    [CAPABILITIES.MANAGE_EMPLOYEES]: "Manage Employees",
    [CAPABILITIES.MANAGE_DEPARTMENTS]: "Manage Departments",
    [CAPABILITIES.MANAGE_MAILBOXES]: "Manage Shared Mailboxes",
    [CAPABILITIES.MONITOR_WORKLOAD]: "Monitor Workload",
    [CAPABILITIES.CONNECT_EMAIL]: "Connect Personal Email",
    [CAPABILITIES.MANAGE_SYSTEM]: "Manage System Settings",
    [CAPABILITIES.MANAGE_SECURITY]: "Manage Security",
    [CAPABILITIES.MANAGE_DATABASE]: "Manage Database",
    [CAPABILITIES.VIEW_LOGS]: "View Logs & Monitoring",
    [CAPABILITIES.MANAGE_INTEGRATIONS]: "Manage Integrations",
    [CAPABILITIES.MANAGE_BACKUPS]: "Manage Backups",
    [CAPABILITIES.MANAGE_USERS]: "Manage Users",
    [CAPABILITIES.ACCESS_ALL]: "Access All Features",
  };

  return labels[capability] || capability;
};
