import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import type {
  ProjectListItem,
  ReportListItem,
  MakerSummary,
  ItemListItem,
  ItemDetail,
  NdtReportListItem,
} from "../shared/types.js";
import { authenticate, authorize, signToken } from "./middleware/auth.js";
import { ensureBucket, uploadFile, getFileStream } from "./lib/storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** MinIO localhost URL → 프록시 URL 변환 (기존 DB 데이터 호환) */
function toProxyFileUrl(url: string): string {
  if (!url || typeof url !== "string") return url;
  const m = url.match(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/([^/]+)\/(.+)/);
  if (m) return `/api/files/${m[3]}/${m[4]}`;
  return url;
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function startServer() {
  await ensureBucket();

  const app = express();
  const server = createServer(app);

  // CORS: localhost:3000 + ngrok-free.app 허용
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        const allowed =
          origin === "http://localhost:3000" ||
          /^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/.test(origin) ||
          /^https:\/\/[a-z0-9-]+\.ngrok-free\.dev$/.test(origin);
        cb(null, allowed);
      },
      credentials: true,
    })
  );

  // JSON body parser
  app.use(express.json());

  // Multer: 메모리 저장 (MinIO 업로드용)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  });

  // ========== API Routes ==========

  /** GET /api/files/:bucket/:key - 파일 프록시 (원격 접속 시 localhost 대신 사용) */
  app.get("/api/files/*", async (req, res) => {
    try {
      const pathAfter = req.path.replace(/^\/api\/files\//, "");
      const firstSlash = pathAfter.indexOf("/");
      if (firstSlash < 1) {
        return res.status(400).json({ error: "Invalid file path" });
      }
      const bucketName = pathAfter.slice(0, firstSlash);
      const key = pathAfter.slice(firstSlash + 1);
      const stream = await getFileStream(bucketName, key);
      if (!stream) {
        return res.status(404).json({ error: "File not found" });
      }
      res.setHeader("Content-Type", stream.contentType ?? "application/octet-stream");
      res.setHeader("Cache-Control", "public, max-age=3600");
      stream.body.pipe(res);
    } catch (err) {
      console.error("GET /api/files/* error:", err);
      res.status(500).json({ error: "Failed to fetch file" });
    }
  });

  // ============================================================
  // Phase 2-B Day 6: Auth API (공개)
  // ============================================================

  /** POST /api/auth/login - 로그인 (JWT 발급) */
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
        include: { owner: true, maker: true },
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        ownerId: user.ownerId ?? undefined,
        makerId: user.makerId ?? undefined,
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          ownerId: user.ownerId,
          makerId: user.makerId,
        },
      });
    } catch (err) {
      console.error("POST /api/auth/login error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  });

  /** GET /api/auth/me - 현재 사용자 정보 (인증 필요) */
  app.get("/api/auth/me", authenticate, async (req, res) => {
    try {
      const payload = req.user!;

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          ownerId: true,
          makerId: true,
          owner: { select: { name: true } },
          maker: { select: { name: true } },
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        ownerId: user.ownerId,
        makerId: user.makerId,
        ownerName: user.owner?.name,
        makerName: user.maker?.name,
      });
    } catch (err) {
      console.error("GET /api/auth/me error:", err);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // GET /api/projects - 프로젝트 목록 (대시보드용)
  // 2단계: Project → ProjectMaker → Item → NdtReport
  app.get("/api/projects", async (_req, res) => {
    try {
      const projects = await prisma.project.findMany({
        include: {
          owner: true,
          projectMakers: {
            include: {
              items: {
                include: {
                  reports: true,
                },
              },
            },
          },
        },
      });

      const list: ProjectListItem[] = projects.map((p) => {
        const allReports = p.projectMakers.flatMap((pm) =>
          pm.items.flatMap((i) => i.reports)
        );
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
          procedureCode: p.code ?? "-",
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

  // GET /api/projects/:projectId/makers - 프로젝트에 배정된 Maker 목록 (/:id보다 먼저 등록)
  app.get("/api/projects/:projectId/makers", async (req, res) => {
    try {
      const { projectId } = req.params;

      const projectMakers = await prisma.projectMaker.findMany({
        where: { projectId },
        include: {
          maker: true,
          items: {
            include: {
              reports: true,
            },
          },
        },
      });

      const result: MakerSummary[] = projectMakers.map((pm) => {
        const allReports = pm.items.flatMap((item) => item.reports);
        return {
          id: pm.maker.id,
          name: pm.maker.name,
          code: pm.maker.name.split(" ")[0] ?? pm.maker.name,
          itemCount: pm.items.length,
          reportCount: allReports.length,
          approvedCount: allReports.filter((r) => r.ownerApprovalStatus === "APPROVED").length,
          pendingCount: allReports.filter((r) => r.ownerApprovalStatus === "PENDING").length,
        };
      });

      res.json(result);
    } catch (err) {
      console.error("GET /api/projects/:projectId/makers error:", err);
      res.status(500).json({ error: "Failed to fetch makers" });
    }
  });

  // POST /api/projects/:projectId/makers/:makerId/items - Item 단건 생성 (Maker 전용)
  app.post(
    "/api/projects/:projectId/makers/:makerId/items",
    authenticate,
    authorize("MAKER"),
    async (req, res) => {
      try {
        const user = req.user!;
        const { projectId, makerId } = req.params;
        const { number, name, drawingNo } = req.body as {
          number?: string;
          name?: string;
          drawingNo?: string;
        };

        if (user.makerId !== makerId) {
          return res.status(403).json({ error: "Item must belong to your maker" });
        }

        if (!number?.trim()) {
          return res.status(400).json({ error: "number is required" });
        }

        const projectMaker = await prisma.projectMaker.findFirst({
          where: { projectId, makerId },
        });
        if (!projectMaker) {
          return res.status(404).json({ error: "ProjectMaker not found" });
        }

        const existing = await prisma.item.findFirst({
          where: {
            projectMakerId: projectMaker.id,
            number: number.trim(),
          },
        });
        if (existing) {
          return res.status(400).json({ error: "Item number already exists" });
        }

        const item = await prisma.item.create({
          data: {
            projectMakerId: projectMaker.id,
            number: number.trim(),
            name: (name ?? "").trim() || number.trim(),
            drawingNo: drawingNo?.trim() || undefined,
          },
        });

        res.status(201).json({
          id: item.id,
          tagNumber: item.number,
          description: item.name,
          reportCount: 0,
          latestReportStatus: null,
        });
      } catch (err) {
        console.error("POST /api/projects/:projectId/makers/:makerId/items error:", err);
        res.status(500).json({ error: "Failed to create item" });
      }
    }
  );

  // POST /api/projects/:projectId/makers/:makerId/items/bulk - Item 엑셀 일괄 등록 (Maker, Admin)
  app.post(
    "/api/projects/:projectId/makers/:makerId/items/bulk",
    authenticate,
    authorize("MAKER", "ADMIN"),
    async (req, res) => {
      try {
        const user = req.user!;
        const { projectId, makerId } = req.params;
        const body = req.body as { items?: Array<{ number: string; name?: string }> };

        if (user.role === "MAKER" && user.makerId !== makerId) {
          return res.status(403).json({ error: "Items must belong to your maker" });
        }

        if (!Array.isArray(body.items) || body.items.length === 0) {
          return res.status(400).json({ error: "items array is required" });
        }

        const projectMaker = await prisma.projectMaker.findFirst({
          where: { projectId, makerId },
        });
        if (!projectMaker) {
          return res.status(404).json({ error: "ProjectMaker not found" });
        }

        const existingNumbers = new Set(
          (
            await prisma.item.findMany({
              where: { projectMakerId: projectMaker.id },
              select: { number: true },
            })
          ).map((i) => i.number)
        );

        const created: ItemListItem[] = [];
        const skipped: string[] = [];

        for (const row of body.items) {
          const num = String(row?.number ?? "").trim();
          if (!num) continue;
          if (existingNumbers.has(num)) {
            skipped.push(num);
            continue;
          }
          const item = await prisma.item.create({
            data: {
              projectMakerId: projectMaker.id,
              number: num,
              name: String(row?.name ?? "").trim() || num,
            },
          });
          created.push({
            id: item.id,
            tagNumber: item.number,
            description: item.name,
            reportCount: 0,
            latestReportStatus: null,
          });
          existingNumbers.add(num);
        }

        res.status(201).json({ created, skipped });
      } catch (err) {
        console.error("POST /api/projects/:projectId/makers/:makerId/items/bulk error:", err);
        res.status(500).json({ error: "Failed to bulk create items" });
      }
    }
  );

  // GET /api/projects/:projectId/makers/:makerId/items - 특정 Maker의 Item 목록
  app.get("/api/projects/:projectId/makers/:makerId/items", async (req, res) => {
    try {
      const { projectId, makerId } = req.params;

      const projectMaker = await prisma.projectMaker.findFirst({
        where: {
          projectId,
          makerId,
        },
      });

      if (!projectMaker) {
        return res.status(404).json({ error: "ProjectMaker not found" });
      }

      const items = await prisma.item.findMany({
        where: { projectMakerId: projectMaker.id },
        include: {
          reports: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: { reports: true },
          },
        },
        orderBy: { number: "asc" },
      });

      const result: ItemListItem[] = items.map((item) => ({
        id: item.id,
        tagNumber: item.number,
        description: item.name,
        reportCount: item._count.reports,
        latestReportStatus: item.reports[0]?.ownerApprovalStatus ?? null,
      }));

      res.json(result);
    } catch (err) {
      console.error("GET /api/projects/:projectId/makers/:makerId/items error:", err);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  // GET /api/projects/:id - 프로젝트 상세 + projectMakers
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          owner: true,
          projectMakers: {
            include: {
              maker: true,
              items: {
                include: {
                  reports: true,
                },
              },
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

  // GET /api/projects/:projectId/reports - 프로젝트의 리포트 목록 (워크스페이스용)
  // 2단계: projectMakers → items → reports
  app.get("/api/projects/:projectId/reports", async (req, res) => {
    try {
      const { projectId } = req.params;
      const projectMakers = await prisma.projectMaker.findMany({
        where: { projectId },
        include: {
          items: {
            include: {
              reports: {
                include: { inspectionCompany: true },
              },
            },
          },
        },
      });

      const reports: ReportListItem[] = [];
      for (const pm of projectMakers) {
        for (const item of pm.items) {
          for (const r of item.reports) {
            const tags = r.tags as Record<string, string> | null;
            reports.push({
              id: r.id,
              projectId,
              reportNo: r.reportNo,
              drawingNo: (tags?.drawingNo as string) ?? item.drawingNo ?? "-",
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
      }

      res.json(reports);
    } catch (err) {
      console.error("GET /api/projects/:projectId/reports error:", err);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  /** GET /api/inspection-companies - 검사기관 목록 */
  app.get("/api/inspection-companies", async (_req, res) => {
    try {
      const list = await prisma.inspectionCompany.findMany({
        orderBy: { name: "asc" },
      });
      res.json(list);
    } catch (err) {
      console.error("GET /api/inspection-companies error:", err);
      res.status(500).json({ error: "Failed to fetch inspection companies" });
    }
  });

  /**
   * POST /api/reports - 리포트 생성 (Maker 전용, multipart/form-data)
   * 필드: itemId, reportNo, reportType, inspectionCompanyId, issuedDate, tags(JSON), files
   */
  app.post(
    "/api/reports",
    authenticate,
    authorize("MAKER"),
    upload.array("files", 10),
    async (req, res) => {
      try {
        const user = req.user!;
        const files = (req as { files?: Express.Multer.File[] }).files ?? [];
        const { itemId, reportNo, reportType, inspectionCompanyId, issuedDate, tags } =
          req.body as {
            itemId?: string;
            reportNo?: string;
            reportType?: string;
            inspectionCompanyId?: string;
            issuedDate?: string;
            tags?: string;
          };

        if (!itemId || !reportNo || !reportType || !inspectionCompanyId || !issuedDate) {
          return res.status(400).json({
            error: "Missing required fields: itemId, reportNo, reportType, inspectionCompanyId, issuedDate",
          });
        }

        if (files.length === 0) {
          return res.status(400).json({ error: "At least one file required" });
        }

        const item = await prisma.item.findUnique({
          where: { id: itemId },
          include: { projectMaker: { include: { project: true } } },
        });

        if (!item) {
          return res.status(404).json({ error: "Item not found" });
        }

        if (item.projectMaker.makerId !== user.makerId) {
          return res.status(403).json({ error: "Item does not belong to your maker" });
        }

        const existing = await prisma.ndtReport.findUnique({
          where: { itemId_reportNo: { itemId, reportNo } },
        });
        if (existing) {
          return res.status(400).json({ error: "Report number already exists for this item" });
        }

        const { projectId, makerId } = item.projectMaker;
        const baseKey = `${projectId}/${makerId}/${item.number}/${reportNo}`;

        const report = await prisma.ndtReport.create({
          data: {
            itemId,
            reportNo,
            reportType: reportType as "RT" | "MT" | "UT" | "HT" | "PMI" | "VT" | "OTHER",
            inspectionCompanyId,
            issuedDate: new Date(issuedDate),
            testPhase: "NA",
            tags: tags ? (JSON.parse(tags) as object) : undefined,
          },
        });

        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const ext = path.extname(f.originalname) || ".pdf";
          const safeName = `${reportNo}-${i + 1}${ext}`.replace(/[^a-zA-Z0-9.-]/g, "_");
          const key = `${baseKey}/${safeName}`;

          const fileUrl = await uploadFile(key, f.buffer, f.mimetype || "application/pdf");

          await prisma.attachment.create({
            data: {
              reportId: report.id,
              fileName: f.originalname,
              fileUrl,
              fileSize: f.size,
              fileType: i === 0 ? "REPORT_PDF" : "OTHER",
            },
          });
        }

        const created = await prisma.ndtReport.findUnique({
          where: { id: report.id },
          include: { attachments: true, item: true },
        });

        res.status(201).json(created);
      } catch (err) {
        console.error("POST /api/reports error:", err);
        res.status(500).json({ error: "Failed to create report" });
      }
    }
  );

  // GET /api/reports/:id - 리포트 상세 (NdtReport, attachments, rtResultRows)
  app.get("/api/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const report = await prisma.ndtReport.findUnique({
        where: { id },
        include: {
          item: true,
          inspectionCompany: true,
          attachments: true,
          rtResultRows: true,
        },
      });

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      // 프론트 호환: pdfUrl은 첫 번째 REPORT_PDF 첨부파일
      const reportPdf = report.attachments.find((a) => a.fileType === "REPORT_PDF");
      const rawPdfUrl = reportPdf?.fileUrl ?? report.attachments[0]?.fileUrl ?? "";
      const reportJson = {
        ...report,
        pdfUrl: toProxyFileUrl(rawPdfUrl),
        attachments: report.attachments.map((a) => ({
          ...a,
          fileUrl: toProxyFileUrl(a.fileUrl),
        })),
      };
      res.json(reportJson);
    } catch (err) {
      console.error("GET /api/reports/:id error:", err);
      res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  /** PATCH /api/reports/:id/approval - Owner 승인/반려 */
  app.patch(
    "/api/reports/:id/approval",
    authenticate,
    authorize("OWNER"),
    async (req, res) => {
      try {
        const user = req.user!;
        const { id } = req.params;
        const { status, comment } = req.body as {
          status?: string;
          comment?: string;
        };

        if (!status || !["APPROVED", "REJECTED"].includes(status)) {
          return res.status(400).json({ error: "status must be APPROVED or REJECTED" });
        }

        const report = await prisma.ndtReport.findUnique({
          where: { id },
        });
        if (!report) {
          return res.status(404).json({ error: "Report not found" });
        }
        if (report.ownerApprovalStatus !== "PENDING") {
          return res.status(400).json({ error: "Report is already approved or rejected" });
        }

        const updated = await prisma.ndtReport.update({
          where: { id },
          data: {
            ownerApprovalStatus: status as "APPROVED" | "REJECTED",
            ownerApprovedById: user.userId,
            ownerApprovedAt: new Date(),
            ownerComment: comment?.trim() || null,
          },
          include: {
            item: true,
            attachments: true,
            rtResultRows: true,
          },
        });

        const reportPdf = updated.attachments.find((a) => a.fileType === "REPORT_PDF");
        const rawPdfUrl = reportPdf?.fileUrl ?? updated.attachments[0]?.fileUrl ?? "";
        res.json({
          ...updated,
          pdfUrl: toProxyFileUrl(rawPdfUrl),
          attachments: updated.attachments.map((a) => ({
            ...a,
            fileUrl: toProxyFileUrl(a.fileUrl),
          })),
        });
      } catch (err) {
        console.error("PATCH /api/reports/:id/approval error:", err);
        res.status(500).json({ error: "Failed to update approval" });
      }
    }
  );

  /**
   * GET /api/items/:itemId
   * Item 상세 + 리포트 목록
   */
  app.get("/api/items/:itemId", async (req, res) => {
    try {
      const { itemId } = req.params;

      const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: {
          projectMaker: {
            include: {
              maker: true,
            },
          },
          reports: {
            include: {
              _count: {
                select: { attachments: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      const result: ItemDetail = {
        id: item.id,
        tagNumber: item.number,
        description: item.name,
        projectMaker: {
          id: item.projectMaker.id,
          maker: {
            id: item.projectMaker.maker.id,
            name: item.projectMaker.maker.name,
            code: item.projectMaker.maker.name.split(" ")[0] ?? item.projectMaker.maker.name,
          },
        },
        reports: item.reports.map((r) => ({
          id: r.id,
          reportNumber: r.reportNo,
          ndtType: r.reportType,
          status: r.ownerApprovalStatus,
          createdAt: r.createdAt.toISOString(),
          attachmentCount: r._count.attachments,
        })),
      };

      res.json(result);
    } catch (err) {
      console.error("GET /api/items/:itemId error:", err);
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  /** PUT /api/items/:itemId - Item 수정 (Maker 전용) */
  app.put(
    "/api/items/:itemId",
    authenticate,
    authorize("MAKER"),
    async (req, res) => {
      try {
        const user = req.user!;
        const { itemId } = req.params;
        const { number, name, drawingNo } = req.body as {
          number?: string;
          name?: string;
          drawingNo?: string;
        };

        const item = await prisma.item.findUnique({
          where: { id: itemId },
          include: { projectMaker: true },
        });
        if (!item) {
          return res.status(404).json({ error: "Item not found" });
        }
        if (item.projectMaker.makerId !== user.makerId) {
          return res.status(403).json({ error: "Item does not belong to your maker" });
        }

        const updates: { number?: string; name?: string; drawingNo?: string | null } = {};
        if (number !== undefined) updates.number = number.trim();
        if (name !== undefined) updates.name = name.trim();
        if (drawingNo !== undefined) updates.drawingNo = drawingNo?.trim() || null;

        if (updates.number !== undefined && updates.number !== item.number) {
          const existing = await prisma.item.findFirst({
            where: {
              projectMakerId: item.projectMakerId,
              number: updates.number,
            },
          });
          if (existing) {
            return res.status(400).json({ error: "Item number already exists" });
          }
        }

        const updated = await prisma.item.update({
          where: { id: itemId },
          data: updates,
        });

        res.json({
          id: updated.id,
          tagNumber: updated.number,
          description: updated.name,
        });
      } catch (err) {
        console.error("PUT /api/items/:itemId error:", err);
        res.status(500).json({ error: "Failed to update item" });
      }
    }
  );

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
