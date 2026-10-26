# 3D online data boundary

The 3D edition uses `samkok3d_players`, `samkok3d_saves`, `samkok3d_messages`, `samkok3d_feedback` and a private transfer-capability table in the existing Supabase project. No schema/data in the original `players` or `saves` tables was changed.

- PASS: real anonymous Auth sessions can save/read their own data; another session cannot read or overwrite that save.
- PASS: optimistic revisions return an explicit conflict result. Both choices are tested in the browser, with a local backup before replacement.
- PASS: one-time, 18-hex-character transfer capabilities expire after 20 minutes, are stored hashed and cannot be reused. Creation/claim functions check `auth.uid()` and keep privileged code in the private schema.
- PASS: guild read/write isolation tested under authenticated database roles. All test chat/feedback inserts were rolled back; no test chat messages were published.
- PASS: transfer and full save restoration tested through the real mobile-size UI. All scoped test profiles and saves were removed afterward; original game data was not touched.

The publishable key is intentionally public. No secret/service-role key is shipped. Every new table has RLS. Private saves use owner predicates in SELECT, INSERT and UPDATE. The unsigned database `anon` role has no direct access to the new tables.

## Advisor findings reviewed

[Anonymous access policies](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins) are intentional for authenticated guest play: a guest still has a signed Auth user ID, and private saves remain owner-only. Public nicknames/defence teams and world chat are shared by design.

The [RLS with no policy info](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) for `private.samkok3d_transfers` is intentional default-deny: clients have no table grants and only guarded functions access it. The pre-existing coupons finding was not changed.

[Leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) is disabled in the existing project. This edition uses guest authentication, not password sign-in; no password provider settings were changed.

## Product limits

Guest identity belongs to this browser. Before clearing browser data or changing devices, use the transfer code or export the local save; guest Auth is not an email/password account. A transfer copies progress to the receiving guest account rather than linking two devices to one permanent login.

Player duels use shared defence teams and the existing asynchronous simulator. Rankings and rewards remain client-calculated casual-game state; this is not an authoritative competitive backend or real-time co-op server. Guilds use the existing open-join groups. Coupon rewards remain the edition's local named-code system, not the original game's admin RPCs.
