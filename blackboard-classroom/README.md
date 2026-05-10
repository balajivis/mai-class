# blackboard-classroom

Live-classroom blackboard server for the Modern AI Pro **multiagents-v2** workshop.

5 teams of 7 students each get a different real coding project. Every student spawns 2–3 Claude Code agents that coordinate through this server's per-team blackboard with contract-net task allocation, stigmergic learning, and a 3-tier evaluation dashboard.

## Quick start

```bash
npm install
npm run tokens          # issue 5 fresh team tokens (save the print-out)
npm run seed            # pre-load 60 starter tasks across 5 projects
npm run dev             # → http://127.0.0.1:3007
```

Open:
- Team view: `http://127.0.0.1:3007/projects/team1?token=<team1-token>`
- Master view: `http://127.0.0.1:3007/master`
- Replay: `http://127.0.0.1:3007/projects/team1/replay?token=<team1-token>`

## Companion plugin

Students install [`workshop-kit`](../workshop-kit/) — a Claude Code plugin that connects to this server.

## Status

11 build slices done, end-to-end verified locally. **Not yet deployed to prod.** See [`HANDOFF.md`](./HANDOFF.md) for the next agent's playbook, [`DEPLOY.md`](./DEPLOY.md) for the one-time kapi-prod bootstrap, and [`INSTRUCTOR-RUNBOOK.md`](./INSTRUCTOR-RUNBOOK.md) for the workshop-day script.

## License

MIT.
