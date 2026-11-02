# Hosting review — production edge 429 + custom domain TLS

**Probed:** 2026-11-02 02:45 UTC · **From:** a single external network (see [Caveats](#caveats))
**Scope:** external black-box probing only. No Railway dashboard access, no CLI (`railway` not
installed on the box this was run from), no service logs.

**TL;DR** — Staging is healthy. Production serves `429 rate limited` from Railway's edge on every
request, so the app is never reached. `www.dashduckies.com` DNS is correct and the domain *is*
mapped at Railway, but no certificate has been issued for it, so browsers get a cert warning.
Both need dashboard access to resolve. The 429 may be blocking the cert issuance — fix it first.

---

## Current state

| Host | Result | Notes |
|---|---|---|
| `dashduckies-staging.up.railway.app` | **200** (0.28s) | Healthy. Deploys from `staging` are landing fine. |
| `dashduckies.up.railway.app` | **429** (0.14s) | `rate limited`, from Railway's edge. Reproduced 6/6 attempts. |
| `www.dashduckies.com` | **429** (0.14s) | Same 429. Plus TLS cert mismatch (below). |
| `dashduckies.com` | **301** → `www` | Apex redirect works, handled off-Railway (below). |

### Repro

```bash
curl -sSi https://dashduckies.up.railway.app/
```

```
HTTP/2 429
content-type: text/plain; charset=utf-8
content-length: 12
x-hikari-trace: lax1.ez9k
server: railway-hikari
x-railway-edge: lax1

rate limited
```

---

## Finding 1 — production 429 at the Railway edge

The response carries `server: railway-hikari` and `x-railway-edge: lax1` with a 12-byte
`rate limited` body. That is Railway's edge, not Nuxt — **requests are rejected before reaching
the app**, so this is not a regression from anything in the recent commits (`09e8bdc` Twilio API
key auth, `c8a0bcb` env template, `5994f1e` pages/gating). Distinct `x-hikari-trace` values per
request (`lax1.ez9k`, `lax1.z1hw`) confirm each one is being handled and refused individually.

Staging returns 200 from the same client, same edge region, so **whatever this is, it is scoped to
the production service or the production environment** — not the project as a whole.

Ranked hypotheses:

1. **Plan / usage / billing limit on the production environment.** Best fit: a blanket edge-level
   refusal that spares a sibling service is consistent with a quota or credit cap being hit.
   *Check: Railway → project → Usage, and the billing status.*
2. **A rate-limit setting on the production service.** *Check: prod service → Settings.*
3. **Prod service unhealthy or undeployed.** Weak fit — a dead upstream normally yields 502/503
   from the edge, not 429. Worth ruling out anyway. *Check: prod service → Deployments + logs.*
4. **Egress-IP rate limiting against the prober.** Weakest fit: staging returned 200 from the same
   IP seconds apart. Not impossible if limits are per-service, so confirm from another network.

**Next step:** have someone with dashboard access check usage/billing first, then the prod
service's deploy status and logs.

## Finding 2 — no TLS certificate for `www.dashduckies.com`

DNS is correct:

```
www.dashduckies.com  CNAME  vyue2xei.up.railway.app.
```

But the TLS handshake with SNI `www.dashduckies.com` returns Railway's shared wildcard:

```bash
openssl s_client -servername www.dashduckies.com -connect www.dashduckies.com:443 </dev/null \
  | openssl x509 -noout -subject -dates
```

```
subject= /CN=*.up.railway.app
notBefore=Sep 27 03:01:43 2026 GMT
notAfter=Dec 26 03:01:42 2026 GMT
```

`*.up.railway.app` does not match `www.dashduckies.com`, so `curl` fails verification with
`(60) SSL: no alternative certificate subject name matches` and **a browser will show
"your connection is not private"**. The cert pre-dates the domain hookup (issued Sep 27), i.e. it
is Railway's default, not one provisioned for this domain.

The domain *is* registered with Railway: an unrecognised Host at the Railway edge returns a 404
page, whereas `www.dashduckies.com` returns the same `429 rate limited` as the prod service — so
the hostname resolves to a mapped service. The missing piece is just certificate issuance.

**Hypothesis worth testing first:** Let's Encrypt issuance needs Railway's edge to answer the ACME
challenge on this hostname, and that hostname currently answers `429` to everything. **Finding 1
may be blocking Finding 2** — clearing the 429 could let the cert issue on its own. Resolve the
429 first, then re-check before touching the domain config.

*Check: prod service → Settings → Networking → Custom Domains → status for `www.dashduckies.com`.*

## Note — apex redirect is not on Railway

```
dashduckies.com  A  3.33.251.168, 15.197.225.128
```

Those are AWS Global Accelerator ranges, typical of a registrar's URL-forwarding service, not
Railway. The `dashduckies.com → www` 301 therefore depends on the registrar, and is a separate
moving part from the Railway domain config. Consider adding the apex to Railway as a domain in its
own right so both names are managed in one place and both get certs — optional, not blocking.

## Note — `vyue2xei.up.railway.app` returns 404

Expected, not a fault: Railway's edge routes by `Host` header and only recognises the custom
hostname. Recorded here so the 404 isn't mistaken for a misconfigured CNAME target.

## Caveats

- All probes from one external network at one moment; no dashboard, logs, or CLI.
- The 429 should be confirmed from a second network/browser to fully rule out hypothesis 4.
- The cert may issue by itself at any time; re-run the `openssl` command above before acting.
