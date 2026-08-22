# Local Loyalty Hub

Build a production-quality MVP called "Fello".

Fello is a multilingual Telegram Mini App + merchant web dashboard for loyalty programs for local physical businesses.

The core concept:

Fello allows local businesses such as coffee shops, restaurants, bakeries, barbers, salons, gyms, car washes and other physical businesses to create simple loyalty programs.

Customers use one Fello account to join multiple stores' loyalty programs.

Fello supports two loyalty modes:

1. POINTS MODE

2. STAMP MODE

Customers can earn points or stamps, unlock rewards, and redeem rewards using secure QR codes.

The primary experience should be extremely simple:

STORE QR

→ Customer joins loyalty program

→ Welcome reward

→ Customer visits store

→ Customer shows Customer QR

→ Staff scans it

→ Staff awards points or stamps

→ Customer receives Telegram notification

→ Customer unlocks reward

→ Customer generates Reward QR

→ Staff scans and validates it

→ Reward is redeemed

→ Customer returns again

The product must be designed as a scalable multi-tenant SaaS from the beginning.

==================================================

1. TECHNOLOGY STACK

==================================================

Use:

- React

- TypeScript

- Tailwind CSS

- shadcn/ui

- Supabase

- PostgreSQL

- Supabase Auth

- Supabase Row Level Security (RLS)

- Supabase Edge Functions where server-side business logic is required

- Telegram Mini App / Telegram WebApp API

- Telegram Bot API for notifications

- QR code generation and scanning

Do NOT introduce a separate backend such as FastAPI, Django, Node.js or another server.

Supabase should be the primary backend.

The architecture must allow Fello to expand beyond Telegram in the future.

Telegram is the initial customer interface/channel, not the core business logic.

==================================================

2. MULTI-LANGUAGE SUPPORT

==================================================

Fello must be multilingual from the beginning.

Supported languages:

- English

- Russian

- Spanish

- Arabic

- Turkish

- Portuguese

- Italian

Language selection requirements:

1. On first launch, automatically determine the user's preferred language using the best available combination of:

   - Telegram language/locale when available

   - Browser/device language

   - Approximate user country/region when available

2. Do NOT use precise GPS location or require location permission just to determine language.

3. Use sensible country → language defaults only when the language cannot otherwise be determined.

Suggested defaults:

- United States / United Kingdom / Canada / Australia → English

- Russia and Russian-speaking regions → Russian

- Spain and Spanish-speaking countries → Spanish

- Arab countries → Arabic

- Turkey → Turkish

- Portugal/Brazil → Portuguese

- Italy → Italian

4. Always allow the user to manually change the language.

5. Save the selected language preference to the user's profile.

6. Once manually selected, the user's explicit language choice must take priority over automatic detection.

7. The language selector must always be accessible from Settings/Profile.

8. Arabic must support RTL layout correctly.

9. The UI must dynamically switch between LTR and RTL.

10. Do NOT hard-code UI strings directly into React components.

Use a proper i18n architecture from the beginning.

All UI text must come from translation resources.

Use stable translation keys rather than duplicating text.

Example:

common.save

common.cancel

common.confirm

loyalty.points

loyalty.stamps

rewards.redeem

customer.my_qr

merchant.add_points

Make sure all seven languages have translation files/resources.

The English translation should be the source/reference language.

Arabic must be properly RTL, including:

- navigation

- forms

- cards

- buttons

- icons where appropriate

- spacing

- alignment

- numbers where appropriate

Do not mirror QR codes or other technical elements.

==================================================

3. TWO MAIN EXPERIENCES

==================================================

Fello has two main user experiences:

A. CUSTOMER EXPERIENCE

B. MERCHANT EXPERIENCE

The same Fello platform supports both.

==================================================

4. CUSTOMER EXPERIENCE

==================================================

Customers should primarily use Fello through Telegram Mini App.

Customer authentication should use Telegram identity.

Do not require traditional:

- email/password registration

- username registration

- long registration forms

When a customer opens Fello from Telegram:

- verify Telegram WebApp user data securely on the backend

- create the Fello customer profile automatically if it does not exist

- load the customer's Fello wallet

The customer should be able to use one Fello account for multiple stores.

==================================================

5. CUSTOMER HOME

==================================================

Create a beautiful mobile-first customer dashboard.

Main sections:

- My Loyalty

- Rewards

- My QR

- Activity

- Profile / Settings

Home should show:

"Hello, [First Name]"

Then:

"My Loyalty Programs"

Each loyalty membership should display:

