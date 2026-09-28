# Deplogram — Product & Pricing Blueprint (summary)

Source of truth for marketing copy, pricing and site structure. Summarised from the product
manager's *Deplogram Product & Pricing Blueprint* (received 2026-09-28). When copy in
`src/content/` disagrees with this file, this file wins — update the copy, or update this file if
the PM has changed direction.

## Definition

Deplogram is a developer platform **operated under REKTINA** that gives developers APIs, developer
utilities, storage, domains and application deployment infrastructure from one account. It is
**not** a conventional website host. It starts with free experimentation and expands into paid
resources, usage-based services and premium developer infrastructure.

- Positioning line: **Developer infrastructure, APIs & utilities.**
- Tagline: **Build. Deploy. Store. Connect.**
- Free deployment address: `myapp.dpl.app`

## Five product pillars

| Pillar | Scope |
|---|---|
| APIs | OTP, notifications, SMS/email, image/file processing, URL utilities, QR generation, validation, more |
| Developer utilities | JSON tools, JWT decoding, UUID, Base64, hashing, regex, URL encoding, timestamps, cron helpers, webhook testing |
| Deployments | Free/limited test deployments on dpl.app → paid persistent deployments |
| Storage | Files, assets, backups, app data. Separate from ephemeral containers so restarts never destroy data |
| Domains | Search, purchase, management; connect to deployments (registrar/reseller integration) |

Workflow Deplogram should own: **discover utility → use API → deploy → store → connect domain → scale usage.**

## Not at launch

No cPanel/WordPress hosting, email hosting, VPS reselling or generic website packages.

## Plans

| Plan | Position | Monthly | Core access |
|---|---|---|---|
| Freebies | Explore Deplogram | ₦0 | Core APIs + utilities; limited free deployments; small storage; API keys; usage dashboard |
| Plus | Individual developer | ₦2,500–₦3,500 | Higher API limits; more storage; longer deployments; private deployments; expanded utilities |
| Pro | Developer / startup | ₦7,500–₦12,500 | Higher limits; persistent deployments; larger storage; background jobs; cron; advanced logs (source table is cut off after this) |
| Enterprise | Organizations | Custom | Custom infrastructure, limits, storage, networking; SLA; SSO; audit logs; dedicated support |

**Open decision:** Plus and Pro are given as ranges. The site shows the lower bound (₦2,500 / ₦7,500)
until final prices are confirmed — see the TODO in `src/content/pricing.ts`.

## Deployment model

| Stage | Experience |
|---|---|
| Free | Deploy, receive a dpl.app address, test, inspect basic logs |
| Plus | Longer-running deployments, better resource limits, private deployments |
| Pro | Persistent production-oriented apps, larger resources, background jobs, cron, advanced logs |
| Enterprise | Dedicated/custom infrastructure and operational requirements |

## Monetisation

Free access creates adoption; usage creates revenue; subscriptions create predictable recurring
revenue. APIs stay available on Freebies with an included monthly quota, then charge per additional
1,000 requests — rates tied to real upstream cost (not yet set; don't publish figures). Metered:
API calls, image/file processing, SMS/email delivery, storage capacity, bandwidth. Other revenue:
storage add-ons, premium deployment resources, domain sales/renewals, enterprise.

## Infrastructure (internal — not marketed)

Hetzner Cloud (compute), Linux, Docker (isolation), reverse proxy/gateway (routing + HTTPS),
PostgreSQL (platform metadata), object storage (files, artifacts, backups). The infrastructure sits
underneath Deplogram and is not exposed to customers, so the site doesn't name vendors.
