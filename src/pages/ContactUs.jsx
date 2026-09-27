import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './ContactUs.module.css'

// Formspree form ID — the part after /f/ in the form's endpoint URL. Set in .env.local
// as VITE_FORMSPREE_FORM_ID; the value is public by design (it only identifies the form).
const FORM_ID  = import.meta.env.VITE_FORMSPREE_FORM_ID
const ENDPOINT = FORM_ID ? `https://formspree.io/f/${FORM_ID}` : null

export default function ContactUs() {
  const [status, setStatus]     = useState('idle') // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const fields = new FormData(e.currentTarget)

    // Honeypot: people never see this field, so anything in it is a bot.
    // Pretend it worked and skip the request.
    if (fields.get('_gotcha')) { setStatus('sent'); return }

    if (!ENDPOINT) {
      setErrorMsg("This form isn't connected to a mailbox yet. Please try again later.")
      setStatus('error')
      return
    }

    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name:     fields.get('name'),
          email:    fields.get('email'),          // Formspree uses this as the reply-to address
          message:  fields.get('message'),
          _subject: `Wastedata message from ${fields.get('name')}`,
        }),
      })
      if (res.ok) { setStatus('sent'); return }
      const body   = await res.json().catch(() => null)
      const detail = body?.errors?.map(err => err.message).join(' ')
      setErrorMsg(detail || 'Something went wrong sending your message. Please try again.')
      setStatus('error')
    } catch {
      setErrorMsg("Couldn't reach the mail service. Check your connection and try again.")
      setStatus('error')
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.lede}>
          Questions about the data, feedback on the site, or something that looks wrong?
          Send a note and it goes straight to the person who built Wastedata.
        </p>

        {status === 'sent' ? (
          <div className={styles.success} role="status">
            <h2 className={styles.successTitle}>Thanks — your message has been sent.</h2>
            <Link to="/" className={styles.backLink}>Back to the data</Link>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>Name</span>
                <input
                  className={styles.input}
                  type="text"
                  name="name"
                  autoComplete="name"
                  maxLength={120}
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Email</span>
                <input
                  className={styles.input}
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                />
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.label}>Message</span>
              <textarea
                className={styles.textarea}
                name="message"
                rows={8}
                placeholder="Comments, feedback, or questions"
                required
              />
            </label>

            {/* Honeypot — visually hidden and skipped by assistive tech; bots fill it in */}
            <div className={styles.honeypot} aria-hidden="true">
              <label>
                Leave this field empty
                <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            {status === 'error' && (
              <p className={styles.error} role="alert">{errorMsg}</p>
            )}

            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.submit}
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </button>
              <span className={styles.privacy}>Your email is only used to reply to you.</span>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