- Store logo

- Store name

- Loyalty mode

- Points balance OR stamp progress

- Progress toward next reward

- Next available reward

- Last activity

Example:

ABC Coffee

340 Points

60 points to Free Coffee

Elite Barber

4 / 5 Stamps

1 visit to Free Haircut

The customer can belong to many stores.

Do not assume one customer belongs to only one store.

==================================================

6. JOINING A STORE

==================================================

Every store has a unique Store QR Code.

The QR is intended for customers to join the store's loyalty program.

Example:

ABC Coffee

"Join our loyalty program"

"Get 50 Welcome Points"

[QR CODE]

When the customer scans the Store QR:

1. Open Fello

2. Identify the Telegram customer

3. Identify the store from the secure QR token

4. Show store information

5. Allow/confirm joining the loyalty program

6. Create a membership if the customer is not already a member

7. Apply the configured welcome reward exactly once

8. Show a success screen

Example:

"Welcome to ABC Coffee!"

"+50 Points"

"You're now a member."

If the customer is already a member:

Do NOT create another membership or duplicate the welcome reward.

Show:

"You're already a member."

==================================================

7. CUSTOMER QR

==================================================

Every customer has a personal Customer QR.

The purpose is to allow store staff to identify the customer during a purchase.

Customer screen:

"My QR"

"Show this QR to the cashier"

Generate a secure, non-guessable QR token.

Do not put sensitive information such as:

- points balance

- personal data

- reward balance

directly into the QR payload.

Prefer short-lived or securely validated tokens.

The backend must validate the QR token.

==================================================

8. POINTS MODE

==================================================

A merchant can create a Points loyalty program.

Example:

$1 = 2 Points

The merchant can configure:

- points per currency unit

- welcome bonus

- rewards

Example rewards:

Free Coffee — 200 points

Free Pastry — 300 points

$5 OFF — 500 points

Customer flow:

1. Customer makes a purchase.

2. Customer opens My QR.

3. Staff scans Customer QR.

4. Staff selects the customer's store membership.

5. Staff enters purchase amount.

6. Backend retrieves the store's loyalty rules.

7. Backend calculates points.

8. Backend creates an immutable transaction.

9. Customer balance increases.

10. Customer receives Telegram notification.

Example:

Purchase amount = $25

Rule = $1 = 2 points

Result = +50 points.

IMPORTANT:

The frontend must NEVER be trusted to calculate or award points.

The backend must:

- retrieve the store's rules

- calculate points

- validate the staff/store relationship

- create the transaction

- update the balance atomically

==================================================

9. STAMP MODE

==================================================

A merchant can create a Stamp loyalty program.

Example:

1 purchase = 1 stamp

5 stamps = Free Coffee

Customer UI:

ABC Coffee

☕ ● ● ● ○ ○

3 / 5 Stamps

"2 more visits to unlock your reward"

Staff flow:

1. Scan Customer QR

2. Verify customer

3. Select "Add Stamp"

4. Backend validates the action

5. Add exactly one stamp

6. Record transaction

7. Send Telegram notification

Example notification:

"☕ Stamp added!"

"You now have 4/5 stamps."

Do not make Stamp Mode unnecessarily complicated in the MVP.

The initial version should support:

- 1 purchase = 1 stamp

- configurable number of stamps required for reward

- one or more rewards

==================================================

10. REWARDS

==================================================

Merchants can create rewards.

A reward must contain:

- name

- description

- image optional

- points cost OR stamp requirement

- expiration optional

- active/inactive status

For Points Mode:

Example:

Free Coffee

200 Points

For Stamp Mode:

Free Coffee

5 Stamps

The customer should see:

Available Rewards

Locked Rewards

Unlocked Rewards

Redeemed Rewards

==================================================

11. REDEEMING A REWARD

==================================================

When a customer has enough points/stamps:

Show:

"Reward Unlocked!"

Example:

Free Coffee

200 Points

[ Redeem ]

When the customer presses Redeem:

Backend must verify:

- customer owns the membership

- reward belongs to the correct store

- customer has sufficient balance/progress

- reward is active

- reward is not already redeemed

- reward has not expired

For Points Mode:

Deduct the required points atomically.

For Stamp Mode:

Reset/consume the required stamps according to the configured reward logic.

Create a redemption record.

Generate a secure Reward Redemption QR/token.

The customer sees:

"Show this QR to the cashier."

==================================================

12. REWARD QR VALIDATION

==================================================

The merchant/staff scans the Reward QR.

Backend validates:

