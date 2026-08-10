# API_DOCUMENTATION.md

## Overview

SyncSpace API is a RESTful API built with Node.js and Express, providing comprehensive endpoints for all collaborative features. The API follows standard REST conventions with proper validation, authentication, and error handling.

## Base URL

All API endpoints are available at:
```
http://localhost:5000/api
```

## Authentication

### JWT Token Authentication

All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <accessToken>
```

Access tokens are stored in localStorage and automatically refreshed when they expire.

### Demo Mode

When backend APIs are unavailable, the application automatically switches to demo mode:
- All endpoints return demo data from `client/src/data/demoWorkspaces.ts`
- No authentication required for demo mode
- Special demo token: `demo-token`

## API Endpoints

### 1. Authentication (7 endpoints)

#### POST `/api/auth/register`

**Purpose**: Register a new user account

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "accessToken": "jwt_token_here"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Validation error"
}
```

#### POST `/api/auth/login`

**Purpose**: Authenticate user and get access token

**Request**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "accessToken": "jwt_token_here"
  }
}
```

#### POST `/api/auth/demo`

**Purpose**: Quick login as demo user for testing

**Request**: None

**Response** (200):
```json
{
  "success": true,
  "message": "Demo login successful",
  "data": {
    "user": {
      "id": "demo-user",
      "name": "Demo User",
      "email": "demo@example.com"
    },
    "accessToken": "demo-token"
  }
}
```

#### POST `/api/auth/refresh-token`

**Purpose**: Get new access token using refresh token

**Request**: None (uses httpOnly refresh token cookie)

**Response** (200):
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "new_jwt_token_here"
  }
}
```

#### POST `/api/auth/logout`

**Purpose**: Logout user and invalidate tokens

**Request**: None

**Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST `/api/auth/forgot-password`

**Purpose**: Send password reset email

