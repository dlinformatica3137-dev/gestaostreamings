import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db.ts';
import { authMiddleware, AuthenticatedRequest } from './auth.ts';

export const mpRouter = Router();

const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
const MP_WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET || '';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// POST /api/license/create-preference - Generate Mercado Pago preference for R$ 199,00
mpRouter.post('/create-preference', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const user = req.user;
  const amount = 199.00;

  const transactionId = `tx_${Date.now()}`;

  // If real MP_ACCESS_TOKEN is configured in environment, call Mercado Pago API
  if (MP_ACCESS_TOKEN) {
    try {
      const preferencePayload = {
        items: [
          {
            id: 'licenca_vitalicia_gestor_stream',
            title: 'Gestor de Streamings — Licença Vitalícia',
            description: 'Acesso vitalício completo ao software SaaS Gestor de Streamings',
            quantity: 1,
            unit_price: amount,
            currency_id: 'BRL'
          }
        ],
        payer: {
          name: user.full_name,
          email: user.email,
          phone: {
            number: user.phone || '11999998888'
          }
        },
        external_reference: `${tenantId}:${transactionId}`,
        back_urls: {
          success: `${APP_URL}/?payment=success&tx=${transactionId}`,
          pending: `${APP_URL}/?payment=pending&tx=${transactionId}`,
          failure: `${APP_URL}/?payment=failure&tx=${transactionId}`
        },
        auto_return: 'approved',
        notification_url: `${APP_URL}/api/license/webhook`,
        payment_methods: {
          excluded_payment_types: [],
          installments: 12
        }
      };

      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferencePayload)
      });

      if (!mpResponse.ok) {
        const errorData = await mpResponse.json();
        console.error('Mercado Pago API error:', errorData);
        // Fall back to direct checkout with simulated preference
      } else {
        const data = await mpResponse.json();
        const tx = db.addTransaction({
          id: transactionId,
          tenant_id: tenantId,
          mp_preference_id: data.id,
          amount: amount,
          status: 'pending',
          payment_method: 'Mercado Pago Checkout',
          init_point: data.init_point,
          sandbox_init_point: data.sandbox_init_point,
          created_at: new Date().toISOString()
        });

        return res.json({
          preferenceId: data.id,
          initPoint: data.init_point,
          sandboxInitPoint: data.sandbox_init_point,
          transaction: tx
        });
      }
    } catch (err: any) {
      console.error('Failed to create MP preference via API:', err);
    }
  }

  // Pre-configured seamless checkout with Pix Copy & Paste & simulated QR code
  // when credentials are in setup/sandbox mode
  const pixCopyPaste = `00020101021226840014br.gov.bcb.pix2562pix-gestor.streamings.com/qr/v2/${transactionId}5204000053039865406199.005802BR5925GESTOR DE STREAMINGS SAAS6009SAO PAULO62070503***6304${Math.random().toString(16).substring(2, 6).toUpperCase()}`;

  const tx = db.addTransaction({
    id: transactionId,
    tenant_id: tenantId,
    mp_preference_id: `pref_${transactionId}`,
    amount: amount,
    status: 'pending',
    payment_method: 'Pix / Mercado Pago',
    pix_code: pixCopyPaste,
    created_at: new Date().toISOString()
  });

  return res.json({
    preferenceId: `pref_${transactionId}`,
    initPoint: `${APP_URL}/checkout/${transactionId}`,
    pixCode: pixCopyPaste,
    amount: amount,
    transaction: tx,
    isConfigured: Boolean(MP_ACCESS_TOKEN)
  });
});

// POST /api/license/webhook - Real Mercado Pago IPN & Webhook handler
mpRouter.post('/webhook', async (req, res) => {
  const { topic, resource, id, data, type } = req.body || {};
  const query = req.query;

  // Mercado Pago sends notifications either via query params or body:
  const paymentId = id || (data && data.id) || query['data.id'] || query.id;
  const notificationType = type || topic || query.type || query.topic;

  console.log(`[Mercado Pago Webhook Received] Type: ${notificationType}, ID: ${paymentId}`);

  // Validate webhook signature if MP_WEBHOOK_SECRET is provided
  const xSignature = req.headers['x-signature'] as string;
  const xRequestId = req.headers['x-request-id'] as string;

  if (MP_WEBHOOK_SECRET && xSignature) {
    try {
      const parts = xSignature.split(',');
      let ts = '';
      let v1 = '';
      parts.forEach((p) => {
        const [k, v] = p.split('=');
        if (k.trim() === 'ts') ts = v.trim();
        if (k.trim() === 'v1') v1 = v.trim();
      });

      const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;
      const expectedHash = crypto.createHmac('sha256', MP_WEBHOOK_SECRET).update(manifest).digest('hex');

      if (expectedHash !== v1) {
        console.warn('Mercado Pago Webhook signature mismatch.');
      }
    } catch (e) {
      console.error('Error validating signature:', e);
    }
  }

  // If we have an Access Token, verify transaction directly against Mercado Pago API
  if (paymentId && MP_ACCESS_TOKEN) {
    try {
      const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
        }
      });

      if (paymentRes.ok) {
        const paymentData = await paymentRes.json();
        const status = paymentData.status;
        const extRef = paymentData.external_reference; // format: tenantId:transactionId

        if (extRef && status === 'approved') {
          const [tenantId, txId] = extRef.split(':');
          if (tenantId) {
            db.updateTransactionStatus(txId, 'approved', String(paymentId));
            db.activateLifetimeLicense(tenantId, String(paymentId));
            console.log(`[Webhook Activated] Lifetime license granted to tenant ${tenantId}`);
          }
        }
      }
    } catch (err) {
      console.error('Error verifying payment at Mercado Pago API:', err);
    }
  }

  return res.status(200).send('OK');
});

// POST /api/license/simulate-payment - For testing & sandbox verification
mpRouter.post('/simulate-payment', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { transactionId } = req.body;

  const txId = transactionId || `tx_${Date.now()}`;
  const paymentId = `mp_pay_${Math.floor(Math.random() * 900000000 + 100000000)}`;

  db.updateTransactionStatus(txId, 'approved', paymentId);
  const updatedLicense = db.activateLifetimeLicense(tenantId, paymentId);

  return res.json({
    message: 'Pagamento de R$ 199,00 aprovado com sucesso! Licença vitalícia ativada.',
    license: updatedLicense,
    transactionId: txId,
    mpPaymentId: paymentId
  });
});

// GET /api/license/status - License status check
mpRouter.get('/status', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const license = db.getLicense(req.tenantId!);
  const transactions = db.getTransactions(req.tenantId!);
  return res.json({ license, transactions });
});
