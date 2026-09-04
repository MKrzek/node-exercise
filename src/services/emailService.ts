export const emailService = {
  async sendEmail({
    to,
    subject,
    body,
  }: {
    to: string
    subject: string
    body: string
  }) {
    const response = await fetch('http://localhost:3001/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`notification service error: ${error}`)
    }

    return response.json()
  },
}
