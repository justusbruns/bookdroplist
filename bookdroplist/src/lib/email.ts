import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendMagicLinkOptions {
  email: string
  token: string
  baseUrl: string
}

export async function sendMagicLink({ email, token, baseUrl }: SendMagicLinkOptions) {
  try {
    const magicLink = `${baseUrl}/api/auth/verify?token=${token}`

    const { data, error } = await resend.emails.send({
      from: 'Book Drop List <onboarding@resend.dev>',
      to: [email],
      subject: '📚 Your Book Drop List Magic Link',
      text: `
Hi there!

Click the link below to create your book list:

${magicLink}

This link will expire in 15 minutes for security.

If you didn't request this, you can safely ignore this email.

Happy reading!
The Book Drop List Team
      `.trim(),
    })

    if (error) {
      console.error('Failed to send magic link email:', error)
      throw new Error('Failed to send email')
    }

    console.log('Magic link email sent successfully:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Error sending magic link:', error)
    throw error
  }
}