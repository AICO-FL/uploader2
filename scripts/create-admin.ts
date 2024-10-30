import { db } from '../lib/db';
import bcrypt from 'bcryptjs';
import { createId } from '@paralleldrive/cuid2';
import type { UserRole } from '@/lib/auth';

async function createAdmin() {
  const email = 'admin@example.com';
  const password = 'admin123';
  const name = 'System Admin';
  const id = createId();

  try {
    const database = db(); // Get database instance
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = database.prepare(`
      INSERT OR REPLACE INTO users (id, username, email, name, password, role, is_admin)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(id, 'admin', email, name, passwordHash, 'ADMIN' as UserRole);

    if (result.changes > 0) {
      console.log('Admin account created successfully');
      console.log('Email:', email);
      console.log('Password:', password);
    } else {
      console.log('Failed to create admin account');
    }
  } catch (error) {
    console.error('Failed to create admin account:', error);
  }
}

createAdmin();