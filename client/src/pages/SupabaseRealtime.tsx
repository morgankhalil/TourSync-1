import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/SupabaseAuthContext'

export function SupabaseRealtime() {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Change received!', payload)
          fetchMessages()
        }
      )
      .subscribe()

    // Fetch initial messages
    fetchMessages()

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    setMessages(data)
  }

  const addMessage = async () => {
    if (!newMessage.trim() || !user) return

    const { error } = await supabase.from('messages').insert({
      content: newMessage,
      user_id: user.id,
      user_name: user.user_metadata?.name || user.email,
    })

    if (error) throw error
    setNewMessage('')
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Real-time Chat</h1>
      
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="p-4 border rounded">
            <p className="font-bold">{message.user_name}</p>
            <p>{message.content}</p>
            <p className="text-sm text-gray-500">
              {new Date(message.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Type a message..."
        />
        <button
          onClick={addMessage}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  )
}