- token authenticity

- store ownership

- customer

- reward

- expiration

- redemption status

If valid:

Show:

"VALID REWARD"

ABC Coffee

Ahmed

Free Coffee

[ Confirm Redemption ]

When confirmed:

- mark redemption as REDEEMED

- record timestamp

- record staff/store

- prevent reuse

If already redeemed:

Show:

"Reward already redeemed."

Never allow double redemption.

==================================================

13. TELEGRAM NOTIFICATIONS

==================================================

Implement simple event-based Telegram notifications from the beginning.

Notifications should be sent after important events:

1. Joining a store

2. Welcome bonus

3. Points earned

4. Stamp earned

5. Reward unlocked

6. Reward redeemed

Examples:

"🎉 Welcome to ABC Coffee!

+50 Points"

"⭐ You earned 50 points!

Your balance is now 390."

"☕ Stamp added!

You now have 4/5 stamps."

"🎁 Reward unlocked!

You have a Free Coffee waiting for you."

"✅ Reward redeemed successfully."

Use Telegram Bot API through secure server-side functionality.

Do not expose bot secrets in frontend code.

Do not build a complicated notification center in the MVP.

A simple event-based notification system is enough.

However, architect notifications so future marketing broadcasts can be added.

==================================================

14. MERCHANT EXPERIENCE

==================================================

Create a professional desktop/tablet-friendly Merchant Dashboard.

Main navigation:

- Dashboard

- Customers

- Loyalty Program

- Rewards

- Scan

- Transactions

- Store Settings

The merchant dashboard should feel like a real SaaS product, not an admin template.

==================================================

15. MERCHANT ONBOARDING

==================================================

Merchant onboarding:

Step 1:

Create account

Step 2:

Create Store

Fields:

- Store name

- Category

- Logo

- Currency

- Optional location/contact information

Step 3:

Choose Loyalty Mode

- Points

- Stamps

Step 4:

Configure loyalty rules

Step 5:

Create first reward

Step 6:

Generate Store QR

Step 7:

Show simple instructions:

"Print this QR and place it at your checkout."

==================================================

16. MERCHANT DASHBOARD

==================================================

Dashboard should show:

- Total members

- Active members

- Points issued

- Stamps issued

- Rewards redeemed

- Recent activity

Do not overbuild analytics in MVP.

Focus on useful operational information.

==================================================

17. MERCHANT CUSTOMER MANAGEMENT

==================================================

Merchant can see customers who joined the store.

Customer list:

- Customer display name

- Loyalty balance

- Last activity

- Joined date

- Rewards

- Status

Merchant must ONLY see customers belonging to their store.

Use Supabase RLS to enforce tenant isolation.

==================================================

18. STAFF / CASHIER FLOW

==================================================

For the MVP, keep staff simple.

Merchant/owner can perform staff actions directly.

Staff accounts can be architected for future expansion but are not required to have a complex management system in V1.

Merchant actions:

- Scan Customer QR

- Add Points

- Add Stamp

- Scan Reward QR

- Confirm Redemption

Do not allow customers to perform merchant actions.

==================================================

19. TRANSACTIONS / LEDGER

==================================================

Do NOT rely only on a mutable balance.

Create transaction records for all loyalty activity.

Examples:

+50 Welcome Bonus

+50 Purchase

+100 Purchase

-200 Reward Redemption

+1 Stamp

Reward Redeemed

Every transaction should contain appropriate references such as:

- store

- customer

- membership

- transaction type

- amount if applicable

- points/stamps

- actor

- timestamp

- unique transaction ID

Use the ledger as the source of truth where practical.

All important balance-changing operations should be atomic.

==================================================

20. DATABASE ARCHITECTURE

==================================================

Design a clean normalized PostgreSQL schema in Supabase.

Suggested entities:

profiles

stores

store_members

loyalty_programs

loyalty_rules

rewards

memberships

points_transactions

stamp_transactions

redemptions

qr_tokens

notifications

audit_logs

You may adjust table names and structure if there is a better normalized design.

Important:

A customer can belong to MANY stores.

A store can have MANY customers.

A store has ONE active loyalty program in the MVP.

The architecture should allow multiple program types in the future.

Use foreign keys and proper indexes.

Use timestamps.

Use UUIDs where appropriate.

==================================================

21. MULTI-TENANCY AND SECURITY

==================================================

Security is critical.

Use Supabase Row Level Security.

A merchant must only access:

- their store

- their customers

- their loyalty program

- their rewards

- their transactions

- their redemptions