**Request**:
```json
{
  "email": "john@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### POST `/api/auth/reset-password`

**Purpose**: Reset password using reset token

**Request**:
```json
{
  "token": "reset_token_here",
  "password": "new_password123"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

#### GET `/api/auth/me`

**Purpose**: Get current authenticated user

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "User retrieved",
  "data": {
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### 2. Workspaces (16 endpoints)

#### POST `/api/workspaces`

**Purpose**: Create a new workspace

**Request**:
```json
{
  "name": "My Project",
  "description": "Project description",
  "color": "#6366f1",
  "icon": "🚀",
  "isPublic": false
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Workspace created",
  "data": {
    "workspace": {
      "_id": "ws_123",
      "name": "My Project",
      "description": "Project description",
      "color": "#6366f1",
      "icon": "🚀",
      "isPublic": false,
      "owner": "user_123",
      "memberCount": 1,
      "roomCount": 0,
      "isDeleted": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### GET `/api/workspaces`

**Purpose**: List all workspaces for authenticated user

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Workspaces retrieved",
  "data": {
    "workspaces": [
      {
        "_id": "ws_123",
        "name": "My Project",
        "description": "Project description",
        "color": "#6366f1",
        "icon": "🚀",
        "isPublic": false,
        "isFavorite": false,
        "inviteCode": "WS-INVITE-123",
        "owner": "user_123",
        "memberCount": 1,
        "roomCount": 0,
        "isDeleted": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

#### GET `/api/workspaces/search?q=query`

**Purpose**: Search workspaces by name

**Request**: Requires valid JWT token, query parameter `q`

**Response** (200):
```json
{
  "success": true,
  "message": "Search results",
  "data": {
    "workspaces": [
      {
        "_id": "ws_123",
        "name": "My Project",
        "description": "Project description",
        "color": "#6366f1",
        "icon": "🚀",
        "matchScore": 0.85
      }
    ]
  }
}
```

#### GET `/api/workspaces/trash`

**Purpose**: Get soft-deleted workspaces

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Trash items retrieved",
  "data": {
    "workspaces": [
      {
        "_id": "ws_123",
        "name": "Deleted Project",
        "description": "Previously deleted workspace",
        "isDeleted": true,
        "deletedAt": "2024-01-15T00:00:00.000Z"
      }
    ]
  }
}
```

#### GET `/api/workspaces/:id`

**Purpose**: Get workspace details

**Request**: Requires valid JWT token, workspace ID in URL parameter

**Response** (200):
```json
{
  "success": true,
  "message": "Workspace retrieved",
  "data": {
    "workspace": {
      "_id": "ws_123",
      "name": "My Project",
      "description": "Project description",
      "color": "#6366f1",
      "icon": "🚀",
      "isPublic": false,
      "owner": "user_123",
      "memberCount": 1,
      "roomCount": 0,
      "isDeleted": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### PUT `/api/workspaces/:id`

**Purpose**: Update workspace (owner only)

**Request**: Requires valid JWT token, workspace ID, and update data

**Response** (200):
```json
{
  "success": true,
  "message": "Workspace updated",
  "data": {
    "workspace": {
      "_id": "ws_123",
      "name": "Updated Project",
      "description": "Updated description",
      "color": "#10b981",
      "icon": "📁",
      "isPublic": true,
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  }
}
```

#### DELETE `/api/workspaces/:id`

**Purpose**: Soft-delete workspace (owner only)

**Request**: Requires valid JWT token, workspace ID

**Response** (200):
```json
{
  "success": true,
  "message": "Workspace deleted"
}
```

#### POST `/api/workspaces/:id/restore`

**Purpose**: Restore deleted workspace (owner only)

**Request**: Requires valid JWT token, workspace ID

**Response** (200):
```json
{
  "success": true,
  "message": "Workspace restored",
  "data": {
    "workspace": {
      "_id": "ws_123",
      "name": "My Project",
      "isDeleted": false,
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  }
}
```

#### POST `/api/workspaces/:id/invite-code`

**Purpose**: Regenerate invite code (owner only)

**Request**: Requires valid JWT token, workspace ID

**Response** (200):
```json
{
  "success": true,
  "message": "Invite code regenerated",
  "data": {
    "inviteCode": "NEW-INVITE-CODE-123"
  }
}
```

#### POST `/api/workspaces/join`

**Purpose**: Join workspace by invite code

**Request**:
```json
{
  "inviteCode": "WS-INVITE-123"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Joined workspace",
  "data": {
    "workspace": {
      "_id": "ws_123",
      "name": "My Project",
      "memberCount": 2
    }
  }
}
```

#### POST `/api/workspaces/:id/favorite`

**Purpose**: Toggle workspace favorite status

**Request**: Requires valid JWT token, workspace ID

**Response** (200):
```json
{
  "success": true,
  "message": "Favorite status updated",
  "data": {
    "workspace": {
      "_id": "ws_123",
      "isFavorite": true
    }
  }
}
```

#### POST `/api/workspaces/:id/archive`

**Purpose**: Archive workspace

**Request**: Requires valid JWT token, workspace ID

**Response** (200):
```json
{
  "success": true,
  "message": "Workspace archived"
}
```

#### POST `/api/workspaces/:id/unarchive`

**Purpose**: Unarchive workspace

**Request**: Requires valid JWT token, workspace ID

**Response** (200):
```json
{
  "success": true,
  "message": "Workspace unarchived",
  "data": {
    "workspace": {
      "_id": "ws_123",
      "isDeleted": false,
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  }
}
```

#### GET `/api/workspaces/:id/members`

**Purpose**: List workspace members

**Request**: Requires valid JWT token, workspace ID with pagination

**Response** (200):
```json
{
  "success": true,
  "message": "Members retrieved",
  "data": {
    "members": [
      {
        "_id": "mem_123",
        "userId": {
          "id": "user_123",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "workspaceId": "ws_123",
        "role": "owner",
        "status": "active",
        "invitedBy": {
          "id": "user_123",
          "name": "John Doe"
        },
        "joinedAt": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1
    }
  }
}
```

#### POST `/api/workspaces/:id/members`

**Purpose**: Add member to workspace

**Request**:
```json
{
  "userId": "user_456"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Member added",
  "data": {
    "member": {
      "_id": "mem_456",
      "userId": {
        "id": "user_456",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "workspaceId": "ws_123",
      "role": "member",
      "status": "invited",
      "invitedBy": {
        "id": "user_123",
        "name": "John Doe"
      },
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  }
}
```

#### DELETE `/api/workspaces/:id/members/:mid`

**Purpose**: Remove member from workspace

**Request**: Requires valid JWT token, workspace ID, and member ID

**Response** (200):
```json
{
  "success": true,
  "message": "Member removed"
}
```

### 3. Rooms (8 endpoints)

#### POST `/api/rooms`

**Purpose**: Create a new room

**Request**:
```json
{
  "name": "Daily Standup",
  "type": "whiteboard",
  "workspaceId": "ws_123",
  "description": "Daily team standup"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Room created",
  "data": {
    "room": {
      "_id": "room_123",
      "name": "Daily Standup",
      "type": "whiteboard",
      "workspace": "ws_123",
      "owner": "user_123",
      "inviteCode": "ROOM-STANDUP-123",
      "isActive": true,
      "participants": ["user_123"],
      "isDeleted": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### GET `/api/rooms`

**Purpose**: List rooms for authenticated user

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Rooms retrieved",
  "data": {
    "rooms": [
      {
        "_id": "room_123",
        "name": "Daily Standup",
        "type": "whiteboard",
        "workspace": "ws_123",
        "owner": "user_123",
        "inviteCode": "ROOM-STANDUP-123",
        "isActive": true,
        "participants": ["user_123"],
        "isDeleted": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

#### GET `/api/rooms/stats`

**Purpose**: Room statistics for dashboard

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Statistics retrieved",
  "data": {
    "stats": {
      "totalRooms": 5,
      "activeRooms": 3,
      "workspaceCount": 2,
      "whiteboardRooms": 2,
      "codeRooms": 2,
      "documentRooms": 1
    }
  }
}
```

#### GET `/api/rooms/:id`

**Purpose**: Get room details

**Request**: Requires valid JWT token, room ID

**Response** (200):
```json
{
  "success": true,
  "message": "Room retrieved",
  "data": {
    "room": {
      "_id": "room_123",
      "name": "Daily Standup",
      "type": "whiteboard",
      "workspace": "ws_123",
      "owner": "user_123",
      "inviteCode": "ROOM-STANDUP-123",
      "isActive": true,
      "participants": ["user_123"],
      "isDeleted": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### PUT `/api/rooms/:id`

**Purpose**: Update room (owner only)

**Request**: Requires valid JWT token, room ID, and update data

**Response** (200):
```json
{
  "success": true,
  "message": "Room updated",
  "data": {
    "room": {
      "_id": "room_123",
      "name": "Updated Standup",
      "description": "Updated description",
      "type": "code",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  }
}
```

#### DELETE `/api/rooms/:id`

**Purpose**: Soft-delete room (owner only)

**Request**: Requires valid JWT token, room ID

**Response** (200):
```json
{
  "success": true,
  "message": "Room deleted"
}
```

#### POST `/api/rooms/:id/restore`

**Purpose**: Restore deleted room (owner only)

**Request**: Requires valid JWT token, room ID

**Response** (200):
```json
{
  "success": true,
  "message": "Room restored",
  "data": {
    "room": {
      "_id": "room_123",
      "isDeleted": false,
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  }
}
```

#### POST `/api/rooms/join`

**Purpose**: Join room by invite code

**Request**:
```json
{
  "inviteCode": "ROOM-STANDUP-123"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Joined room",
  "data": {
    "room": {
      "_id": "room_123",
      "name": "Daily Standup",
      "participants": ["user_123", "user_456"]
    }
  }
}
```

### 4. Members (7 endpoints)

#### GET `/api/workspaces/:id/members/stats`

**Purpose**: Member statistics (total, by role, by status)

**Request**: Requires valid JWT token, workspace ID

**Response** (200):
```json
{
  "success": true,
  "message": "Member stats retrieved",
  "data": {
    "stats": {
      "total": 5,
      "byRole": {
        "owner": 1,
        "admin": 1,
        "member": 3
      },
      "byStatus": {
        "active": 4,
        "invited": 1,
        "suspended": 0
      }
    }
  }
}
```

#### POST `/api/workspaces/:id/members`

**Purpose**: Add member to workspace (alternative endpoint)

**Request**:
```json
{
  "userId": "user_456"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Member added",
  "data": {
    "member": {
      "_id": "mem_456",
      "userId": {
        "id": "user_456",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "workspaceId": "ws_123",
      "role": "member",
      "status": "invited",
      "invitedBy": {
        "id": "user_123",
        "name": "John Doe"
      },
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  }
}
```

#### PUT `/api/workspaces/:id/members/:mid/role`

**Purpose**: Update member role

**Request**:
```json
{
  "role": "admin"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Member role updated",
  "data": {
    "member": {
      "_id": "mem_456",
      "role": "admin"
    }
  }
}
```

#### PUT `/api/workspaces/:id/members/:mid/suspend`

**Purpose**: Suspend member

**Request**: Requires valid JWT token (owner/admin only)

**Response** (200):
```json
{
  "success": true,
  "message": "Member suspended"
}
```

#### PUT `/api/workspaces/:id/members/:mid/reactivate`

**Purpose**: Reactivate suspended member

**Request**: Requires valid JWT token (owner/admin only)

**Response** (200):
```json
{
  "success": true,
  "message": "Member reactivated"
}
```

#### DELETE `/api/workspaces/:id/members/:mid`

**Purpose**: Remove member from workspace

**Request**: Requires valid JWT token (owner/admin only)

**Response** (200):
```json
{
  "success": true,
  "message": "Member removed"
}
```

### 5. Invites (7 endpoints)

#### GET `/api/workspaces/:id/invites/stats`

**Purpose**: Invite statistics

**Request**: Requires valid JWT token, workspace ID

**Response** (200):
```json
{
  "success": true,
  "message": "Invite stats retrieved",
  "data": {
    "stats": {
      "total": 3,
      "pending": 2,
      "accepted": 1,
      "expired": 0
    }
  }
}
```

#### POST `/api/workspaces/:id/invites`

**Purpose**: Create invite

**Request**:
```json
{
  "email": "newmember@example.com",
  "role": "member"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Invite created",
  "data": {
    "invite": {
      "_id": "inv_123",
      "email": "newmember@example.com",
      "workspaceId": "ws_123",
      "invitedBy": {
        "id": "user_123",
        "name": "John Doe"
      },
      "role": "member",
      "status": "pending",
      "token": "INVITE-TOKEN-123",
      "expiresAt": "2024-01-20T00:00:00.000Z",
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  }
}
```

#### DELETE `/api/workspaces/:id/invites/:inviteId`

**Purpose**: Revoke invite

**Request**: Requires valid JWT token (owner/admin only)

**Response** (200):
```json
{
  "success": true,
  "message": "Invite revoked"
}
```

#### GET `/api/invites/pending`

**Purpose**: Get pending invites for current user

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Pending invites retrieved",
  "data": {
    "invites": [
      {
        "_id": "inv_123",
        "email": "newmember@example.com",
        "workspaceId": "ws_123",
        "invitedBy": {
          "id": "user_123",
          "name": "John Doe"
        },
        "role": "member",
        "status": "pending",
        "token": "INVITE-TOKEN-123",
        "expiresAt": "2024-01-20T00:00:00.000Z"
      }
    ]
  }
}
```

#### POST `/api/invites/:token/accept`

**Purpose**: Accept invite by token

**Request**: None

**Response** (200):
```json
{
  "success": true,
  "message": "Invite accepted",
  "data": {
    "workspace": {
      "_id": "ws_123",
      "name": "My Project",
      "memberCount": 2
    }
  }
}
```

#### POST `/api/invites/:token/decline`

**Purpose**: Decline invite by token

**Request**: None

**Response** (200):
```json
{
  "success": true,
  "message": "Invite declined"
}
```

### 6. Chat (5 endpoints)

#### GET `/api/chat/:roomId`

**Purpose**: Get messages with pagination

**Request**: Requires valid JWT token, room ID with pagination params

**Response** (200):
```json
{
  "success": true,
  "message": "Messages retrieved",
  "data": {
    "messages": [
      {
        "_id": "msg_123",
        "room": "room_123",
        "sender": {
          "id": "user_123",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "content": "Hello everyone!",
        "type": "text",
        "edited": false,
        "isDeleted": false,
        "seenBy": ["user_123", "user_456"],
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "hasMore": false
    }
  }
}
```

#### POST `/api/chat/:roomId`

**Purpose**: Send message

**Request**:
```json
{
  "content": "Hello everyone!",
  "type": "text",
  "replyTo": "msg_123"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Message sent",
  "data": {
    "message": {
      "_id": "msg_124",
      "room": "room_123",
      "sender": {
        "id": "user_123",
        "name": "John Doe"
      },
      "content": "Hello everyone!",
      "type": "text",
      "edited": false,
      "isDeleted": false,
      "seenBy": ["user_123"],
      "createdAt": "2024-01-15T10:05:00.000Z"
    }
  }
}
```

#### PUT `/api/chat/:messageId`

**Purpose**: Edit message (sender only)

**Request**:
```json
{
  "content": "Updated message"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Message updated",
  "data": {
    "message": {
      "_id": "msg_123",
      "content": "Updated message",
      "edited": true,
      "updatedAt": "2024-01-15T10:10:00.000Z"
    }
  }
}
```

#### DELETE `/api/chat/:messageId`

**Purpose**: Delete message (sender only)

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Message deleted"
}
```

#### POST `/api/chat/:roomId/seen`

**Purpose**: Mark all unseen messages as seen

**Request**:
```json
{
  "userId": "user_123"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Messages marked as seen"
}
```

### 7. Tasks (7 endpoints)

#### GET `/api/tasks/workspace/:workspaceId`

**Purpose**: List tasks for workspace

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Tasks retrieved",
  "data": {
    "tasks": [
      {
        "_id": "task_123",
        "title": "Design dashboard",
        "description": "Create dashboard mockups",
        "workspace": "ws_123",
        "room": "room_123",
        "creator": {
          "id": "user_123",
          "name": "John Doe"
        },
        "assignee": {
          "id": "user_456",
          "name": "Jane Smith"
        },
        "status": "todo",
        "priority": "high",
        "labels": ["design"],
        "dueDate": "2024-01-20T00:00:00.000Z",
        "checklist": [
          { "text": "Wireframes", "done": true },
          { "text": "High-fidelity", "done": false }
        ],
        "order": 1,
        "isDeleted": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 10
  }
}
```

#### POST `/api/tasks`

**Purpose**: Create task

**Request**:
```json
{
  "title": "Design dashboard",
  "description": "Create dashboard mockups",
  "workspace": "ws_123",
  "room": "room_123",
  "assignee": "user_456",
  "status": "todo",
  "priority": "high",
  "labels": ["design"],
  "dueDate": "2024-01-20T00:00:00.000Z"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Task created",
  "data": {
    "task": {
      "_id": "task_124",
      "title": "Design dashboard",
      "description": "Create dashboard mockups",
      "workspace": "ws_123",
      "room": "room_123",
      "creator": {
        "id": "user_123",
        "name": "John Doe"
      },
      "assignee": {
        "id": "user_456",
        "name": "Jane Smith"
      },
      "status": "todo",
      "priority": "high",
      "labels": ["design"],
      "dueDate": "2024-01-20T00:00:00.000Z",
      "order": 2,
      "isDeleted": false,
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  }
}
```

#### PUT `/api/tasks/:id`

**Purpose**: Update task (partial update supported)

**Request**: Requires valid JWT token, task ID, and update data

**Response** (200):
```json
{
  "success": true,
  "message": "Task updated",
  "data": {
    "task": {
      "_id": "task_123",
      "title": "Updated Title",
      "status": "in-progress",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

#### DELETE `/api/tasks/:id`

**Purpose**: Delete task

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Task deleted"
}
```

#### POST `/api/tasks/:id/comments`

**Purpose**: Add comment to task

**Request**:
```json
{
  "content": "Great work!"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Comment added",
  "data": {
    "comment": {
      "_id": "comment_123",
      "content": "Great work!",
      "task": "task_123",
      "author": {
        "id": "user_123",
        "name": "John Doe"
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

#### GET `/api/tasks/:id/comments`

**Purpose**: Get comments for a task

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Comments retrieved",
  "data": {
    "comments": [
      {
        "_id": "comment_123",
        "content": "Great work!",
        "task": "task_123",
        "author": {
          "id": "user_123",
          "name": "John Doe"
        },
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "total": 5
  }
}
```

### 8. Files (5 endpoints)

#### GET `/api/files`

**Purpose**: List files with optional folder filter

**Request**: Requires valid JWT token, optional query params

**Response** (200):
```json
{
  "success": true,
  "message": "Files retrieved",
  "data": {
    "files": [
      {
        "_id": "file_123",
        "name": "README.md",
        "originalName": "README.md",
        "mimeType": "text/markdown",
        "size": 2456,
        "path": "/Documentation/README.md",
        "workspace": "ws_123",
        "folder": "Documentation",
        "uploader": {
          "id": "user_123",
          "name": "John Doe"
        },
        "isDeleted": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "folders": ["Documentation", "Design", "Reports"]
  }
}
```

#### GET `/api/files/folders`

**Purpose**: List distinct folder paths

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Folders retrieved",
  "data": {
    "folders": ["Documentation", "Design", "Reports", "Presentations"]
  }
}
```

#### POST `/api/files`

**Purpose**: Upload file

**Request**: Requires valid JWT token, form data with file

**Response** (201):
```json
{
  "success": true,
  "message": "File uploaded",
  "data": {
    "file": {
      "_id": "file_124",
      "name": "document.pdf",
      "originalName": "document.pdf",
      "mimeType": "application/pdf",
      "size": 123456,
      "path": "/Uploads/document.pdf",
      "workspace": "ws_123",
      "folder": "Documentation",
      "uploader": {
        "id": "user_123",
        "name": "John Doe"
      },
      "isDeleted": false,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

#### DELETE `/api/files/:id`

**Purpose**: Delete file

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "File deleted"
}
```

#### PUT `/api/files/:id/rename`

**Purpose**: Rename file

**Request**:
```json
{
  "name": "new-name.pdf"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "File renamed",
  "data": {
    "file": {
      "_id": "file_123",
      "name": "new-name.pdf",
      "originalName": "original-name.pdf",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

### 9. Documents (6 endpoints)

#### GET `/api/documents/room/:roomId`

**Purpose**: List documents for room

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Documents retrieved",
  "data": {
    "documents": [
      {
        "_id": "doc_123",
        "name": "README.md",
        "path": "/Documentation/README.md",
        "content": "# Project Documentation",
        "language": "markdown",
        "room": "room_123",
        "workspace": "ws_123",
        "createdBy": {
          "id": "user_123",
          "name": "John Doe"
        },
        "lastEditedBy": {
          "id": "user_123",
          "name": "John Doe"
        },
        "isFolder": false,
        "isDeleted": false,
        "versionTimestamps": ["2024-01-01T00:00:00.000Z"],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### GET `/api/documents/:id`

**Purpose**: Get single document

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Document retrieved",
  "data": {
    "document": {
      "_id": "doc_123",
      "name": "README.md",
      "path": "/Documentation/README.md",
      "content": "# Project Documentation",
      "language": "markdown",
      "room": "room_123",
      "workspace": "ws_123",
      "createdBy": {
        "id": "user_123",
        "name": "John Doe"
      },
      "lastEditedBy": {
        "id": "user_123",
        "name": "John Doe"
      },
      "isFolder": false,
      "isDeleted": false,
      "versionTimestamps": ["2024-01-01T00:00:00.000Z"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### POST `/api/documents`

**Purpose**: Create document

**Request**:
```json
{
  "name": "new-document.md",
  "roomId": "room_123",
  "workspaceId": "ws_123",
  "content": "# New Document",
  "isFolder": false
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Document created",
  "data": {
    "document": {
      "_id": "doc_124",
      "name": "new-document.md",
      "path": "/Documentation/new-document.md",
      "content": "# New Document",
      "language": "markdown",
      "room": "room_123",
      "workspace": "ws_123",
      "createdBy": {
        "id": "user_123",
        "name": "John Doe"
      },
      "lastEditedBy": {
        "id": "user_123",
        "name": "John Doe"
      },
      "isFolder": false,
      "isDeleted": false,
      "versionTimestamps": ["2024-01-15T10:00:00.000Z"],
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

#### PUT `/api/documents/:id`

**Purpose**: Update document content

**Request**:
```json
{
  "content": "Updated content"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Document updated",
  "data": {
    "document": {
      "_id": "doc_123",
      "name": "README.md",
      "path": "/Documentation/README.md",
      "content": "Updated content",
      "lastEditedBy": {
        "id": "user_123",
        "name": "John Doe"
      },
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

#### PUT `/api/documents/:id/rename`

**Purpose**: Rename document/folder (cascades to children for folders)

**Request**:
```json
{
  "name": "new-name.md"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Document renamed",
  "data": {
    "document": {
      "_id": "doc_123",
      "name": "new-name.md",
      "path": "/Documentation/new-name.md",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

#### DELETE `/api/documents/:id`

**Purpose**: Delete document (cascades for folders)

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Document deleted"
}
```

### 10. Whiteboard, Activities, Notifications (10 endpoints)

#### GET `/api/whiteboards/:roomId`

**Purpose**: Get or auto-create whiteboard for a room

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Whiteboard retrieved",
  "data": {
    "whiteboard": {
      "_id": "wb_123",
      "roomId": "room_123",
      "objects": [
        {
          "id": "obj_123",
          "type": "rectangle",
          "x": 100,
          "y": 100,
          "width": 200,
          "height": 100,
          "stroke": "#6366f1",
          "fill": "rgba(99,102,241,0.15)",
          "strokeWidth": 2
        }
      ],
      "createdBy": "user_123",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### PUT `/api/whiteboards/:roomId`

**Purpose**: Save whiteboard

**Request**:
```json
{
  "objects": [
    {
      "id": "obj_123",
      "type": "rectangle",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 100,
      "stroke": "#6366f1",
      "fill": "rgba(99,102,241,0.15)",
      "strokeWidth": 2
    }
  ]
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Whiteboard saved"
}
```

#### GET `/api/activities`

**Purpose**: List activities for authenticated user

**Request**: Requires valid JWT token, optional entityType query param

**Response** (200):
```json
{
  "success": true,
  "message": "Activities retrieved",
  "data": {
    "activities": [
      {
        "_id": "act_123",
        "user": {
          "id": "user_123",
          "name": "John Doe"
        },
        "action": "created",
        "entityType": "workspace",
        "entityId": "ws_123",
        "entityName": "My Project",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 10
  }
}
```

#### DELETE `/api/activities/:id`

**Purpose**: Delete single activity

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Activity deleted"
}
```

#### DELETE `/api/activities/clear`

**Purpose**: Clear all activities for authenticated user

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "All activities cleared"
}
```

#### GET `/api/notifications`

**Purpose**: List notifications with unread count

**Request**: Requires valid JWT token, optional limit param

**Response** (200):
```json
{
  "success": true,
  "message": "Notifications retrieved",
  "data": {
    "notifications": [
      {
        "_id": "notif_123",
        "title": "New comment",
        "message": "John Doe commented on your task",
        "type": "info",
        "entityType": "activity",
        "entityId": "act_123",
        "isRead": false,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "unreadCount": 1
  }
}
```

#### PUT `/api/notifications/read-all`

**Purpose**: Mark all notifications as read

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

#### PUT `/api/notifications/:id/read`

**Purpose**: Mark single notification as read

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

#### DELETE `/api/notifications/:id`

**Purpose**: Delete notification

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

#### DELETE `/api/notifications/clear`

**Purpose**: Clear all notifications

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "All notifications cleared"
}
```

### 11. Meetings (6 endpoints)

#### GET `/api/meetings`

**Purpose**: List meetings for authenticated user

**Request**: Requires valid JWT token, optional status filters

**Response** (200):
```json
{
  "success": true,
  "message": "Meetings retrieved",
  "data": {
    "meetings": [
      {
        "_id": "meet_123",
        "name": "Sprint Planning",
        "description": "Plan upcoming sprint",
        "workspace": "ws_123",
        "host": {
          "id": "user_123",
          "name": "John Doe"
        },
        "participants": [
          {
            "id": "user_123",
            "name": "John Doe"
          },
          {
            "id": "user_456",
            "name": "Jane Smith"
          }
        ],
        "scheduledAt": "2024-01-15T14:00:00.000Z",
        "duration": 60,
        "status": "scheduled",
        "agenda": "Sprint planning and backlog grooming",
        "meetingCode": "MEET-PLAN-123",
        "isDeleted": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### GET `/api/meetings/:id`

**Purpose**: Get meeting details

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Meeting retrieved",
  "data": {
    "meeting": {
      "_id": "meet_123",
      "name": "Sprint Planning",
      "description": "Plan upcoming sprint",
      "workspace": "ws_123",
      "host": {
        "id": "user_123",
        "name": "John Doe"
      },
      "participants": [
        {
          "id": "user_123",
          "name": "John Doe"
        }
      ],
      "scheduledAt": "2024-01-15T14:00:00.000Z",
      "duration": 60,
      "status": "scheduled",
      "agenda": "Sprint planning and backlog grooming",
      "meetingCode": "MEET-PLAN-123",
      "isDeleted": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### POST `/api/meetings`

**Purpose**: Create meeting

**Request**:
```json
{
  "name": "Sprint Planning",
  "description": "Plan upcoming sprint",
  "workspace": "ws_123",
  "participants": ["user_456"],
  "scheduledAt": "2024-01-15T14:00:00.000Z",
  "duration": 60,
  "agenda": "Sprint planning and backlog grooming"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Meeting created",
  "data": {
    "meeting": {
      "_id": "meet_124",
      "name": "Sprint Planning",
      "description": "Plan upcoming sprint",
      "workspace": "ws_123",
      "host": {
        "id": "user_123",
        "name": "John Doe"
      },
      "participants": [
        {
          "id": "user_123",
          "name": "John Doe"
        },
        {
          "id": "user_456",
          "name": "Jane Smith"
        }
      ],
      "scheduledAt": "2024-01-15T14:00:00.000Z",
      "duration": 60,
      "status": "scheduled",
      "agenda": "Sprint planning and backlog grooming",
      "meetingCode": "MEET-PLAN-124",
      "isDeleted": false,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

#### PUT `/api/meetings/:id`

**Purpose**: Update meeting

**Request**: Requires valid JWT token, meeting ID, and update data

**Response** (200):
```json
{
  "success": true,
  "message": "Meeting updated",
  "data": {
    "meeting": {
      "_id": "meet_123",
      "name": "Updated Sprint Planning",
      "status": "rescheduled",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

#### PUT `/api/meetings/:id/rename`

**Purpose**: Rename meeting

**Request**:
```json
{
  "name": "Updated Sprint Planning"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Meeting renamed",
  "data": {
    "meeting": {
      "_id": "meet_123",
      "name": "Updated Sprint Planning",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

#### DELETE `/api/meetings/:id`

**Purpose**: Delete meeting

**Request**: Requires valid JWT token

**Response** (200):
```json
{
  "success": true,
  "message": "Meeting deleted"
}
```

### 12. Socket.IO Events

#### Whiteboard Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join-room` | Client → Server | `{ roomId, userId, userName }` | Join a whiteboard room |
| `leave-room` | Client → Server | `{ roomId }` | Leave a whiteboard room |
| `draw` | Bidirectional | `{ roomId, object }` | Draw object on whiteboard |
| `update-object` | Bidirectional | `{ roomId, object }` | Update existing object |
| `delete-object` | Bidirectional | `{ roomId, objectId }` | Delete object from whiteboard |
| `cursor-move` | Bidirectional | `{ roomId, userId, x, y }` | Update cursor position |
| `undo` | Client → Server | `{ roomId }` | Undo last action |
| `redo` | Client → Server | `{ roomId }` | Redo last undone action |
| `clear-canvas` | Client → Server | `{ roomId }` | Clear entire canvas |
| `save-whiteboard` | Bidirectional | `{ roomId, objects }` | Save whiteboard state |

#### Editor Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `editor-join` | Client → Server | `{ roomId, userId, userName }` | Join editor room |
| `editor-leave` | Client → Server | `{ roomId }` | Leave editor room |
| `code-change` | Bidirectional | `{ roomId, fileName, content, cursor }` | Code content change |
| `cursor-update` | Bidirectional | `{ roomId, userId, cursor, fileName }` | Cursor position update |
| `selection-update` | Bidirectional | `{ roomId, userId, selection, fileName }` | Text selection update |
| `save-document` | Client → Server | `{ roomId, fileName, content }` | Save document |
| `sync-document` | Bidirectional | `{ roomId, fileName, content }` | Sync document across clients |

#### Chat Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `send-message` | Client → Server | `{ roomId, content, type, replyTo }` | Send chat message |
| `edit-message` | Client → Server | `{ roomId, messageId, content }` | Edit message |
| `delete-message` | Client → Server | `{ roomId, messageId }` | Delete message |
| `typing-start` | Client → Server | `{ roomId, userId, userName }` | Start typing indicator |
| `typing-stop` | Client → Server | `{ roomId, userId }` | Stop typing indicator |
| `mark-seen` | Client → Server | `{ roomId, userId }` | Mark messages as seen |
| `update-activity` | Bidirectional | `{ roomId, activity }` | Update activity feed |

## Error Response Format

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Success Response Format

All successful responses follow this format:
```json
{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}
```

## Authentication

### JWT Token

All authenticated endpoints require:
```
Authorization: Bearer <accessToken>
```

### Demo Mode

When backend APIs are unavailable, all endpoints automatically switch to demo mode:
- Return demo data from `client/src/data/demoWorkspaces.ts`
- Demo token: `demo-token`
- All operations work offline

### Session Management

- Access tokens are stored in localStorage under the `auth` key
- Refresh tokens are handled automatically by API interceptor
- Demo mode does not require authentication

## Rate Limiting

API endpoints implement rate limiting to prevent abuse:
- Standard endpoints: 100 requests per minute
- Authentication endpoints: 5 requests per minute
- File upload endpoints: 10 requests per minute

## File Upload

### File Upload Endpoint

#### POST `/api/files`

**Request**:
- Content-Type: multipart/form-data
- Form data field: `file` (file), `workspace` (string), `folder` (optional)

**Example**:
```bash
curl -X POST http://localhost:5000/api/files \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "workspace=ws_123" \
  -F "folder=Documentation"
```

**Response**:
```json
{
  "success": true,
  "message": "File uploaded",
  "data": {
    "file": {
      "_id": "file_123",
      "name": "document.pdf",
      "originalName": "document.pdf",
      "mimeType": "application/pdf",
      "size": 123456,
      "path": "/Uploads/document.pdf",
      "workspace": "ws_123",
      "folder": "Documentation",
      "uploader": {
        "id": "user_123",
        "name": "John Doe"
      },
      "isDeleted": false,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

## WebSocket Connection

### Connection URL

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  },
  transports: ['websocket', 'polling']
});
```

### Connection Events

#### Connection Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `connect` | Server → Client | - | Connection established |
| `disconnect` | Server → Client | - | Connection closed |
| `connect_error` | Server → Client | - | Connection error |

#### Room Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join-room` | Client → Server | `{ roomId, userId, userName }` | Join room |
| `joined` | Server → Client | `{ roomId }` | Successfully joined room |
| `leave-room` | Client → Server | `{ roomId }` | Leave room |
| `left` | Server → Client | `{ roomId }` | Successfully left room |

### Error Handling

#### Connection Errors

- **Authentication Error**: Invalid token or token expired
- **Room Not Found**: Attempted to join non-existent room
- **Room Full**: Room at maximum capacity
- **Duplicate Join**: Already joined the room

#### Application Errors

- **Draw Error**: Invalid drawing object data
- **File Error**: File too large or invalid format
- **Permission Error**: Insufficient permissions for operation
- **Validation Error**: Invalid input data

## Health Check

### System Health

#### GET `/api/health`

**Purpose**: Check if the API is running

**Request**: No authentication required

**Response** (200):
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": "1.0.0"
}
```

## API Versioning

The API is currently at version 1.0.0. All endpoints follow consistent conventions:

### URL Structure

All endpoints follow the pattern: `/api/resource/:id` or `/api/resource`

### HTTP Methods

| Method | Action |
|--------|--------|
| GET | Retrieve data |
| POST | Create new resource |
| PUT | Update existing resource |
| DELETE | Delete resource |

### Pagination

For list endpoints:
- Query parameter: `page` (default: 1)
- Query parameter: `limit` (default: 20)
- Response includes total count and pagination info

Example:
```
GET /api/workspaces?page=1&limit=10
```

### Filtering

Most list endpoints support filtering:
- `q` for text search
- `status` for status filtering
- Date range filters

Example:
```
GET /api/tasks?workspaceId=ws_123&status=in-progress
```

## Development

### Local Development

```bash
git clone https://github.com/Inevitable-1/SyncSpace.git
cd SyncSpace
npm install
npm run dev
```

This starts both client (port 5173) and server (port 5000).

### API Testing

Use Postman or curl to test API endpoints:

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "password123"}'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}'
```

### Testing

The API includes comprehensive error handling and validation:

1. **Input Validation**: All endpoints validate input data
2. **Authentication**: Required for protected endpoints
3. **Permission Checks**: Resource ownership verification
4. **Error Handling**: Standardized error responses

## Migration Notes

### Breaking Changes

- Version 1.0.0: Initial release with stable API
- All endpoints follow REST conventions

### Future Versions

- Version 2.0.0: GraphQL support
- Version 3.0.0: gRPC support

## Documentation Updates

This documentation is updated with each major release. Always check for the latest version before production deployment.
