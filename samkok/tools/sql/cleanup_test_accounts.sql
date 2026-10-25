-- Remove the accounts created while testing the online build (run once in Supabase → SQL Editor).
-- Deleting the auth user cascades to players, saves, coupon_redemptions, play_events and feedback.
delete from auth.users where id in (
  '4fd850ca-68c0-47ee-b2f8-1e4e4af3a119', -- ทดสอบA
  '51e44cec-33c6-4e90-a1eb-93056695d648',
  '3e38cea2-6dc6-4d5b-ae7a-d0a82baf2e70',
  '04676d4b-df53-409d-85ae-ac9a1c7ae846',
  '057d4834-953c-461b-b19b-a7451399ec91'
);
update public.coupons c set uses = (select count(*) from public.coupon_redemptions r where r.code = c.code);
