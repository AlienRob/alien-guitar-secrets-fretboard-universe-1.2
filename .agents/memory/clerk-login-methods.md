---
name: Clerk login methods (Replit-managed)
description: How to enable/change login methods (email+password vs email code, Google) for the Replit-managed Clerk tenant.
---

For Replit-managed Clerk, the set of enabled login methods (email + password,
passwordless email code, Google/SSO) is configured in the workspace **Auth pane**
(Configure tab), NOT in application code. There is no agent API to toggle it
(`checkClerkManagementStatus` / `setupClerkWhitelabelAuth` only check/provision).

The prebuilt `<SignIn/>` / `<SignUp/>` from `@clerk/react` automatically render
whatever methods the instance has enabled — so to add password login you flip the
toggle in the Auth pane and the password fields appear with no code change.

**Why:** A user hit "can't type/paste the 6-digit email code on mobile." The
reliable fix is to let returning users sign in with a password instead of an
emailed code. The instance was passwordless (email-code first factor), which is
why sign-in sent a code immediately.

**How to apply:** When asked to add/change login methods, do the code-side prep
only (style password-related appearance elements: `formFieldAction` for the
"Forgot password?" link, `formFieldInputShowPasswordButton` for the eye icon),
then direct the user to the Auth pane to enable the method. Note: accounts created
passwordless have no password yet — those users set one via "forgot password"
(still an email code) or after signing in once.
