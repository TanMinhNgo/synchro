# Synchro Database Design (MongoDB)

Mục tiêu: hỗ trợ UI quản lý task theo Workspace/Project, có Kanban (To-do/In Progress/In Review/Completed), calendar view, chia sẻ/invite member.

## Collections

### `users`
- `_id`: ObjectId
- `email`: string (unique, lowercase)
- `name`: string
- `avatarUrl?`: string
- `passwordHash?`: string (chỉ có nếu đăng ký email/password)
- `providers`: {
  - `google?: { id: string }`
  - `github?: { id: string }`
}
- `createdAt`, `updatedAt`

**Indexes**
- `email` unique
- `providers.google.id` unique (sparse)

### `workspaces`
- `_id`: ObjectId
- `name`: string
- `slug`: string (unique)
- `ownerId`: ObjectId (`users._id`)
- `createdAt`, `updatedAt`

**Indexes**
- `slug` unique
- `ownerId`

### `workspace_members`
- `_id`: ObjectId
- `workspaceId`: ObjectId
- `userId`: ObjectId
- `role`: `owner | admin | member`
- `createdAt`

**Indexes**
- (`workspaceId`, `userId`) unique
- (`userId`)

### `workspace_invites`
- `_id`: ObjectId
- `workspaceId`: ObjectId
- `email`: string (lowercase)
- `role`: `admin | member`
- `tokenHash`: string (sha256)
- `expiresAt`: Date (TTL)
- `acceptedAt?`: Date
- `createdAt`

**Indexes**
- (`workspaceId`, `email`) unique (tuỳ chính sách)
- `expiresAt` TTL

### `projects`
- `_id`: ObjectId
- `workspaceId`: ObjectId
- `name`: string
- `description?`: string
- `createdAt`, `updatedAt`

**Indexes**
- (`workspaceId`, `name`)

### `task_status_columns`
Dùng cho Kanban (các cột To-do/In Progress/... per project)
- `_id`: ObjectId
- `projectId`: ObjectId
- `key`: `todo | in_progress | in_review | completed` (hoặc custom string)
- `name`: string
- `order`: number

**Indexes**
- (`projectId`, `key`) unique
- (`projectId`, `order`)

### `tasks`
- `_id`: ObjectId
- `projectId`: ObjectId
- `workspaceId`: ObjectId (denormalize để query nhanh)
- `title`: string
- `description?`: string
- `statusKey`: string (ref `task_status_columns.key`)
- `orderInColumn`: number
- `assigneeIds`: ObjectId[]
- `dueDate?`: Date
- `startDate?`: Date
- `progress?`: number (0..100)
- `createdById`: ObjectId
- `createdAt`, `updatedAt`

**Indexes**
- (`projectId`, `statusKey`, `orderInColumn`)
- (`workspaceId`, `dueDate`)
- (`assigneeIds`)

### `task_comments`
- `_id`: ObjectId
- `taskId`: ObjectId
- `authorId`: ObjectId
- `content`: string
- `createdAt`

**Indexes**
- (`taskId`, `createdAt`)

### `auth_sessions`
Phục vụ refresh token dạng opaque + rotation.
- `_id`: ObjectId
- `userId`: ObjectId
- `refreshTokenHash`: string (sha256)
- `createdAt`: Date
- `expiresAt`: Date (TTL)
- `revokedAt?`: Date
- `userAgent?`: string
- `ip?`: string

**Indexes**
- (`userId`)
- `refreshTokenHash` unique
- `expiresAt` TTL

## Notes
- Các collection `workspace_*` giúp triển khai invite/role giống UI.
- `auth_sessions` tách khỏi `users` để tránh document phình theo thời gian.
