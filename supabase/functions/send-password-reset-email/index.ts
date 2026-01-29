import React from 'https://esm.sh/react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'https://esm.sh/resend@4.0.0'
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22'
import { PasswordResetEmail } from './_templates/password-reset.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)

  console.log('[PasswordReset] Recebendo webhook do Supabase Auth')

  try {
    const wh = new Webhook(hookSecret)
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
        user_metadata?: {
          nome?: string
          name?: string
        }
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
      }
    }

    console.log('[PasswordReset] Tipo de ação:', email_action_type)
    console.log('[PasswordReset] Email:', user.email)

    // Só processa emails de recovery (reset de senha)
    if (email_action_type !== 'recovery') {
      console.log('[PasswordReset] Ignorando - não é recovery:', email_action_type)
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const userName = user.user_metadata?.nome || user.user_metadata?.name

    // Construir link de reset
    const resetLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

    console.log('[PasswordReset] Gerando template de email')

    // Renderizar template React Email
    const html = await renderAsync(
      React.createElement(PasswordResetEmail, {
        userName,
        resetLink,
      })
    )

    console.log('[PasswordReset] Enviando email via Resend')

    // Enviar email via Resend
    const { error, data } = await resend.emails.send({
      from: 'Vade Mecum Elite <onboarding@resend.dev>',
      to: [user.email],
      subject: 'Redefinir sua senha - Vade Mecum Elite',
      html,
    })

    if (error) {
      console.error('[PasswordReset] Erro ao enviar email:', error)
      throw error
    }

    console.log('[PasswordReset] Email enviado com sucesso:', data?.id)

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('[PasswordReset] Erro:', error.message)
    
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
