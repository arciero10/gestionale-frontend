# CI and controlled TEST releases

## Verified settings - 26 November 2026

Frontend repository is public; owner plan is Free. TEST required reviewers are
supported and were saved and read back through the GitHub API:
- required reviewer: repository owner arciero10;
- prevent_self_review: true;
- can_admins_bypass: false;
- custom deployment branch policy: exactly branch main, not tags or wildcards.

The dispatcher cannot approve their own run. Another authorized operator must
dispatch while the designated reviewer approves, or an independently authorized
reviewer must first be configured. A single operator cannot perform both steps.
No deployment was requested to test the gate; configuration and negative fixture
tests are not an observed human approval/rejection run.

## CI versus CD

Push and pull_request build and test without Azure secrets or publication actions.
PR preview upload and close actions were removed. Manual dispatch defaults to
DO_NOT_DEPLOY. TEST publication requires main, the exact repository, successful
CI, explicit TEST input, the protected TEST environment and successful read-back
of its protection and branch rules. API denial, unsupported settings or any
missing protection fail closed. The artifact is built in the same run before
approval, then downloaded without rebuilding. Concurrency serializes deployments.

Only the new environment-scoped AZURE_TEST_STATIC_WEB_APPS_API_TOKEN should be
configured, after verifying it belongs exclusively to the existing TEST Static
Web App serving test.eventidicomunita.it. It is deliberately not configured here.
The old repository-wide token is not referenced. No token migration, rotation or
Azure changes occurred. Until the scoped credential and operator arrangement are
verified, manual CD is not operational. No PROD selector or credential is used.

The runtime guard reads public repository environment settings with the job's
minimal contents:read/actions:read token. If that token cannot read settings,
publication stops; do not grant a broad PAT or bypass the guard to make it pass.

## Other workflows

iOS push builds remain unsigned CI: signing/upload inputs default false and are
supplied only by workflow_dispatch. External TestFlight distribution no longer
runs on schedule or workflow_run; it requires explicit manual confirmation and
the existing Apple-approved-build safety checks. No iOS signing/upload was run.

## Limits and release controls

GitHub configuration was checked, not a malicious administrator threat simulated.
An owner who can rewrite workflows, secrets and environment rules can change the
trust boundary; prevent administrator bypass applies to deployment approvals,
not to every repository administration operation. Restrict write/admin access
and review workflow changes. Do not claim absolute tamper resistance.

Before publishing this change, old Azure and automatic distribution workflows
are temporarily disabled and active runs checked. Only explicit workflow/docs
paths are committed; pending application authorization changes stay uncommitted.
After push, workflows are enabled with their new manual-only CD definition.
The first validation dispatch uses DO_NOT_DEPLOY. No Azure deploy is authorized.

References:
- https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
- https://docs.github.com/en/rest/deployments/environments

## Future GLOBAL_ADMIN candidate (not created)

Validation before publication: all four workflow YAML files parse; official
actionlint v1.7.12 (release checksum verified) reports no errors. Eight deployment
gate tests plus 69 existing authentication/routing/invitation/distribution tests
pass (77 total). Angular production build succeeds with existing dependency
optimization warnings. These are local tests, not an actual deployment attempt.

The current backend revision remains ca-gestionale-api--0000051, Single revision
mode, public ingress, minReplicas=1/maxReplicas=10 and 100 percent current traffic.
No public candidate label is an access restriction. Do not switch revision mode,
add labels, alter ingress or enable authorization flags during this CI/CD task.

A separately approved candidate must have the final unconditional JWT-only admin
policy and global role resolution enabled before it can receive requests. Anonymous, ordinary
account and forwarded-header tests must fail. No user/grant is created by CI.
Keep Invite Only, identity, OTP and biometric policies unchanged.

Isolation gate: same-app public ingress does not prove per-revision access
restriction. First verify an existing private route/authorized Azure runner, or
propose a private TEST candidate resource with cost and network impact for
approval. Do not expose an unrestricted candidate FQDN or change shared ingress
to compensate. Retain current traffic until the separately approved test passes.
Rollback removes/stops the isolated candidate without routing to anonymous admin
endpoints; no automatic rollback to an old insecure image. DB and grant rollback
remain separate operations requiring approval. No candidate is provisioned here.
