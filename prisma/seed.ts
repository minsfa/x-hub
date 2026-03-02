/**
 * X-Hub 2단계 시드 데이터
 * 실행: npx prisma db seed
 * 설계: docs/X-Hub 2단계 설계 계획서 v2.0.md
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Owner
  const owner =
    (await prisma.owner.findUnique({ where: { name: "ADNOC" } })) ??
    (await prisma.owner.create({ data: { name: "ADNOC" } }));

  // 2. Makers
  const makerNames = ["DS21 CO.,LTD.", "DS22 CO.,LTD.", "DS24 CO.,LTD."];
  const makers: { id: string; name: string }[] = [];
  for (const name of makerNames) {
    const m =
      (await prisma.maker.findUnique({ where: { name } })) ??
      (await prisma.maker.create({ data: { name } }));
    makers.push(m);
  }

  // 3. InspectionCompanies
  const inspCo1 =
    (await prisma.inspectionCompany.findUnique({ where: { name: "KG검사" } })) ??
    (await prisma.inspectionCompany.create({ data: { name: "KG검사" } }));
  const inspCo2 =
    (await prisma.inspectionCompany.findUnique({ where: { name: "한국검사기술" } })) ??
    (await prisma.inspectionCompany.create({ data: { name: "한국검사기술" } }));

  // 4. Project
  let project = await prisma.project.findFirst({
    where: { name: "EPC FOR DALMA GAS DEVELOPMENT PROJECT" },
  });
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "EPC FOR DALMA GAS DEVELOPMENT PROJECT",
        code: "DALMA-2026",
        status: "ACTIVE",
        ownerId: owner.id,
      },
    });
  }

  // 5. ProjectMakers (DS21, DS22, DS24 모두 배정)
  const projectMakers: { id: string; makerId: string }[] = [];
  for (const maker of makers) {
    const pm =
      (await prisma.projectMaker.findUnique({
        where: { projectId_makerId: { projectId: project.id, makerId: maker.id } },
      })) ??
      (await prisma.projectMaker.create({
        data: { projectId: project.id, makerId: maker.id },
      }));
    projectMakers.push(pm);
  }

  // 6. DS24의 Item 3개
  const ds24Pm = projectMakers.find((pm) => pm.makerId === makers[2].id)!;
  const itemsData = [
    { number: "AZ5172-V-003", name: "Water Flash Vessel" },
    { number: "AZ5172-V-004", name: "Separator" },
    { number: "AZ5172-E-001", name: "Heat Exchanger" },
  ];
  const items: { id: string; number: string }[] = [];
  for (const d of itemsData) {
    let item = await prisma.item.findFirst({
      where: { projectMakerId: ds24Pm.id, number: d.number },
    });
    if (!item) {
      item = await prisma.item.create({
        data: {
          projectMakerId: ds24Pm.id,
          number: d.number,
          name: d.name,
        },
      });
    }
    items.push(item);
  }

  // 7. V-003에 NdtReport 3개
  const itemV003 = items[0];
  const reportsData = [
    { reportNo: "KG-DALMA-RT-003", reportType: "RT" as const, status: "PENDING" as const },
    { reportNo: "KG-DALMA-MT-001", reportType: "MT" as const, status: "APPROVED" as const },
    { reportNo: "KG-DALMA-UT-001", reportType: "UT" as const, status: "PENDING" as const },
  ];
  let reportRt003: { id: string } | null = null;
  for (const r of reportsData) {
    const existing = await prisma.ndtReport.findUnique({
      where: { itemId_reportNo: { itemId: itemV003.id, reportNo: r.reportNo } },
    });
    if (!existing) {
      const report = await prisma.ndtReport.create({
        data: {
          itemId: itemV003.id,
          inspectionCompanyId: inspCo1.id,
          reportNo: r.reportNo,
          reportType: r.reportType,
          testPhase: "NA",
          issuedDate: new Date("2026-02-15"),
          tags: { inspector: "S.K.Kim", procedureCode: "ASME Sec.V" },
          ownerApprovalStatus: r.status,
        },
      });
      if (r.reportNo === "KG-DALMA-RT-003") reportRt003 = report;
    } else if (r.reportNo === "KG-DALMA-RT-003") {
      reportRt003 = existing;
    }
  }

  // 8. RT-003에 Attachment 2개
  if (reportRt003) {
    const att1 = await prisma.attachment.findFirst({
      where: { reportId: reportRt003.id, fileName: "RT-003-Report.pdf" },
    });
    if (!att1) {
      await prisma.attachment.create({
        data: {
          reportId: reportRt003.id,
          fileName: "RT-003-Report.pdf",
          fileUrl: "/placeholder/RT-003-Report.pdf",
          fileType: "REPORT_PDF",
        },
      });
    }
    const att2 = await prisma.attachment.findFirst({
      where: { reportId: reportRt003.id, fileName: "NDE-Map-V003.pdf" },
    });
    if (!att2) {
      await prisma.attachment.create({
        data: {
          reportId: reportRt003.id,
          fileName: "NDE-Map-V003.pdf",
          fileUrl: "/placeholder/NDE-Map-V003.pdf",
          fileType: "NDE_MAP",
        },
      });
    }

    // 9. RT-003에 RtResultRow 5개 (CWL1 ACC 3개, CWL2 REJ 1개 포함)
    const rowCount = await prisma.rtResultRow.count({
      where: { reportId: reportRt003.id },
    });
    if (rowCount === 0) {
      await prisma.rtResultRow.createMany({
        data: [
          { reportId: reportRt003.id, identificationNo: "CWL1", locationNo: "1-2", result: "ACC", defect: null },
          { reportId: reportRt003.id, identificationNo: "CWL1", locationNo: "2-3", result: "ACC", defect: null },
          { reportId: reportRt003.id, identificationNo: "CWL1", locationNo: "3-1", result: "ACC", defect: null },
          { reportId: reportRt003.id, identificationNo: "CWL2", locationNo: "1-2", result: "REJ", defect: "PO" },
          { reportId: reportRt003.id, identificationNo: "CWL2", locationNo: "2-3", result: "ACC", defect: null },
        ],
      });
    }
  }

  // 10. User 2명 (owner@test.com, maker@test.com)
  const passwordHash = await bcrypt.hash("test1234", 10);
  const ownerUser =
    (await prisma.user.findUnique({ where: { email: "owner@test.com" } })) ??
    (await prisma.user.create({
      data: {
        email: "owner@test.com",
        password: passwordHash,
        name: "Owner Test",
        role: "OWNER",
        ownerId: owner.id,
      },
    }));
  const makerUser =
    (await prisma.user.findUnique({ where: { email: "maker@test.com" } })) ??
    (await prisma.user.create({
      data: {
        email: "maker@test.com",
        password: passwordHash,
        name: "Maker Test",
        role: "MAKER",
        makerId: makers[2].id, // DS24
      },
    }));

  console.log("Seed completed.");
  console.log("  - owner@test.com / test1234 (OWNER)");
  console.log("  - maker@test.com / test1234 (MAKER)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