Customer must only access:

- their own profile

- their own memberships

- their own points

- their own stamps

- their own rewards

- their own redemptions

- their own transaction history

Never rely solely on frontend checks.

Sensitive operations must happen server-side.

Use Edge Functions or secure database functions for:

- awarding points

- awarding stamps

- redeeming rewards

- validating QR tokens

- processing Telegram authentication

- sending Telegram notifications

Never expose:

- Supabase service role key

- Telegram bot token

- other secrets

to the frontend.

==================================================

22. QR SECURITY

==================================================

Implement secure QR tokens.

There are three different QR concepts:

1. STORE QR

Purpose:

Customer joins store loyalty program.

2. CUSTOMER QR

Purpose:

Staff identifies customer and awards points/stamps.

3. REWARD QR

Purpose:

Staff validates and redeems a reward.

Do NOT use predictable IDs directly as security tokens.

QR codes should contain secure tokens or signed identifiers.

The backend must always validate:

- token

- store

- customer

- expiration where applicable

- operation

- redemption status

==================================================

23. CUSTOMER ACTIVITY

==================================================

Customer should see a simple activity history:

Today

+50 Points

ABC Coffee

Yesterday

+1 Stamp

Elite Barber

Aug 5

Reward Redeemed

ABC Coffee

Keep it simple and readable.

==================================================

24. PROFILE / SETTINGS

==================================================

Customer settings:

- Name

- Profile photo if available

- Language

- Notifications preference

- Telegram information where appropriate

Merchant settings:

- Store information

- Logo

- Currency

- Language

- Account settings

Language selector must always be accessible.

==================================================

25. DESIGN / UI

==================================================

Design Fello as a polished modern SaaS.

The brand should communicate:

- friendliness

- loyalty

- trust

- simplicity

- local community

- growth

Avoid making it look like a generic enterprise CRM.

Customer UI should be:

- mobile-first

- visually attractive

- simple

- fast

- card-based

- reward-oriented

Merchant UI should be:

- professional

- clean

- efficient

- optimized for tablet/desktop

- easy for non-technical business owners

Use subtle animations only where useful.

Do not overuse gradients or excessive visual effects.

Use a consistent design system.

Use accessible contrast.

Buttons should clearly communicate actions.

==================================================

26. CUSTOMER HOME UX

==================================================

Prioritize these actions:

1. View loyalty programs

2. Show My QR

3. View rewards

4. View activity

The customer should understand the app within seconds.

The most important information should be:

- current points

- stamp progress

- next reward

- unlocked rewards

==================================================

27. MERCHANT SCAN UX

==================================================

Scanning must be extremely fast.

Create a dedicated Scan screen.

The merchant should be able to choose:

[ Scan Customer ]

[ Scan Reward ]

Customer scan flow:

Scan

→ Customer identified

→ Store membership verified

→ Select Points or Stamp action

→ Complete

→ Success

Reward scan flow:

Scan

→ Reward validated

→ Show reward

→ Confirm

→ Redeemed

==================================================

28. ERROR HANDLING

==================================================

Create clear user-friendly error states.

Examples:

- Invalid QR

- Expired QR

- Customer not a member

- Reward already redeemed

- Insufficient points

- Reward expired

- Unauthorized store

- Network error

- Telegram authentication failure

Never expose technical database errors to users.

==================================================

29. FUTURE-READY BUT DO NOT BUILD YET

==================================================

Architect the code so the following can be added later, but DO NOT implement them now:

- Coupons

- Marketing offers

- Referral programs

- Customer segmentation

- Advanced analytics

- Staff accounts

- Multiple store branches

- POS integrations

- WhatsApp

- Web customer wallet

- Apple Wallet / Google Wallet

- Paid subscriptions

- Advanced notification campaigns

The MVP must remain focused on Loyalty.

==================================================

30. IMPORTANT PRODUCT PRINCIPLE

==================================================

Do NOT turn Fello into a CRM.

Do NOT add unnecessary enterprise features.

The MVP's core loop is:

JOIN

→ EARN

→ PROGRESS

→ REWARD

→ REDEEM

→ RETURN

Everything in the MVP should support this loop.

==================================================

31. LANDING PAGE

==================================================

Create a polished landing page for merchants.

Hero:

"Turn Customers Into Regulars."

Supporting message:

"Launch a digital loyalty program for your business in minutes — no app development required."

Primary CTA:

"Start Free"

Secondary CTA:

"See How It Works"

Explain:

1. Create your loyalty program

2. Display your Fello QR

