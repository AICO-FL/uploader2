import { writeFile, unlink, mkdir } from 'fs/promises';
import { createReadStream } from 'fs';
import { join } from 'path';
import { createId } from '@paralleldrive/cuid2';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

export async function initStorage() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
  }
}

export async function uploadFile(file: Buffer, originalName: string) {
  const fileId = createId();
  const fileName = `${fileId}-${originalName}`;
  const filePath = join(UPLOAD_DIR, fileName);
  
  await writeFile(filePath, file);
  return fileName;
}

export async function downloadFile(fileName: string) {
  const filePath = join(UPLOAD_DIR, fileName);
  return createReadStream(filePath);
}

export async function deleteFile(fileName: string) {
  const filePath = join(UPLOAD_DIR, fileName);
  await unlink(filePath);
}

export function getFileUrl(fileName: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/files/download/${fileName}`;
}