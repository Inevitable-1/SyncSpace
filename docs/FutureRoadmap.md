# Future Roadmap

Where SyncSpace goes next.

---

## Short-term (next sprint)

### Video Meetings
- In-app video rooms using WebRTC.
- Screen sharing, presenter mode and recording.
- Tight integration with the existing meeting scheduling flow.

### Workspace Templates
- One-click templates: "Hackathon", "Product Sprint", "Study Group", "Engineering Team".
- Pre-seeded rooms, boards and starter files per template.

### Team Analytics
- Per-member activity, contribution heatmaps and engagement scores.
- Exportable dashboards for workspace owners.

### Notifications
- Email + in-app digests.
- Granular preferences (mute, follow, smart digest).
- Notification channels beyond the current real-time center.

---

## Medium-term

### AI Assistant (post-login)
- A workspace-aware assistant available **only after authentication**.
- Summaries of activity, suggested task priorities, and chat/message drafting.
- Optional integration points per workspace (opt-in by admin).

### File Sharing
- Drag-and-drop folders and bulk operations.
- Cloud storage backends (S3 / Cloudinary) with signed URLs.
- Share links with expiry and permission levels.

### Workspace Permissions
- Per-role permission matrix (view / edit / admin) per room and folder.
- Read-only guest links and external collaboration.
- Audit trail for permission changes.

---

## Long-term

- **Conflict-free editing** — OT / CRDT for whiteboards and documents.
- **Real terminal execution** — Docker-in-Docker sandboxes inside code rooms.
- **Rich document collaboration** — Notion-style blocks with history.
- **Elasticsearch** full-text search across the whole workspace.
- **Email verification** and SAML/SSO for enterprise.
- **Rate limiting & brute-force protection** at the gateway.
- **CI/CD** — GitHub Actions for test, build and deploy.
- **E2E testing** with Playwright across core collaboration flows.
- **Mobile apps** — React Native companions for whiteboard + chat.
