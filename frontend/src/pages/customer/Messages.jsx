import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { messagesAPI } from '../../services/api';
import { getSocket, joinConversation } from '../../services/socket';

const toDateLabel = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

const getSafeUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const CustomerMessages = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');

  const user = useMemo(getSafeUser, []);
  const userId = Number(user?.id || 0);

  const selectedConversation = useMemo(
    () => conversations.find((item) => Number(item.id) === Number(selectedConversationId)) || null,
    [conversations, selectedConversationId]
  );

  const loadConversations = async () => {
    try {
      setLoadingList(true);
      const response = await messagesAPI.getConversations();
      const list = response.data?.data || [];
      setConversations(list);

      const params = new URLSearchParams(location.search);
      const preferredConversationId = Number(params.get('conversationId') || 0);
      const preferredBookingId = Number(params.get('bookingId') || 0);

      if (preferredConversationId) {
        const preferred = list.find((item) => Number(item.id) === preferredConversationId);
        if (preferred) {
          setSelectedConversationId(preferred.id);
          return;
        }
      }

      if (preferredBookingId) {
        const preferred = list.find((item) => Number(item.booking_id || item.booking?.id) === preferredBookingId);
        if (preferred) {
          setSelectedConversationId(preferred.id);
          return;
        }
      }

      if (!selectedConversationId && list.length > 0) {
        setSelectedConversationId(list[0].id);
      }
    } catch (error) {
      console.error('Load customer conversations error:', error);
      toast.error(error.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoadingList(false);
    }
  };

  const loadMessages = async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      setLoadingMessages(true);
      const response = await messagesAPI.getConversationMessages(conversationId);
      setMessages(response.data?.data?.messages || []);
      setConversations((prev) =>
        prev.map((item) => (Number(item.id) === Number(conversationId) ? { ...item, unread_count: 0 } : item))
      );
    } catch (error) {
      console.error('Load customer messages error:', error);
      toast.error(error.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const liveUser = getSafeUser();
    if (!token || !liveUser || liveUser.role !== 'customer') {
      navigate('/login');
      return;
    }

    loadConversations();
  }, [navigate]);

  useEffect(() => {
    loadMessages(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    joinConversation(selectedConversationId);

    const socket = getSocket();
    if (!socket) return;

    const onMessage = (payload) => {
      if (!payload?.conversation_id) return;

      setConversations((prev) =>
        prev.map((item) => {
          if (Number(item.id) !== Number(payload.conversation_id)) return item;
          const isActive = Number(selectedConversationId) === Number(payload.conversation_id);
          return {
            ...item,
            last_message: payload,
            unread_count: isActive ? 0 : Number(item.unread_count || 0) + 1,
          };
        })
      );

      if (Number(payload.conversation_id) === Number(selectedConversationId)) {
        setMessages((prev) => [...prev, payload]);
      }
    };

    socket.on('chat:message', onMessage);
    return () => socket.off('chat:message', onMessage);
  }, [selectedConversationId]);

  const handleSendReply = async () => {
    if (!selectedConversationId || !replyText.trim()) return;
    try {
      await messagesAPI.sendMessage(selectedConversationId, replyText.trim());
      setReplyText('');
      await loadMessages(selectedConversationId);
      await loadConversations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  return (
    <div className="pt-28 sm:pt-32 min-h-screen bg-gray-50 pb-8 sm:pb-12">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-700">Messages</h1>
          <p className="text-gray-500 mt-1">Chat directly with your assigned technician</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden min-h-[68vh] grid lg:grid-cols-[340px_1fr]">
          <aside className="border-r border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-sm font-bold text-gray-800">Conversations</h2>
            </div>

            <div className="overflow-y-auto max-h-[68vh]">
              {loadingList ? (
                <p className="p-4 text-sm text-gray-600">Loading conversations...</p>
              ) : null}

              {!loadingList && conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle size={42} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-600">No conversations yet</p>
                </div>
              ) : null}

              {!loadingList && conversations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedConversationId(item.id)}
                  className={`w-full text-left p-4 border-b border-gray-100 transition hover:bg-blue-50 ${
                    Number(selectedConversationId) === Number(item.id) ? 'bg-blue-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Booking #{item.booking?.id || item.booking_id || '-'}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{item.technician?.name || 'Technician'}</p>
                    </div>
                    {Number(item.unread_count || 0) > 0 ? (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                        {Number(item.unread_count) > 9 ? '9+' : Number(item.unread_count)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 truncate text-xs text-gray-500">{item.last_message?.message || 'No messages yet'}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex flex-col bg-white">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-center p-6">
                <div>
                  <MessageCircle size={56} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-800 font-semibold">Select a conversation</p>
                  <p className="text-sm text-gray-600 mt-1">Choose a booking chat to start messaging.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-800">Booking #{selectedConversation.booking?.id || selectedConversation.booking_id}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Technician: {selectedConversation.technician?.name || 'Technician'}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/60 max-h-[54vh]">
                  {loadingMessages ? <p className="text-sm text-gray-600">Loading messages...</p> : null}
                  {!loadingMessages && messages.length === 0 ? <p className="text-sm text-gray-600">No messages yet.</p> : null}
                  {messages.map((msg) => {
                    const mine = Number(msg.sender_id) === userId;
                    return (
                      <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[78%] rounded-xl border px-3 py-2 shadow-sm ${mine ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-800'}`}>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`mt-1 text-[11px] ${mine ? 'text-blue-100' : 'text-gray-500'}`}>{toDateLabel(msg.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-gray-200 p-3 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendReply();
                    }}
                    placeholder="Type your message..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Send size={15} />
                    Send
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CustomerMessages;
