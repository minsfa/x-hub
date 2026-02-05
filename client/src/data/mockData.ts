// X-Hub Mock Data based on provided Excel dummy table

export interface Project {
  id: string;
  name: string;
  customer: string;
  procedureCode: string;
  status: 'Active' | 'Hold' | 'Done';
  progress: number;
  pendingCount: number;
  lastUpdated: string;
}

export interface Report {
  id: string;
  projectId: string;
  reportNo: string;
  drawingNo: string;
  itemName: string;
  itemNo: string;
  inspector: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Study {
  id: string;
  reportId: string;
  identificationNo: string;
  status: 'ACC' | 'REJ' | 'Pending';
}

export interface ImageData {
  id: string;
  studyId: string;
  locationNo: string;
  result: 'ACC' | 'REJ';
  defect: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
}

// Projects
export const projects: Project[] = [
  {
    id: 'proj-1',
    name: 'EPC FOR DALMA GAS DEVELOPMENT PROJECT 4331433',
    customer: 'ADNOC',
    procedureCode: 'ASME Sec. VIII DIV.1 (2021Ed) VN0020-AZ5172-63-PRO0006_REV.A02',
    status: 'Active',
    progress: 45,
    pendingCount: 3,
    lastUpdated: '2026-02-01'
  },
  {
    id: 'proj-2',
    name: 'AZ5172 LNG Carrier Welding Inspection',
    customer: 'SHI',
    procedureCode: 'ASME SEC.V',
    status: 'Active',
    progress: 72,
    pendingCount: 2,
    lastUpdated: '2026-02-03'
  },
  {
    id: 'proj-3',
    name: 'HZ-9801 Offshore Platform Construction',
    customer: 'HHI',
    procedureCode: 'API 1104',
    status: 'Hold',
    progress: 30,
    pendingCount: 0,
    lastUpdated: '2026-01-28'
  },
  {
    id: 'proj-4',
    name: 'KS-2156 Shipbuilding Project',
    customer: 'DSME',
    procedureCode: 'KS B 0845',
    status: 'Active',
    progress: 88,
    pendingCount: 0,
    lastUpdated: '2026-02-04'
  },
  {
    id: 'proj-5',
    name: 'Qatar LNG Terminal Expansion',
    customer: 'QatarEnergy',
    procedureCode: 'ASME B31.3',
    status: 'Done',
    progress: 100,
    pendingCount: 0,
    lastUpdated: '2026-01-15'
  }
];

// Reports
export const reports: Report[] = [
  // DALMA GAS PROJECT Reports
  {
    id: 'rep-1',
    projectId: 'proj-1',
    reportNo: 'KG-DALMA-RT-005',
    drawingNo: 'VN0200-AZ5172-24-GAS-0005_REV.B03',
    itemName: 'WATER FLASH VESSEL',
    itemNo: 'AZ5172-V-003 (After P.W.H.T)',
    inspector: 'S.K.Kim',
    date: '2026-02-01',
    status: 'Pending'
  },
  {
    id: 'rep-2',
    projectId: 'proj-1',
    reportNo: 'KG-DALMA-RT-001',
    drawingNo: 'VN0200-AZ5172-24',
    itemName: 'WATER FLASH VESSEL',
    itemNo: 'AZ5172-HDC-001A',
    inspector: 'S.K.Kim',
    date: '2026-02-01',
    status: 'Pending'
  },
  {
    id: 'rep-3',
    projectId: 'proj-1',
    reportNo: 'KG-DALMA-RT-002',
    drawingNo: 'VN0200-AZ5172-24-GAS-0002',
    itemName: 'SEPARATOR VESSEL',
    itemNo: 'AZ5172-V-001',
    inspector: 'J.H.Park',
    date: '2026-01-30',
    status: 'Approved'
  },
  // SHI LNG Carrier Reports
  {
    id: 'rep-4',
    projectId: 'proj-2',
    reportNo: 'RT-001',
    drawingNo: 'AZ5172-V-003',
    itemName: 'Main Deck Welding Joint',
    itemNo: 'WJ-2024-001',
    inspector: 'Kim Young-ho',
    date: '2026-02-02',
    status: 'Pending'
  },
  {
    id: 'rep-5',
    projectId: 'proj-2',
    reportNo: 'RT-002',
    drawingNo: 'AZ5172-V-003',
    itemName: 'Main Deck Welding Joint',
    itemNo: 'WJ-2024-001',
    inspector: 'Kim Young-ho',
    date: '2026-02-03',
    status: 'Approved'
  },
  // HHI Offshore Reports
  {
    id: 'rep-6',
    projectId: 'proj-3',
    reportNo: 'RT-003',
    drawingNo: 'HZ-9801-P-015',
    itemName: 'Pipeline Connection Joint',
    itemNo: 'PL-2024-045',
    inspector: 'Lee Sang-woo',
    date: '2026-01-25',
    status: 'Approved'
  },
  // DSME Shipbuilding Reports
  {
    id: 'rep-7',
    projectId: 'proj-4',
    reportNo: 'RT-004',
    drawingNo: 'KS-2156-S-022',
    itemName: 'Ship Frame Welding',
    itemNo: 'SF-2024-078',
    inspector: 'Choi Jung-min',
    date: '2026-02-04',
    status: 'Approved'
  }
];

// Studies (Joints)
export const studies: Study[] = [
  // KG-DALMA-RT-005 Studies
  { id: 'study-1', reportId: 'rep-1', identificationNo: 'CWL1', status: 'ACC' },
  { id: 'study-2', reportId: 'rep-1', identificationNo: 'CWL2', status: 'ACC' },
  { id: 'study-3', reportId: 'rep-1', identificationNo: 'CWL3', status: 'Pending' },
  
  // KG-DALMA-RT-001 Studies
  { id: 'study-4', reportId: 'rep-2', identificationNo: 'CWL1', status: 'REJ' },
  { id: 'study-5', reportId: 'rep-2', identificationNo: 'CWL2', status: 'REJ' },
  
  // KG-DALMA-RT-002 Studies
  { id: 'study-6', reportId: 'rep-3', identificationNo: 'CWL1', status: 'ACC' },
  { id: 'study-7', reportId: 'rep-3', identificationNo: 'CWL2', status: 'ACC' },
  
  // RT-001 (SHI) Studies
  { id: 'study-8', reportId: 'rep-4', identificationNo: 'WJ-001', status: 'ACC' },
  { id: 'study-9', reportId: 'rep-4', identificationNo: 'WJ-002', status: 'REJ' },
  
  // RT-002 (SHI) Studies
  { id: 'study-10', reportId: 'rep-5', identificationNo: 'WJ-003', status: 'ACC' },
  
  // RT-003 (HHI) Studies
  { id: 'study-11', reportId: 'rep-6', identificationNo: 'PL-001', status: 'REJ' },
  
  // RT-004 (DSME) Studies
  { id: 'study-12', reportId: 'rep-7', identificationNo: 'SF-001', status: 'ACC' }
];

// Images (Film Strip)
export const images: ImageData[] = [
  // CWL1 from KG-DALMA-RT-005
  { id: 'img-1', studyId: 'study-1', locationNo: '1-2', result: 'ACC', defect: 'None', approvalStatus: 'Approved' },
  { id: 'img-2', studyId: 'study-1', locationNo: '2-3', result: 'ACC', defect: 'None', approvalStatus: 'Approved' },
  { id: 'img-3', studyId: 'study-1', locationNo: '3-1', result: 'ACC', defect: 'None', approvalStatus: 'Pending' },
  
  // CWL2 from KG-DALMA-RT-005
  { id: 'img-4', studyId: 'study-2', locationNo: '1-2', result: 'ACC', defect: 'None', approvalStatus: 'Approved' },
  { id: 'img-5', studyId: 'study-2', locationNo: '2-3', result: 'ACC', defect: 'None', approvalStatus: 'Pending' },
  
  // CWL3 from KG-DALMA-RT-005
  { id: 'img-6', studyId: 'study-3', locationNo: '1-2', result: 'ACC', defect: 'None', approvalStatus: 'Pending' },
  { id: 'img-7', studyId: 'study-3', locationNo: '2-3', result: 'ACC', defect: 'None', approvalStatus: 'Pending' },
  
  // CWL1 from KG-DALMA-RT-001 (REJ)
  { id: 'img-8', studyId: 'study-4', locationNo: '1-2', result: 'REJ', defect: 'PO', approvalStatus: 'Pending' },
  { id: 'img-9', studyId: 'study-4', locationNo: '2-3', result: 'REJ', defect: 'CR', approvalStatus: 'Pending' },
  { id: 'img-10', studyId: 'study-4', locationNo: '3-1', result: 'REJ', defect: 'LF', approvalStatus: 'Pending' },
  
  // CWL2 from KG-DALMA-RT-001 (REJ)
  { id: 'img-11', studyId: 'study-5', locationNo: '1-2', result: 'REJ', defect: 'PO', approvalStatus: 'Pending' },
  { id: 'img-12', studyId: 'study-5', locationNo: '2-3', result: 'REJ', defect: 'LF', approvalStatus: 'Pending' },
  
  // WJ-001 from RT-001 (SHI)
  { id: 'img-13', studyId: 'study-8', locationNo: '1-2', result: 'ACC', defect: 'None', approvalStatus: 'Pending' },
  { id: 'img-14', studyId: 'study-8', locationNo: '2-1', result: 'ACC', defect: 'None', approvalStatus: 'Pending' },
  
  // WJ-002 from RT-001 (SHI) - REJ
  { id: 'img-15', studyId: 'study-9', locationNo: '1-2', result: 'REJ', defect: 'PO', approvalStatus: 'Pending' },
  { id: 'img-16', studyId: 'study-9', locationNo: '2-1', result: 'REJ', defect: 'PO', approvalStatus: 'Pending' },
  
  // WJ-003 from RT-002 (SHI)
  { id: 'img-17', studyId: 'study-10', locationNo: '1-2', result: 'ACC', defect: 'None', approvalStatus: 'Approved' },
  { id: 'img-18', studyId: 'study-10', locationNo: '2-1', result: 'ACC', defect: 'None', approvalStatus: 'Approved' },
  
  // PL-001 from RT-003 (HHI) - REJ
  { id: 'img-19', studyId: 'study-11', locationNo: '1-2', result: 'REJ', defect: 'LF', approvalStatus: 'Approved' },
  { id: 'img-20', studyId: 'study-11', locationNo: '2-1', result: 'REJ', defect: 'LF', approvalStatus: 'Approved' },
  
  // SF-001 from RT-004 (DSME)
  { id: 'img-21', studyId: 'study-12', locationNo: '1-2', result: 'ACC', defect: 'None', approvalStatus: 'Approved' },
  { id: 'img-22', studyId: 'study-12', locationNo: '2-3', result: 'ACC', defect: 'None', approvalStatus: 'Approved' }
];

// Helper functions
export function getProjectById(id: string): Project | undefined {
  return projects.find(p => p.id === id);
}

export function getReportsByProjectId(projectId: string): Report[] {
  return reports.filter(r => r.projectId === projectId);
}

export function getStudiesByReportId(reportId: string): Study[] {
  return studies.filter(s => s.reportId === reportId);
}

export function getImagesByStudyId(studyId: string): ImageData[] {
  return images.filter(i => i.studyId === studyId);
}

export function getPendingCountByProjectId(projectId: string): number {
  const projectReports = getReportsByProjectId(projectId);
  return projectReports.filter(r => r.status === 'Pending').length;
}

// Current user
export const currentUser = {
  name: 'S.K.Kim',
  role: 'Inspector',
  avatar: 'SK'
};
