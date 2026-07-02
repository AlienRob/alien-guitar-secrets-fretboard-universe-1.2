import { Router, type IRouter } from "express";
import { db, fretflowLeadsTable, insertFretflowLeadSchema } from "@workspace/db";

const router: IRouter = Router();

// Public endpoint: capture an email from the free FretFlow signup gate.
// No auth — FretFlow visitors are anonymous. Duplicate emails are ignored.
router.post("/fretflow/leads", async (req, res, next) => {
  try {
    const parsed = insertFretflowLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "A valid email is required" });
      return;
    }
    const email = parsed.data.email.trim().toLowerCase();
    await db
      .insert(fretflowLeadsTable)
      .values({ email })
      .onConflictDoNothing({ target: fretflowLeadsTable.email });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
