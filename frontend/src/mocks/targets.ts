export interface MockTarget {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  personalContext: string;
}

export const MOCK_TARGETS: MockTarget[] = [
  {
    id: 'target-alice',
    name: 'Alice Johnson',
    email: 'alice.johnson@meridian.example',
    department: 'Finance',
    role: 'AP Manager',
    personalContext: 'Owns month-end payment approvals and prefers concise operational updates.',
  },
  {
    id: 'target-bilal',
    name: 'Bilal Hassan',
    email: 'bilal.hassan@meridian.example',
    department: 'Finance',
    role: 'Financial Analyst',
    personalContext: 'Frequently coordinates with procurement and uses Microsoft 365 for approvals.',
  },
  {
    id: 'target-sana',
    name: 'Sana Iqbal',
    email: 'sana.iqbal@meridian.example',
    department: 'Human Resources',
    role: 'People Operations Coordinator',
    personalContext: 'Manages onboarding workflows and tends to respond quickly to time-sensitive HR notices.',
  },
  {
    id: 'target-omar',
    name: 'Omar Farooq',
    email: 'omar.farooq@meridian.example',
    department: 'Operations',
    role: 'Operations Lead',
    personalContext: 'Works across regional offices and often receives vendor and logistics updates by email.',
  },
];