3. Customers join instantly

4. Customers earn points or stamps

5. Customers redeem rewards

6. Customers come back

Show both:

Points Mode

and

Stamp Mode

Use visual mockups of the customer wallet and merchant dashboard.

The landing page must also be multilingual.

==================================================

32. IMPORTANT IMPLEMENTATION RULES

==================================================

Before writing code:

1. Analyze the requirements.

2. Design the database schema.

3. Design the application architecture.

4. Identify security-sensitive operations.

5. Create the i18n architecture.

6. Then implement.

Do not build everything as one giant component.

Use reusable components.

Use clear folder structure.

Use TypeScript types.

Keep business logic separate from UI.

Use reusable hooks/services where appropriate.

Do not duplicate code.

Do not hard-code business rules.

Do not hard-code translations.

Do not hard-code currency assumptions.

Do not hard-code one country.

Do not hard-code one language.

==================================================

33. IMPORTANT: DO NOT FAKE FUNCTIONALITY

==================================================

Do not create fake buttons that only display success messages.

Real functionality is required for:

- authentication

- store creation

- loyalty program creation

- customer membership

- points

- stamps

- rewards

- QR generation

- QR validation

- redemption

- transaction ledger

- notifications where possible

- RLS

If an integration cannot be fully implemented in the current environment, clearly isolate it behind a service/interface and provide the required configuration/setup instructions.

Do not silently replace real functionality with mock data.

==================================================

34. DEVELOPMENT PRIORITY

==================================================

Build in this order:

PHASE 1

Foundation

- React

- TypeScript

- Tailwind

- shadcn

- Supabase

- i18n

- RTL

PHASE 2

Authentication

- Merchant authentication

- Telegram customer authentication

PHASE 3

Merchant

- Store

- Loyalty Program

- Points Mode

- Stamp Mode

- Rewards

PHASE 4

Customer

- Fello Wallet

- Store membership

- Customer QR

- Points

- Stamps

- Rewards

PHASE 5

Operations

- Scan Customer

- Award Points

- Award Stamp

- Reward Redemption

- Reward QR

PHASE 6

Notifications

- Telegram event notifications

PHASE 7

Security

- RLS

- Edge Functions

- QR security

- transaction integrity

- audit logs

PHASE 8

Polish

- responsive UI

- empty states

- loading states

- error states

- accessibility

- multilingual QA

==================================================

35. FINAL ACCEPTANCE CRITERIA

==================================================

The MVP is considered functional only when this complete scenario works:

MERCHANT:

Create account

→ Create store

→ Choose Points Mode

→ Set $1 = 2 points

→ Set Welcome Bonus = 50 points

→ Create Free Coffee reward = 200 points

→ Generate Store QR

CUSTOMER:

Scan Store QR

→ Open Fello in Telegram

→ Authenticate automatically

→ Join ABC Coffee

→ Receive 50 Welcome Points

→ See ABC Coffee in Fello Wallet

PURCHASE:

Customer opens My QR

→ Merchant scans

→ Enters $25 purchase

→ Backend calculates 50 points

→ Customer balance becomes 100 points

→ Customer receives Telegram notification

STAMP TEST:

Create another Stamp program

→ 1 purchase = 1 stamp

→ 5 stamps = Free Coffee

→ Customer scans

→ Merchant adds stamp

→ Progress updates correctly

→ Customer receives notification

→ After 5 stamps reward becomes available

REDEMPTION:

Customer unlocks reward

→ Presses Redeem

→ Backend validates

→ Reward QR generated

→ Merchant scans Reward QR

→ Reward validated

→ Merchant confirms

→ Reward becomes REDEEMED

→ Same reward cannot be redeemed again

MULTI-STORE:

Same customer joins:

ABC Coffee

Pizza House

Elite Barber

All three programs appear in the same Fello Wallet.

Their points/stamps remain completely separate.

MULTILINGUAL:

First launch automatically selects a reasonable language.

User can manually change language.

Selected language persists.

Arabic switches the complete UI to RTL.

All seven languages work without hard-coded English strings.

==================================================

36. DO NOT EXPAND THE SCOPE

==================================================

This is an MVP.

Do not add:

- payments

- subscriptions

- coupons

- referrals

- POS integrations

- advanced CRM

- complex analytics

- AI

- marketplace

unless explicitly requested later.

Focus on making the core loyalty experience exceptionally simple, reliable, secure and polished.

Start by creating the architecture and database schema, then implement the MVP.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9420177e-2880-43b2-9a73-a1186e69b66b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
