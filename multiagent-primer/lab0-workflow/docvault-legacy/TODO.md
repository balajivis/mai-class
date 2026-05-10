# DocVault TODO — Updated Sprint 38 (2021-11-02)

## P0 — Must Do Before Black Friday 2021
- [x] Add bulk discount logic for orders > $200 (see `SearchUtil.calcular_descuento()`)
- [x] Cache product catalog in Redis to reduce DB load
- [ ] Fix race condition in checkout when two users buy last item simultaneously
- [ ] Add rate limiting to `/api/products/search` — getting hammered by scrapers

## P1 — Q1 2022
- [ ] Migrate from Elasticsearch 7.x to OpenSearch (AWS deprecation)
- [ ] Split OrderService into smaller services (Carlos started this but left before finishing)
- [ ] Add DTOs — stop returning JPA entities directly from REST endpoints
- [ ] Implement proper password hashing (currently bcrypt but Priya said "something feels off")
- [ ] Set up Flyway migrations instead of manual schema changes

## P2 — Q2 2022
- [ ] Internationalize the codebase — Carlos's Spanish method names need to be standardized
- [ ] Add Swagger/OpenAPI docs
- [ ] Implement proper CORS policy (currently `*` — "we'll lock this down before production")
- [ ] Move SMTP credentials to environment variables
- [ ] Add integration tests for the checkout flow (currently 0 test coverage)
- [ ] Investigate "search is slow" report from QA (ticket DVL-847, never reproduced)

## P3 — Nice to Have
- [ ] Dark mode for admin panel (requested by Jake)
- [ ] PDF invoice generation (prototype in `InvoiceGenerator.java` — never finished)
- [ ] Loyalty points system (see `RewardsEngine.java` — Carlos's side project)
- [ ] Migrate from RabbitMQ to Kafka for order events

## Notes
- **Redis cluster**: Running on `redis-cluster.pawsfirst.internal:6379-6384`. Priya set it up, nobody else has the config docs. Ask her if it breaks.
- **Elasticsearch**: Index mapping is in `es-mappings/products-v3.json`. Don't change it without rebuilding the index.
- **Jake's refactor (Sprint 42)**: He merged PaymentService, InventoryService, and NotificationService into OrderService. Said it was "simpler." Carlos would have killed him.
- **Black Friday 2021 hotfix**: Lines 247-289 in OrderService are a "temporary" workaround for a currency rounding bug. DO NOT REMOVE — it's load-bearing. The real fix requires changing the schema and nobody wants to touch that.

---

*Last edited by Carlos M. on 2021-11-02. Priya added the password hashing note on 2021-12-15.*
*Jake: "I'll update this after my refactor" (2022-06-15) — he did not.*
