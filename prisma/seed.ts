/**
 * 개발용 시드 데이터
 * 실행: npx prisma db seed
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Owner
  const owner1 =
    (await prisma.owner.findUnique({ where: { name: "ADNOC" } })) ??
    (await prisma.owner.create({ data: { name: "ADNOC" } }));
  const owner2 =
    (await prisma.owner.findUnique({ where: { name: "SHI" } })) ??
    (await prisma.owner.create({ data: { name: "SHI" } }));

  // Inspection Company
  const inspCo =
    (await prisma.inspectionCompany.findUnique({ where: { name: "KG Inspection" } })) ??
    (await prisma.inspectionCompany.create({ data: { name: "KG Inspection" } }));

  // Projects
  let proj1 = await prisma.project.findFirst({
    where: { name: "EPC FOR DALMA GAS DEVELOPMENT PROJECT 4331433" },
  });
  if (!proj1) {
    proj1 = await prisma.project.create({
      data: {
        name: "EPC FOR DALMA GAS DEVELOPMENT PROJECT 4331433",
        ownerId: owner1.id,
      },
    });
  }

  let proj2 = await prisma.project.findFirst({
    where: { name: "AZ5172 LNG Carrier Welding Inspection" },
  });
  if (!proj2) {
    proj2 = await prisma.project.create({
      data: {
        name: "AZ5172 LNG Carrier Welding Inspection",
        ownerId: owner2.id,
      },
    });
  }

  // Items
  let item1 = await prisma.item.findFirst({
    where: { projectId: proj1.id, number: "AZ5172-V-003" },
  });
  if (!item1) {
    item1 = await prisma.item.create({
      data: {
        projectId: proj1.id,
        name: "WATER FLASH VESSEL",
        number: "AZ5172-V-003",
      },
    });
  }

  let item2 = await prisma.item.findFirst({
    where: { projectId: proj1.id, number: "AZ5172-HDC-001A" },
  });
  if (!item2) {
    item2 = await prisma.item.create({
      data: {
        projectId: proj1.id,
        name: "WATER FLASH VESSEL",
        number: "AZ5172-HDC-001A",
      },
    });
  }

  // Reports
  const reports = [
    {
      itemId: item1.id,
      reportNo: "KG-DALMA-RT-005",
      tags: { drawingNo: "VN0200-AZ5172-24-GAS-0005_REV.B03", inspector: "S.K.Kim" },
      status: "PENDING" as const,
    },
    {
      itemId: item2.id,
      reportNo: "KG-DALMA-RT-001",
      tags: { drawingNo: "VN0200-AZ5172-24", inspector: "S.K.Kim" },
      status: "PENDING" as const,
    },
    {
      itemId: item1.id,
      reportNo: "KG-DALMA-RT-002",
      tags: { inspector: "J.H.Park" },
      status: "APPROVED" as const,
    },
  ];

  for (const r of reports) {
    const existing = await prisma.report.findUnique({
      where: { itemId_reportNo: { itemId: r.itemId, reportNo: r.reportNo } },
    });
    if (!existing) {
      const report = await prisma.report.create({
        data: {
          itemId: r.itemId,
          inspectionCompanyId: inspCo.id,
          reportNo: r.reportNo,
          reportType: "RT",
          testPhase: "NA",
          pdfUrl: "/placeholder.pdf",
          issuedDate: new Date("2026-02-01"),
          tags: r.tags,
          ownerApprovalStatus: r.status,
        },
      });
      // RT 결과 행 추가 (KG-DALMA-RT-005, KG-DALMA-RT-001)
      if (r.reportNo === "KG-DALMA-RT-005") {
        await prisma.rtResultRow.createMany({
          data: [
            { reportId: report.id, identificationNo: "CWL1", locationNo: "1-2", result: "ACC", defect: null },
            { reportId: report.id, identificationNo: "CWL1", locationNo: "2-3", result: "ACC", defect: null },
            { reportId: report.id, identificationNo: "CWL1", locationNo: "3-1", result: "ACC", defect: null },
            { reportId: report.id, identificationNo: "CWL2", locationNo: "1-2", result: "ACC", defect: null },
            { reportId: report.id, identificationNo: "CWL2", locationNo: "2-3", result: "ACC", defect: null },
            { reportId: report.id, identificationNo: "CWL3", locationNo: "1-2", result: "ACC", defect: null },
            { reportId: report.id, identificationNo: "CWL3", locationNo: "2-3", result: "ACC", defect: null },
          ],
        });
      }
      if (r.reportNo === "KG-DALMA-RT-001") {
        await prisma.rtResultRow.createMany({
          data: [
            { reportId: report.id, identificationNo: "CWL1", locationNo: "1-2", result: "REJ", defect: "PO" },
            { reportId: report.id, identificationNo: "CWL1", locationNo: "2-3", result: "REJ", defect: "CR" },
            { reportId: report.id, identificationNo: "CWL2", locationNo: "1-2", result: "REJ", defect: "PO" },
          ],
        });
      }
      if (r.reportNo === "KG-DALMA-RT-002") {
        await prisma.rtResultRow.createMany({
          data: [
            { reportId: report.id, identificationNo: "CWL1", locationNo: "1-2", result: "ACC", defect: null },
            { reportId: report.id, identificationNo: "CWL2", locationNo: "1-2", result: "ACC", defect: null },
          ],
        });
      }
    }
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
