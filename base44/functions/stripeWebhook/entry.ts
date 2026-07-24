import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    } catch (err) {
      return Response.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        if (userId) {
          const list = await base44.asServiceRole.entities.UserProgress.filter({ created_by_id: userId });
          if (list && list.length) {
            await base44.asServiceRole.entities.UserProgress.update(list[0].id, { subscription_status: 'pro' });
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const customer = await stripe.customers.retrieve(customerId);
        const email = customer.email;
        if (email) {
          const users = await base44.asServiceRole.entities.User.filter({ email });
          if (users && users.length) {
            const list = await base44.asServiceRole.entities.UserProgress.filter({ created_by_id: users[0].id });
            if (list && list.length) {
              await base44.asServiceRole.entities.UserProgress.update(list[0].id, { subscription_status: 'free' });
            }
          }
        }
        break;
      }
      default:
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});