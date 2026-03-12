import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Headphones, MessageCircle, Plus, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { messagesAPI } from '../../services/api';
import { getSocket, joinConversation } from '../../services/socket';

const toDateLabel = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

const Messages = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('booking');

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [bookingMessages, setBookingMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingBookingMessages, setLoadingBookingMessages] = useState(false);

  const [supportConversations, setSupportConversations] = useState([]);
  const [supportTechnicians, setSupportTechnicians] = useState([]);
  const [selectedSupportConversationId, setSelectedSupportConversationId] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [loadingSupportList, setLoadingSupportList] = useState(false);
  const [loadingSupportMessages, setLoadingSupportMessages] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');

  const [replyText, setReplyText] = useState('');

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const selectedSupportConversation = useMemo(
    () => supportConversations.find((item) => item.id === selectedSupportConversationId) || null,
    [supportConversations, selectedSupportConversationId]
  );

  const loadConversations = async () => {
    try {
      setLoadingList(true);
      const response = await messagesAPI.getConversations();
      const list = response.data?.data || [];
      setConversations(list);
      if (!selectedConversationId && list.length > 0) {
        setSelectedConversationId(list[0].id);
      }
    } catch (error) {
      console.error('Load conversations error:', error);
      toast.error(error.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoadingList(false);
    }
  };

  const loadBookingMessages = async (conversationId) => {
    if (!conversationId) return;
    try {
      setLoadingBookingMessages(true);
      const response = await messagesAPI.getConversationMessages(conversationId);
      setBookingMessages(response.data?.data?.messages || []);
      setConversations((prev) =>
        prev.map((item) => (item.id === conversationId ? { ...item, unread_count: 0 } : item))
      );
    } catch (error) {
      console.error('Load messages error:', error);
      toast.error(error.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoadingBookingMessages(false);
    }
  };

  const loadSupportTechnicians = async () => {
    try {
      const response = await messagesAPI.getSupportTechnicians();
      setSupportTechnicians(response.data?.data || []);
    } catch (error) {
      console.error('Load support technicians error:', error);
      toast.error(error.response?.data?.message || 'Failed to load technicians');
    }
  };

  const loadSupportConversations = async () => {
    try {
      setLoadingSupportList(true);
      const response = await messagesAPI.getSupportConversations();
      const list = response.data?.data || [];
      setSupportConversations(list);
      if (!selectedSupportConversationId && list.length > 0) {
        setSelectedSupportConversationId(list[0].id);
      }
    } catch (error) {
      console.error('Load support conversations error:', error);
      toast.error(error.response?.data?.message || 'Failed to load support conversations');
    } finally {
      setLoadingSupportList(false);
    }
  };

  const loadSupportMessages = async (conversationId) => {
    if (!conversationId) return;
    try {
      setLoadingSupportMessages(true);
      const response = await messagesAPI.getSupportConversationMessages(conversationId);
      setSupportMessages(response.data?.data?.messages || []);
      setSupportConversations((prev) =>
        prev.map((item) => (item.id === conversationId ? { ...item, unread_count: 0 } : item))
      );
    } catch (error) {
      console.error('Load support messages error:', error);
      toast.error(error.response?.data?.message || 'Failed to load support messages');
    } finally {
      setLoadingSupportMessages(false);
    }
  };

  useEffect(() => {
    loadConversations();
    loadSupportTechnicians();
    loadSupportConversations();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const conversationId = Number(params.get('conversationId') || 0);
    const supportConversationId = Number(params.get('supportConversationId') || 0);

    if (tab === 'support') {
      setActiveTab('support');
    }

    if (conversationId) {
      setActiveTab('booking');
      setSelectedConversationId(conversationId);
    }

    if (supportConversationId) {
      setActiveTab('support');
      setSelectedSupportConversationId(supportConversationId);
    }
  }, [location.search]);

  useEffect(() => {
    loadBookingMessages(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    loadSupportMessages(selectedSupportConversationId);
  }, [selectedSupportConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    joinConversation(selectedConversationId);
    const socket = getSocket();
    if (!socket) return;

    const onMessage = (payload) => {
      if (payload.conversation_id !== selectedConversationId) return;
      setBookingMessages((prev) => [...prev, payload]);
      setConversations((prev) => prev.map((item) => (
        item.id === selectedConversationId
          ? { ...item, last_message: payload }
          : item
      )));
    };

    socket.on('chat:message', onMessage);
    return () => socket.off('chat:message', onMessage);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedSupportConversationId) return;
    const socket = getSocket();
    if (!socket) return;

    const onSupportMessage = (payload) => {
      if (payload.conversation_id !== selectedSupportConversationId) return;
      setSupportMessages((prev) => [...prev, payload]);
      setSupportConversations((prev) => prev.map((item) => (
        item.id === selectedSupportConversationId
          ? { ...item, last_message: payload }
          : item
      )));
    };

    socket.on('support:message', onSupportMessage);
    return () => socket.off('support:message', onSupportMessage);
  }, [selectedSupportConversationId]);

  const handleOpenSupportConversation = async () => {
    if (!selectedTechnicianId) {
      toast.error('Select a technician first');
      return;
    }

    try {
      const response = await messagesAPI.createSupportConversation(selectedTechnicianId);
      const conversation = response.data?.data;
      if (conversation?.id) {
        setSelectedSupportConversationId(conversation.id);
      }
      await loadSupportConversations();
      setActiveTab('support');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to open support conversation');
    }
  };

  const handleSendReply = async () => {
    if (!selectedSupportConversationId || !replyText.trim()) return;
    try {
      await messagesAPI.sendSupportMessage(selectedSupportConversationId, replyText.trim());
      setReplyText('');
      await loadSupportMessages(selectedSupportConversationId);
      await loadSupportConversations();
    } catch (error) {
      console.error('Send message error:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  return (
    <div className="h-full flex flex-col admin-page">
      {/* Header */}
      <div>
        <h1 className="admin-page-title mb-2">Messages</h1>
        <p className="admin-page-subtitle">Monitor booking chats and manage private technician support</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('booking')}
          className={`px-6 py-3 rounded-t-lg text-sm font-medium ${
            activeTab === 'booking' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <MessageCircle size={16} />
            Booking Conversations (Read Only)
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('support')}
          className={`px-6 py-3 rounded-t-lg text-sm font-medium ${
            activeTab === 'support' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <Headphones size={16} />
            Technician Support
          </span>
        </button>
      </div>

      {activeTab === 'booking' ? (
        <div className="admin-card flex-1 flex overflow-hidden">
        {/* List Panel */}
        <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-gray-800 font-semibold">Conversation List</h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="p-8 text-center">
                <p className="text-gray-700 text-sm font-medium">Loading conversations...</p>
              </div>
            ) : null}
            {!loadingList && conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-700 text-sm font-medium">No messages yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedConversationId(item.id)}
                    className={`p-4 hover:bg-blue-50 cursor-pointer transition-colors ${
                      selectedConversationId === item.id ? 'bg-blue-50' : ''
                    } ${item.unread_count > 0 ? 'bg-yellow-50/60' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-gray-800 font-medium text-sm">Booking #{item.booking?.id || '-'}</p>
                        <p className="text-gray-800 text-sm">{item.customer?.name || 'Customer'} ↔ {item.technician?.name || 'Technician'}</p>
                      </div>
                      {item.unread_count > 0 ? (
                        <span className="bg-amber-500 text-slate-900 text-xs px-2 py-0.5 rounded-full font-semibold">
                          {item.unread_count}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-gray-700 text-sm truncate">{item.last_message?.message || 'No messages yet'}</p>
                    <p className="text-gray-600 text-sm mt-2">{toDateLabel(item.last_message?.created_at || item.updated_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col bg-white">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-800 text-lg font-medium">Select a conversation</p>
                <p className="text-gray-700 text-sm mt-2">Select a conversation to view and reply.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-gray-800 font-semibold">
                    Booking #{selectedConversation.booking?.id || '-'}
                  </p>
                  <p className="text-gray-800 text-sm">
                    {selectedConversation.customer?.name || 'Customer'} ↔ {selectedConversation.technician?.name || 'Technician'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingBookingMessages ? <p className="text-gray-600">Loading messages...</p> : null}
                {!loadingBookingMessages && bookingMessages.length === 0 ? (
                  <p className="text-gray-600">No messages yet for this conversation.</p>
                ) : null}
                {bookingMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === Number(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 0) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-md border ${
                      msg.sender_id === Number(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 0)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    } rounded-lg p-3`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-2 ${msg.sender_id === Number(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 0) ? 'text-blue-100' : 'text-gray-600'}`}>
                        {toDateLabel(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <p className="text-sm font-medium text-blue-700">
                    Admin read-only mode: Booking conversations are visible for monitoring only.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      ) : null}

      {activeTab === 'support' ? (
        <div className="admin-card flex-1 flex overflow-hidden">
          <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
            <div className="p-4 border-b border-gray-200 space-y-3">
              <h3 className="text-gray-800 font-semibold">Technician Support</h3>
              <div className="flex gap-2">
                <select
                  value={selectedTechnicianId}
                  onChange={(e) => setSelectedTechnicianId(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
                >
                  <option value="">Select technician</option>
                  {supportTechnicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleOpenSupportConversation}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={14} />
                  Open
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingSupportList ? (
                <div className="p-8 text-center">
                  <p className="text-gray-700 text-sm font-medium">Loading support conversations...</p>
                </div>
              ) : null}
              {!loadingSupportList && supportConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <Headphones size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-700 text-sm font-medium">No support conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {supportConversations.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSupportConversationId(item.id)}
                      className={`p-4 hover:bg-blue-50 cursor-pointer transition-colors ${
                        selectedSupportConversationId === item.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-gray-800 font-medium text-sm">{item.technician?.name || 'Technician'}</p>
                          <p className="text-gray-700 text-sm">{item.technician?.email || '-'}</p>
                        </div>
                        {item.unread_count > 0 ? (
                          <span className="bg-amber-500 text-slate-900 text-xs px-2 py-0.5 rounded-full font-semibold">
                            {item.unread_count}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-gray-700 text-sm truncate">{item.last_message?.message || 'No messages yet'}</p>
                      <p className="text-gray-600 text-sm mt-2">{toDateLabel(item.last_message?.created_at || item.updated_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-white">
            {!selectedSupportConversation ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Headphones size={64} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-800 text-lg font-medium">Select a support conversation</p>
                  <p className="text-gray-700 text-sm mt-2">Choose a technician conversation to provide support.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-gray-800 font-semibold">Technician Support</p>
                    <p className="text-gray-800 text-sm">{selectedSupportConversation.technician?.name || 'Technician'}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingSupportMessages ? <p className="text-gray-600">Loading messages...</p> : null}
                  {!loadingSupportMessages && supportMessages.length === 0 ? (
                    <p className="text-gray-600">No support messages yet for this conversation.</p>
                  ) : null}
                  {supportMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === Number(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 0) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-md border ${
                        msg.sender_id === Number(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 0)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      } rounded-lg p-3`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-2 ${msg.sender_id === Number(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 0) ? 'text-blue-100' : 'text-gray-600'}`}>
                          {toDateLabel(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendReply();
                      }}
                      placeholder="Type support message..."
                      className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Messages;
