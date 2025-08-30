import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import { authRequired } from "../middleware/auth.js";

const router = Router();

// ensure upload dir exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "portfolios");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// multer config (disk)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
function fileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.mimetype))
    return cb(new Error("Invalid file type"));
  cb(null, true);
}
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}); // 5MB

// ----------------------
// upload multiple images
// ----------------------
router.post(
  "/upload",
  authRequired,
  upload.array("images", 8),
  async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0)
        return res.status(400).json({ message: "No files uploaded" });

      const imageUrls = files.map((f) => `/uploads/portfolios/${f.filename}`);
      res.json({ imageUrls });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

// ----------------------
// create portfolio
// ----------------------
router.post("/", authRequired, async (req, res) => {
  try {
    const { title, description, techStack, link, feedbackFocus, images } =
      req.body;

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: req.user!.id,
        title,
        description,
        techStack: techStack ? JSON.parse(techStack) : undefined,
        link,
        feedbackFocus,
        images:
          images && Array.isArray(images) && images.length > 0
            ? { create: images.map((url: string) => ({ url })) }
            : undefined,
      },
      include: { images: true },
    });

    res.status(201).json(portfolio);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Create failed" });
  }
});

// ----------------------
// list portfolios
// ----------------------
router.get("/", async (req, res) => {
  const { tag, sort } = req.query;

  const where: Prisma.PortfolioWhereInput | undefined = tag
    ? { tags: { some: { tag: { name: String(tag) } } } }
    : undefined;

  // ✅ SortOrder 타입 적용
  const orderBy: Prisma.PortfolioOrderByWithRelationInput =
    sort === "popular" ? { viewCount: "desc" } : { createdAt: "desc" };

  const items = await prisma.portfolio.findMany({
    where,
    include: {
      user: { select: { id: true, username: true } },
      images: true,
      _count: { select: { likes: true, comments: true } },
    },
    orderBy,
  });

  res.json(items);
});

// ----------------------
// detail (increments viewCount)
// ----------------------
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  await prisma.portfolio.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  const pf = await prisma.portfolio.findUnique({
    where: { id },
    include: {
      user: true,
      images: true,
      likes: true,
      comments: true,
      votes: true,
    },
  });

  if (!pf) return res.status(404).json({ message: "Not found" });
  res.json(pf);
});

// ----------------------
// update (owner only)
// ----------------------
router.put("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const target = await prisma.portfolio.findUnique({ where: { id } });

  if (!target || target.userId !== req.user!.id)
    return res.status(403).json({ message: "Forbidden" });

  const { title, description, techStack, link, feedbackFocus } = req.body;

  const updated = await prisma.portfolio.update({
    where: { id },
    data: {
      title,
      description,
      techStack: techStack ? JSON.parse(techStack) : undefined,
      link,
      feedbackFocus,
    },
  });

  res.json(updated);
});

// ----------------------
// delete (owner only)
// ----------------------
router.delete("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const target = await prisma.portfolio.findUnique({ where: { id } });

  if (!target || target.userId !== req.user!.id)
    return res.status(403).json({ message: "Forbidden" });

  await prisma.portfolio.delete({ where: { id } });
  res.status(204).end();
});

export default router;
