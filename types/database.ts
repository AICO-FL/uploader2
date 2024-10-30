export interface User {
  id: string
  username: string
  email: string | null
  role: "ADMIN" | "USER" | "GUEST"
  is_admin: number
  created_at: string
}

export interface File {
  id: string
  name: string
  path: string
  size: number
  mime_type: string | null
  user_id: string | null
  folder_id: string | null
  download_count: number
  share_url: string | null
  share_password: string | null
  expires_at: string | null
  created_at: string
}

export interface Folder {
  id: string
  name: string
  user_id: string
  share_url: string | null
  share_password: string | null
  created_at: string
  files?: File[]
}

export interface Settings {
  id: number
  site_name: string
  logo_url: string | null
}

export interface FileWithUser extends File {
  user?: {
    name: string | null
    email: string | null
  }
}

export interface FolderWithFiles extends Folder {
  files: File[]
  _count?: {
    files: number
  }
}