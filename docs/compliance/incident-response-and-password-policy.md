# Incident Response & Password Policy (Amazon SP‑API alignment)

_Organizational documents for CRAFT CHAUPAL COUNCIL / Magadh Recipe internal use. Customize names/emails, then paste into Seller Central questionnaires or save as formal policy._

**Last edited:** 2026-05-16

---

## A. Incident Response Plan (Amazon Information)

**Scope:** Selling Partner API data and secrets used to sync Amazon marketplace orders into our internal PostgreSQL database and admin dashboards. No onward sale of Amazon data.

**Next scheduled IRP review:** 2026-11-16 (minimum every six months, or sooner after material change).

### A.1 Roles

| Role | Responsibility |
|------|----------------|
| Security lead (Owner) | Declares incidents, notifies Amazon within 24h when required |
| Technical lead | Key rotation, access lockdown, patching, backup restore |
| Operations contact | Contact marketplace support where relevant; timeline notes |

_Default today: ________ (security lead email) · ________ (technical)_

### A.2 Detection & triage

- Monitor hosting/database alerts on working days; prioritize suspected credential leaks or unauthorized admin/API access impacting Amazon-connected systems.
- Triage credible issues **within 24 hours** of detection.

### A.3 Amazon notification (within 24 hours of confirmation)

When it is **confirmed** that Amazon Information **or secrets granting access** to it was materially exposed in a security incident, the Security Lead emails **security@amazon.com** **within twenty-four (24) hours** of confirmation, with: approximate time of discovery, nature of incident, scope of Amazon-facing systems, containment taken, reply contact.

### A.4 Containment (non-exhaustive)

- Rotate LWA-linked secrets via Amazon developer flows where applicable  
- Invalidate compromised sessions/tokens  
- Remove unauthorized access paths to production databases  
- Retain logs required for factual reconstruction  

### A.5 Post-incident

- Short internal retrospective; amend this IRP if gaps found (target within 30 days of closure).

---

## B. Password, MFA & Secrets Policy

Applies to **anyone with production/AWS/Vercel/DB/repo access.**

### B.1 Passwords

- **Minimum twelve (12) characters** on systems that enforce length; complexity beyond simple dictionary strings.  
- **Multi-factor authentication (MFA)** required on Seller Central, code hosting with production deploy rights, hosting provider console with deploy rights, production database consoles, primary recovery email accounts—**everywhere MFA is offered**.

### B.2 Rotation & ageing

Service accounts and manually set passwords rotated **within 365 days** or sooner on suspicion of compromise (**annual cadence reminder** calendar). Hosted providers that impose shorter rotations follow provider rules.

### B.3 Secrets

Secrets (including LWA secrets, cron secrets, refresh tokens wherever stored):

- MUST NOT appear in repositories, pasted in public chats, screenshots, or unmanaged shared folders.  
- Stored in host/vault/environment configuration only (`process.env`/secret manager equivalents).

### B.4 Offboarding / role change

Revoke dashboard, DB shell, SSH, IAM-style access when someone leaves scope.

### B.5 Review

Semi-annual review coordinated with §A revision schedule.
