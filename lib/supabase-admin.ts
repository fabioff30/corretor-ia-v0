import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not available. Admin operations must run server-side.')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Tipos para admin
export interface AdminUser {
  id: string
  email: string
  name?: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface AdminSession {
  admin: AdminUser
  token: string
  expiresAt: number
}

// Funções de autenticação admin
export class AdminAuth {
  /**
   * Validar login de admin
   */
  static async validateLogin(email: string, password: string): Promise<{
    success: boolean
    admin?: AdminUser
    error?: string
  }> {
    try {
      const { data, error } = await getSupabaseAdmin()
        .rpc('validate_admin_login', {
          admin_email: email,
          admin_password: password
        })

      if (error) {
        console.error('Erro na validação do admin:', error)
        return { success: false, error: 'Erro interno do servidor' }
      }

      if (data?.success) {
        return {
          success: true,
          admin: data.admin
        }
      } else {
        return {
          success: false,
          error: data?.error || 'Credenciais inválidas'
        }
      }
    } catch (error) {
      console.error('Erro no AdminAuth.validateLogin:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  /**
   * Buscar admin por email
   */
  static async getAdminByEmail(email: string): Promise<AdminUser | null> {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Erro ao buscar admin:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro no AdminAuth.getAdminByEmail:', error)
      return null
    }
  }

  /**
   * Buscar admin por ID
   */
  static async getAdminById(id: string): Promise<AdminUser | null> {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('admin_users')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Erro ao buscar admin por ID:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro no AdminAuth.getAdminById:', error)
      return null
    }
  }

  /**
   * Atualizar último login do admin
   */
  static async updateLastLogin(adminId: string): Promise<boolean> {
    try {
      const { error } = await getSupabaseAdmin()
        .from('admin_users')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId)

      if (error) {
        console.error('Erro ao atualizar último login:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro no AdminAuth.updateLastLogin:', error)
      return false
    }
  }

  /**
   * Criar novo admin (somente para desenvolvimento)
   */
  static async createAdmin(
    email: string, 
    password: string, 
    name?: string
  ): Promise<{ success: boolean; adminId?: string; error?: string }> {
    try {
      const { data, error } = await getSupabaseAdmin()
        .rpc('create_initial_admin', {
          admin_email: email,
          admin_password: password,
          admin_name: name || 'Admin'
        })

      if (error) {
        console.error('Erro ao criar admin:', error)
        return { success: false, error: 'Erro interno do servidor' }
      }

      if (data?.success) {
        return {
          success: true,
          adminId: data.admin_id
        }
      } else {
        return {
          success: false,
          error: data?.error || 'Erro ao criar admin'
        }
      }
    } catch (error) {
      console.error('Erro no AdminAuth.createAdmin:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  /**
   * Verificar se existe algum admin
   */
  static async hasAdmins(): Promise<boolean> {
    try {
      const { count, error } = await getSupabaseAdmin()
        .from('admin_users')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.error('Erro ao verificar admins:', error)
        return false
      }

      return (count || 0) > 0
    } catch (error) {
      console.error('Erro no AdminAuth.hasAdmins:', error)
      return false
    }
  }
}