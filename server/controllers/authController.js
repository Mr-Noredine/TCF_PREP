import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ═══════════════════════════════════════════════════════════
// REGISTER USER
// ═══════════════════════════════════════════════════════════
export const register = async (req, res) => {
  try {
    const { email, password, firstname, lastname, level = 'A1' } = req.body;
    
    // Validation
    if (!email || !password || !firstname || !lastname) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }
    
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, password, firstname, lastname, level)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, firstname, lastname, level, created_at`,
      [email.toLowerCase(), hashedPassword, firstname, lastname, level]
    );
    
    const user = result.rows[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        level: user.level
      }
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte'
    });
  }
};

// ═══════════════════════════════════════════════════════════
// LOGIN USER
// ═══════════════════════════════════════════════════════════
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }
    
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    const user = result.rows[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        level: user.level
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
};

// ═══════════════════════════════════════════════════════════
// GOOGLE OAUTH
// ═══════════════════════════════════════════════════════════
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Token Google manquant' });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name, family_name, picture } = payload;

    // Find existing user (by google_id or email)
    let result = await pool.query(
      'SELECT id, email, firstname, lastname, level FROM users WHERE google_id = $1 OR email = $2',
      [googleId, email.toLowerCase()]
    );

    let user;

    if (result.rows.length > 0) {
      user = result.rows[0];
      // Attach google_id if user existed by email but never used Google before
      if (!user.google_id) {
        await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
      }
    } else {
      // Create new user — no password for Google accounts
      const insertResult = await pool.query(
        `INSERT INTO users (email, firstname, lastname, google_id, level)
         VALUES ($1, $2, $3, $4, 'A1')
         RETURNING id, email, firstname, lastname, level`,
        [email.toLowerCase(), given_name || 'Utilisateur', family_name || '', googleId]
      );
      user = insertResult.rows[0];
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Connexion Google réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        level: user.level,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ success: false, message: 'Token Google invalide' });
  }
};

// ═══════════════════════════════════════════════════════════
// GET CURRENT USER (protected route)
// ═══════════════════════════════════════════════════════════
export const getCurrentUser = async (req, res) => {
  try {
    // User ID is set by auth middleware
    const result = await pool.query(
      'SELECT id, email, firstname, lastname, level, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur'
    });
  }
};
