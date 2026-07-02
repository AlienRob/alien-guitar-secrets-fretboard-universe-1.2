---
name: Clerk OTP code box on mobile
description: Why the email verification code (OTP) field is hard to use on phones and how to fix it via CSS.
---

Clerk's prebuilt `<SignIn/>`/`<SignUp/>` render the email verification code as a
row of 6 segmented boxes (`.cl-otpCodeField` / `.cl-otpCodeFieldInputContainer`
holding `.cl-otpCodeFieldInput`). On a narrow phone the row can overflow the auth
card; if the card (`cardBox`) has `overflow-hidden`, the overflowing boxes get
clipped so taps/paste land on nothing — user reports "can't paste or input the
code on my phone."

**Fix:** (1) Do NOT put `overflow-hidden` on the Clerk `cardBox`. (2) In a plain
(unlayered) stylesheet, make the OTP container `flex-wrap: wrap; max-width: 100%`
and on small screens shrink `.cl-otpCodeFieldInput` and set its `font-size: 16px`
(prevents iOS Safari auto-zoom on focus).

**Why unlayered CSS works:** appearance uses `cssLayerName: "clerk"`, so Clerk's
styles live in `@layer clerk`. Unlayered rules in index.css beat layered ones in
the cascade, so these overrides win (the media-query ones also use `!important`).

**Note:** the definitive mobile fix users actually want is email + password login
(no code to type on logins) — that's an Auth-pane toggle, see clerk-login-methods.
The CSS fix above only makes the one-time signup code usable.
