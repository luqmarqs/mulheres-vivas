import { useEffect, useState } from 'react'
import { supabase, supabaseConfigurado } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    if (!supabaseConfigurado) { setSession(null); return }

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: refreshed } = await supabase.auth.refreshSession()
        setSession(refreshed.session ?? data.session)
      } else {
        setSession(null)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/admin` },
    })
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return {
    session,
    user: session?.user ?? null,
    loading: session === undefined,
    loginWithGoogle,
    logout,
  }
}
