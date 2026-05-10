# DocVault Legacy

Internal e-commerce platform for pet supplies. Acquired in 2019 from PawsFirst Inc.
Original development team has since left the company.

## Running

```bash
mvn spring-boot:run
```

The app runs on port 8080. H2 console available at `/h2-console` (JDBC URL: `jdbc:h2:mem:docvault`).

## API Endpoints

- `GET /api/products` — List products
- `GET /api/products/{id}` — Product detail
- `GET /api/products/search?q=` — Search products
- `POST /api/cart/add` — Add to cart
- `GET /api/cart` — View cart
- `DELETE /api/cart/{itemId}` — Remove from cart
- `POST /api/checkout` — Place order
- `GET /api/orders` — Order history
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register
- `GET /api/admin/products` — Admin product list
- `PUT /api/admin/products/{id}` — Update product
- `GET /api/admin/inventory` — Inventory report

## Known Issues

- Search is "a little slow" on large catalogs (reported by QA, never investigated)
- Some Spanish method names from the original offshore team
- Email notifications are disabled in production (SMTP config issues)

## Team (Historical)

- **Carlos M.** — Original lead developer (left 2020)
- **Priya S.** — Backend developer (left 2021)
- **Jake W.** — Intern who "refactored" checkout in summer 2022 (left 2022)
- **Current** — Maintained by whoever draws the short straw

## Developer Guide

See `docs/CLAUDE.md` for the developer onboarding guide (written by Carlos before he left).
To use with Claude Code, copy it: `cp docs/CLAUDE.md .claude/CLAUDE.md`
