// X-Hub Mockup — Mock Data
// Based on actual NDT report structure from ADNOC DALMA GAS DEVELOPMENT PROJECT

export type Role = 'MAKER' | 'OWNER';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ReportType = 'RT' | 'MT' | 'UT' | 'HT' | 'PMI' | 'OTHER';
export type TestPhase = 'BEFORE_PWHT' | 'AFTER_PWHT' | 'NA';
export type ProjectStatus = 'Active' | 'Hold' | 'Done';

export interface User {
  id: string;
  name: string;
  role: Role;
  company: string;
  email: string;
  avatar: string;
}

export interface Owner {
  id: string;
  name: string;
}

export interface Maker {
  id: string;
  name: string;
}

export interface InspectionCompany {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  status: ProjectStatus;
  totalReports: number;
  approvedReports: number;
  pendingReports: number;
  rejectedReports: number;
  lastUpdated: string;
  procedureCode: string;
}

export interface Item {
  id: string;
  projectId: string;
  name: string;
  number: string;
}

export interface RtResultRow {
  id: string;
  reportId: string;
  identificationNo: string;
  locationNo: string;
  result: 'ACC' | 'REJ';
  defect: string;
}

export interface Report {
  id: string;
  itemId: string;
  itemName: string;
  itemNumber: string;
  projectId: string;
  reportNo: string;
  reportType: ReportType;
  testPhase: TestPhase;
  inspectionCompanyId: string;
  inspectionCompanyName: string;
  issuedDate: string;
  tags: {
    drawingNo?: string;
    inspector?: string;
    procedure?: string;
    technique?: string;
  };
  ownerApprovalStatus: ApprovalStatus;
  ownerApprovedBy?: string;
  ownerApprovedAt?: string;
  ownerComment?: string;
  pdfUrl?: string;
  rtResultRows?: RtResultRow[];
}

// ─── Users ───────────────────────────────────────────────────────────────────
export const users: User[] = [
  {
    id: 'user-maker-1',
    name: 'S.K. Kim',
    role: 'MAKER',
    company: 'DS21 Co., Ltd.',
    email: 'sk.kim@ds21.co.kr',
    avatar: 'SK',
  },
  {
    id: 'user-owner-1',
    name: 'Ahmed Al-Rashidi',
    role: 'OWNER',
    company: 'ADNOC',
    email: 'a.rashidi@adnoc.ae',
    avatar: 'AR',
  },
];

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projects: Project[] = [
  {
    id: 'proj-1',
    name: 'EPC FOR DALMA GAS DEVELOPMENT PROJECT',
    ownerId: 'owner-1',
    ownerName: 'ADNOC',
    status: 'Active',
    totalReports: 12,
    approvedReports: 7,
    pendingReports: 4,
    rejectedReports: 1,
    lastUpdated: '2026-02-20',
    procedureCode: 'ASME Sec. VIII DIV.1 (2021Ed) VN0020-AZ5172-63-PRO0006_REV.A02',
  },
  {
    id: 'proj-2',
    name: 'AZ5172 LNG CARRIER WELDING INSPECTION',
    ownerId: 'owner-2',
    ownerName: 'SHI',
    status: 'Active',
    totalReports: 8,
    approvedReports: 6,
    pendingReports: 2,
    rejectedReports: 0,
    lastUpdated: '2026-02-18',
    procedureCode: 'ASME SEC.V',
  },
  {
    id: 'proj-3',
    name: 'HZ-9801 OFFSHORE PLATFORM CONSTRUCTION',
    ownerId: 'owner-3',
    ownerName: 'HHI',
    status: 'Hold',
    totalReports: 5,
    approvedReports: 3,
    pendingReports: 0,
    rejectedReports: 2,
    lastUpdated: '2026-01-28',
    procedureCode: 'API 1104',
  },
  {
    id: 'proj-4',
    name: 'QATAR LNG TERMINAL EXPANSION',
    ownerId: 'owner-4',
    ownerName: 'QatarEnergy',
    status: 'Done',
    totalReports: 20,
    approvedReports: 20,
    pendingReports: 0,
    rejectedReports: 0,
    lastUpdated: '2026-01-15',
    procedureCode: 'ASME B31.3',
  },
];

