# DocVault Legacy - Product Vision

## What Is DocVault?

DocVault is an internal document management and e-commerce platform originally built as a pet supplies storefront by **PawsFirst Inc.** and later acquired (2019) and repurposed into a hybrid document vault / product catalog system. It serves as the company's primary tool for managing internal documents (annual reports, compliance audits, employee handbooks) alongside a residual product catalog.

## Origin Story

| Date | Event |
|------|-------|
| Pre-2019 | Built by PawsFirst Inc. as a pet supplies e-commerce app |
| 2019 | Acquired by current company; original team transitioned out |
| 2021 | Sprint 38 backlog created (TODO.md) - last major planning effort |
| Dec 2023 | Database migrated from PostgreSQL (AWS RDS) to H2 in-memory |
| Present | Maintained on a rotating "short straw" basis; no dedicated team |

## Core Users

| Persona | Needs |
|---------|-------|
| **Internal employees** | Browse and access company documents (annual reports, handbooks, compliance records) |
| **Administrators** | Manage document/product catalog, monitor inventory/stock, view order statistics |
| **Legacy customers** | (Residual) Browse products, manage cart, place orders |

## Problem Statement

The organization needed a centralized way to store and access internal documents. Rather than building a new system, they repurposed an acquired e-commerce platform. The "products" table now holds documents with a price of $0.00, and the checkout/cart flow doubles as a document request mechanism.

This approach was expedient but has led to:
- A domain model that doesn't match its actual use case
- Accumulated technical debt from the original team, the acquisition, and subsequent patches
- Critical security and reliability gaps that have never been addressed

## Vision

**Transform DocVault from a fragile, repurposed e-commerce app into a reliable, secure internal document management system** while preserving the existing workflows that users depend on.

### Strategic Goals

1. **Stability** - Eliminate data loss risk (H2 in-memory DB loses all data on restart) by restoring persistent storage
2. **Security** - Close critical vulnerabilities (SQL injection, exposed credentials, missing admin auth, plaintext passwords)
3. **Clarity** - Align the domain model with reality: documents are documents, not "products"
4. **Maintainability** - Reduce the burden on rotating maintainers by simplifying architecture and updating documentation
5. **Observability** - Replace console-only logging with proper monitoring so issues surface before users report them

### Non-Goals (For Now)

- Full rewrite or platform migration
- Adding new user-facing features
- Public-facing access or multi-tenant support
- Mobile app or SPA frontend

## Value Proposition

DocVault is the only system currently holding the company's compliance audits, annual reports, and employee handbooks. Despite its flaws, it is **load-bearing infrastructure**. The vision is not to replace it overnight but to incrementally harden it so it stops being a liability and starts being an asset.

## Key Metrics (Proposed)

| Metric | Current State | Target |
|--------|--------------|--------|
| Data persistence | None (H2 in-memory) | Durable (PostgreSQL or SQLite file) |
| SQL injection vectors | 3 known | 0 |
| Admin endpoints without auth | 5 | 0 |
| Plaintext passwords in DB | All new users | 0 |
| Exposed secrets in source | 3+ | 0 |
| Mean time to onboard new maintainer | Unknown (poor docs) | < 1 day |
