import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const plan = body.plan === 'annual' ? 'annual' : 'monthly';

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const prices = {
      monthly: { amount: 899, interval: 'month', name: 'Spanish Beats Pro — Monthly' },
      annual: { amount: 5999, interval: 'year', name: 'Spanish Beats Pro — Annual' },
    };
    const cfg = prices[plan];

    // Use a server-configured app URL rather than the client-controlled Origin header
    // to prevent open-redirect attacks via a spoofed Origin.
    const origin = Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: cfg.name, description: 'Unlimited songs, vocabulary, and AI voice coaching' },
          recurring: { interval: cfg.interval },
          unit_amount: cfg.amount,
        },
        quantity: 1,
      }],
      metadata: { user_id: user.id, user_email: user.email },
      success_url: `${origin}/settings?upgraded=1`,
      cancel_url: `${origin}/pricing?canceled=1`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});