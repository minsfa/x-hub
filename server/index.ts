import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { ProjectListItem, ReportListItem } from "../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function startServer() {
  const app = express();
  const server = createServer(app);

  // JSON body parser
  app.use(express.json());

  // ========== API Routes ==========

  // GET /api/projects - 프로젝트 목록 (대시보드용)
  app.get("/api/projects", async (_req, res) => {
    try {
      const projects = await prisma.project.findMany({
        include: {
          owner: true,
          items: {
            include: {
              reports: true,
            },
          },
        },
      });

      const list: ProjectListItem[] = projects.map((p) => {
        const allReports = p.items.flatMap((i) => i.reports);
        const pendingCount = allReports.filter(
          (r) => r.ownerApprovalStatus === "PENDING"
        ).length;
        const totalReports = allReports.length;
        const approvedCount = allReports.filter(
          (r) => r.ownerApprovalStatus === "APPROVED"
        ).length;
        const progress = totalReports > 0 ? Math.round((approvedCount / totalReports) * 100) : 0;

        const lastReport = allReports.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];
        const lastUpdated = lastReport
          ? new Date(lastReport.updatedAt).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);

        let status: "Active" | "Hold" | "Done" = "Active";
        if (progress >= 100) status = "Done";
        else if (pendingCount === 0 && totalReports > 0) status = "Hold";

        return {
          id: p.id,
          name: p.name,
          customer: p.owner.name,
          procedureCode: "-", // TODO: from project metadata if added
          status,
          progress,
          pendingCount,
          lastUpdated,
        };
      });

      res.json(list);
    } catch (err) {
      console.error("GET /api/projects error:", err);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // GET /api/projects/:id - 프로젝트 상세 + 아이템
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          owner: true,
          items: {
            include: {
              reports: true,
            },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json(project);
    } catch (err) {
      console.error("GET /api/projects/:id error:", err);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // GET /api/projects/:id/reports - 프로젝트의 리포트 목록 (워크스페이스용)
  app.get("/api/projects/:projectId/reports", async (req, res) => {
    try {
      const { projectId } = req.params;
      const items = await prisma.item.findMany({
        where: { projectId },
        include: {
          reports: {
            include: { inspectionCompany: true },
          },
        },
      });

      const reports: ReportListItem[] = [];
      for (const item of items) {
        for (const r of item.reports) {
          const tags = r.tags as Record<string, string> | null;
          reports.push({
            id: r.id,
            projectId,
            reportNo: r.reportNo,
            drawingNo: (tags?.drawingNo as string) ?? "-",
            itemName: item.name,
            itemNo: item.number,
            inspector: (tags?.inspector as string) ?? "-",
            date: new Date(r.issuedDate).toISOString().slice(0, 10),
            status:
              r.ownerApprovalStatus === "PENDING"
                ? "Pending"
                : r.ownerApprovalStatus === "APPROVED"
                  ? "Approved"
                  : "Rejected",
          });
        }
      }

      res.json(reports);
    } catch (err) {
      console.error("GET /api/projects/:projectId/reports error:", err);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // GET /api/reports/:id - 리포트 상세 (RT는 rtResultRows 포함)
  app.get("/api/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const report = await prisma.report.findUnique({
        where: { id },
        include: {
          item: true,
          inspectionCompany: true,
          rtResultRows: true,
        },
      });

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      res.json(report);
    } catch (err) {
      console.error("GET /api/reports/:id error:", err);
      res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  // ========== Static & SPA ==========

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = parseInt(process.env.PORT ?? "3000", 10);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
