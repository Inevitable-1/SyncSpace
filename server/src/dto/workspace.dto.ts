export interface CreateWorkspaceDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
}

export interface UpdateWorkspaceDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
}

export interface WorkspaceQueryDto {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  isPublic?: boolean;
}
