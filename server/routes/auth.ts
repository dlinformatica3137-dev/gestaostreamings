import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db.ts';

export const authRouter = Router();

// Simple JWT-like bearer token generator and parser
export interface AuthenticatedRequest extends Request {
  user?: any;
  tenantId?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Token format: base64 encoded { userId, tenantId, timestamp }
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const user = db.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }
    req.user = user;
    req.tenantId = user.tenant_id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token de autenticação inválido.' });
  }
}

export function generateToken(user: any): string {
  const payload = {
    userId: user.id,
    tenantId: user.tenant_id,
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// POST /api/auth/register
authRouter.post('/register', (req, res) => {
  const { full_name, company_name, email, phone, password, confirm_password, terms_accepted, fingerprint } = req.body;

  if (!full_name || !company_name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ error: 'As senhas não coincidem.' });
  }

  if (!terms_accepted) {
    return res.status(400).json({ error: 'É necessário aceitar os termos de uso e política de privacidade.' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
  }

  try {
    const { user, license } = db.createUser({
      email,
      full_name,
      company_name,
      phone,
      password,
      fingerprint
    });

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    return res.status(201).json({
      message: 'Conta criada com sucesso! Teste de 3 dias grátis ativado.',
      token,
      user: safeUser,
      license
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao criar conta.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Informe o e-mail e a senha.' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  const isValid = db.verifyPassword(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  const license = db.getLicense(user.tenant_id);
  const token = generateToken(user);
  const { password_hash, ...safeUser } = user;

  return res.json({
    message: 'Login realizado com sucesso.',
    token,
    user: safeUser,
    license
  });
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  const user = req.user;
  const license = db.getLicense(req.tenantId!);
  const { password_hash, ...safeUser } = user;

  return res.json({
    user: safeUser,
    license
  });
});

// POST /api/auth/recover-password
authRouter.post('/recover-password', (req, res) => {
  const { email, new_password, confirm_new_password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Informe seu e-mail cadastrado.' });
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const user = db.findUserByEmail(cleanEmail);
  if (!user) {
    return res.status(404).json({ error: 'Nenhum cadastro localizado com este e-mail.' });
  }

  if (new_password) {
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }
    if (confirm_new_password && new_password !== confirm_new_password) {
      return res.status(400).json({ error: 'As confirmações de senha não coincidem.' });
    }
    db.changePassword(user.id, new_password);
    return res.json({
      success: true,
      message: 'Senha alterada com sucesso! Você já pode entrar com sua nova senha.'
    });
  }

  // Generate temporary password as fallback
  const tempPass = Math.random().toString(36).substring(2, 8) + 'A1!';
  db.changePassword(user.id, tempPass);

  return res.json({
    message: 'Senha redefinida com sucesso!',
    temp_password_info: `Nova senha gerada: ${tempPass}`
  });
});

// PUT /api/auth/profile
authRouter.put('/profile', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { full_name, company_name, phone } = req.body;
  const updated = db.updateProfile(req.tenantId!, req.user.id, { full_name, company_name, phone });
  if (!updated) {
    return res.status(404).json({ error: 'Perfil não encontrado.' });
  }
  const { password_hash, ...safeUser } = updated;
  return res.json({ user: safeUser, message: 'Perfil atualizado com sucesso.' });
});

// PUT /api/auth/change-password
authRouter.put('/change-password', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { current_password, new_password, confirm_new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Informe a senha atual e a nova senha.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
  }

  if (new_password !== confirm_new_password) {
    return res.status(400).json({ error: 'As novas senhas não coincidem.' });
  }

  const isValid = db.verifyPassword(current_password, req.user.password_hash);
  if (!isValid) {
    return res.status(400).json({ error: 'Senha atual incorreta.' });
  }

  db.changePassword(req.user.id, new_password);
  return res.json({ message: 'Senha alterada com sucesso.' });
});