// ─── Items ────────────────────────────────────────────────────────────────────
export const items: Item[] = [
  { id: 'item-1', projectId: 'proj-1', name: 'WATER FLASH VESSEL', number: 'AZ5172-V-003' },
  { id: 'item-2', projectId: 'proj-1', name: 'SEPARATOR VESSEL', number: 'AZ5172-V-001' },
  { id: 'item-3', projectId: 'proj-1', name: 'GAS SCRUBBER', number: 'AZ5172-V-005' },
  { id: 'item-4', projectId: 'proj-2', name: 'MAIN DECK WELDING JOINT', number: 'WJ-2024-001' },
  { id: 'item-5', projectId: 'proj-3', name: 'PIPELINE CONNECTION JOINT', number: 'PL-2024-045' },
];

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reports: Report[] = [
  // ── AZ5172-V-003 (Water Flash Vessel) ──
  {
    id: 'rep-1',
    itemId: 'item-1',
    itemName: 'WATER FLASH VESSEL',
    itemNumber: 'AZ5172-V-003',
    projectId: 'proj-1',
    reportNo: 'KG-DALMA-RT-005',
    reportType: 'RT',
    testPhase: 'AFTER_PWHT',
    inspectionCompanyId: 'ic-1',
    inspectionCompanyName: 'KUMGA Co., Ltd.',
    issuedDate: '2026-02-01',
    tags: {
      drawingNo: 'VN0200-AZ5172-24-GAS-0005_REV.B03',
      inspector: 'Suk-Joo Park (Level II)',
      procedure: 'ASME Sec.V Art.2',
      technique: 'X-RAY',
    },
    ownerApprovalStatus: 'PENDING',
    rtResultRows: [
      { id: 'rr-1', reportId: 'rep-1', identificationNo: 'CWL1', locationNo: '1-2', result: 'ACC', defect: 'None' },
      { id: 'rr-2', reportId: 'rep-1', identificationNo: 'CWL1', locationNo: '2-3', result: 'ACC', defect: 'None' },
      { id: 'rr-3', reportId: 'rep-1', identificationNo: 'CWL1', locationNo: '3-4', result: 'ACC', defect: 'None' },
      { id: 'rr-4', reportId: 'rep-1', identificationNo: 'CWL2', locationNo: '1-2', result: 'ACC', defect: 'None' },
      { id: 'rr-5', reportId: 'rep-1', identificationNo: 'CWL2', locationNo: '2-3', result: 'ACC', defect: 'None' },
      { id: 'rr-6', reportId: 'rep-1', identificationNo: 'LWL1', locationNo: '1-2', result: 'REJ', defect: 'PO' },
      { id: 'rr-7', reportId: 'rep-1', identificationNo: 'LWL1', locationNo: '2-3', result: 'ACC', defect: 'None' },
      { id: 'rr-8', reportId: 'rep-1', identificationNo: 'LWL2', locationNo: '1-2', result: 'ACC', defect: 'None' },
    ],
  },
  {
    id: 'rep-2',
    itemId: 'item-1',
    itemName: 'WATER FLASH VESSEL',
    itemNumber: 'AZ5172-V-003',
    projectId: 'proj-1',
    reportNo: 'KG-DALMA-RT-003',
    reportType: 'RT',
    testPhase: 'BEFORE_PWHT',
    inspectionCompanyId: 'ic-1',
    inspectionCompanyName: 'KUMGA Co., Ltd.',
    issuedDate: '2026-01-15',
    tags: {
      drawingNo: 'VN0200-AZ5172-24-GAS-0005_REV.B02',
      inspector: 'Suk-Joo Park (Level II)',
      procedure: 'ASME Sec.V Art.2',
      technique: 'X-RAY',
    },
    ownerApprovalStatus: 'APPROVED',
    ownerApprovedBy: 'Ahmed Al-Rashidi',
    ownerApprovedAt: '2026-01-20',
    ownerComment: 'Reviewed and confirmed. All results acceptable.',
    rtResultRows: [
      { id: 'rr-9', reportId: 'rep-2', identificationNo: 'CWL1', locationNo: '1-2', result: 'ACC', defect: 'None' },
      { id: 'rr-10', reportId: 'rep-2', identificationNo: 'CWL1', locationNo: '2-3', result: 'ACC', defect: 'None' },
      { id: 'rr-11', reportId: 'rep-2', identificationNo: 'CWL2', locationNo: '1-2', result: 'REJ', defect: 'CR' },
      { id: 'rr-12', reportId: 'rep-2', identificationNo: 'CWL2', locationNo: '2-3', result: 'ACC', defect: 'None' },
    ],
  },
  {
    id: 'rep-3',
    itemId: 'item-1',
    itemName: 'WATER FLASH VESSEL',
    itemNumber: 'AZ5172-V-003',
    projectId: 'proj-1',
    reportNo: 'KG-DALMA-MT-001',
    reportType: 'MT',
    testPhase: 'NA',
    inspectionCompanyId: 'ic-1',
    inspectionCompanyName: 'KUMGA Co., Ltd.',
    issuedDate: '2026-01-25',
    tags: {
      drawingNo: 'VN0200-AZ5172-24-GAS-0005_REV.B03',
      inspector: 'Jae-Sung Moon (Level III)',
      procedure: 'ASME Sec.V Art.7',
      technique: 'Wet Fluorescent MT',
    },
    ownerApprovalStatus: 'APPROVED',
    ownerApprovedBy: 'Ahmed Al-Rashidi',
    ownerApprovedAt: '2026-01-30',
    pdfUrl: '#mock-pdf',
  },
  {
    id: 'rep-4',
    itemId: 'item-1',
    itemName: 'WATER FLASH VESSEL',
    itemNumber: 'AZ5172-V-003',
    projectId: 'proj-1',
    reportNo: 'KG-DALMA-HT-002',
    reportType: 'HT',
    testPhase: 'AFTER_PWHT',
    inspectionCompanyId: 'ic-2',
    inspectionCompanyName: 'UMGA Co., Ltd.',
    issuedDate: '2026-02-05',
    tags: {
      drawingNo: 'VN0200-AZ5172-24-GAS-0005_REV.B03',
      inspector: 'Min-Ho Lee (Level II)',
      procedure: 'ASME Sec.V Art.18',
    },
    ownerApprovalStatus: 'PENDING',
    pdfUrl: '#mock-pdf',
  },
  // ── AZ5172-V-001 (Separator Vessel) ──
  {
    id: 'rep-5',
    itemId: 'item-2',
    itemName: 'SEPARATOR VESSEL',
    itemNumber: 'AZ5172-V-001',
    projectId: 'proj-1',
    reportNo: 'KG-DALMA-RT-002',
    reportType: 'RT',
    testPhase: 'AFTER_PWHT',
    inspectionCompanyId: 'ic-1',
    inspectionCompanyName: 'KUMGA Co., Ltd.',
    issuedDate: '2026-01-30',
    tags: {
      drawingNo: 'VN0200-AZ5172-24-GAS-0002',
      inspector: 'J.H. Park (Level II)',
    },
    ownerApprovalStatus: 'APPROVED',
    ownerApprovedBy: 'Ahmed Al-Rashidi',
    ownerApprovedAt: '2026-02-05',
    rtResultRows: [
      { id: 'rr-13', reportId: 'rep-5', identificationNo: 'CWL1', locationNo: '1-2', result: 'ACC', defect: 'None' },
      { id: 'rr-14', reportId: 'rep-5', identificationNo: 'CWL1', locationNo: '2-3', result: 'ACC', defect: 'None' },
      { id: 'rr-15', reportId: 'rep-5', identificationNo: 'CWL2', locationNo: '1-2', result: 'ACC', defect: 'None' },
    ],
  },
  {
    id: 'rep-6',
    itemId: 'item-2',
    itemName: 'SEPARATOR VESSEL',
    itemNumber: 'AZ5172-V-001',
    projectId: 'proj-1',
    reportNo: 'KG-DALMA-MT-002',
    reportType: 'MT',
    testPhase: 'NA',
    inspectionCompanyId: 'ic-1',
    inspectionCompanyName: 'KUMGA Co., Ltd.',
    issuedDate: '2026-02-10',
    tags: { inspector: 'Jae-Sung Moon (Level III)' },
    ownerApprovalStatus: 'REJECTED',
    ownerApprovedBy: 'Ahmed Al-Rashidi',
    ownerApprovedAt: '2026-02-15',
    ownerComment: 'Additional inspection required for weld zone W-12.',
    pdfUrl: '#mock-pdf',
  },
];

// ─── Helper functions ─────────────────────────────────────────────────────────
export function getItemsByProjectId(projectId: string): Item[] {
  return items.filter(i => i.projectId === projectId);
}

export function getReportsByItemId(itemId: string): Report[] {
  return reports.filter(r => r.itemId === itemId);
}

export function getReportsByProjectId(projectId: string): Report[] {
  return reports.filter(r => r.projectId === projectId);
}

export function getReportById(id: string): Report | undefined {
  return reports.find(r => r.id === id);
}

export function getProjectById(id: string): Project | undefined {
  return projects.find(p => p.id === id);
}

export function getItemById(id: string): Item | undefined {
  return items.find(i => i.id === id);
}
