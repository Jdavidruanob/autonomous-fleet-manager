import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query, queryOne } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña requeridos" });
    }

    const user = await queryOne<any>(
      "SELECT id, email, full_name, role, password_hash, is_active FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: "Cuenta desactivada" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    const jwtSecret = process.env.JWT_SECRET || "fleet_puj_demo_secret_2025";
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await queryOne<any>(
      "SELECT id, email, full_name, role, is_active, last_login FROM users WHERE id = $1",
      [req.user!.userId]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Sesión inválida" });
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      lastLogin: user.last_login,
    });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
