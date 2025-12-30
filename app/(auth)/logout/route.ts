import { logout } from '@/lib/actions/auth'

export async function GET() {
  await logout()
}
