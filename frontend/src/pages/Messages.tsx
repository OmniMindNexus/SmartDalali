import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, MessageSquare, User, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Conversation {
  id: number;
  participants: number[]; // User IDs
  other_participant: {
    id: number;
    username: string;
    email: string;
    role: string;
    avatar: string | null;
  } | null;
  property: number | null; // Property ID
  property_title: string | null;
  last_message: Message | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface Message {
  id: number;
  sender: number; // Sender User ID
  sender_name: string;
  sender_role: string;
  sender_avatar: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ results: Conversation[] }>("/messaging/conversations/");
      setConversations(response.data.results || []);
    } catch (err) {
      setError("Failed to load conversations.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchConversations();

    // Polling for new conversations or updates (simulating real-time without websockets for now)
    const interval = setInterval(fetchConversations, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [user]); // Removed supabase dependencies

  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async (convId: number) => {
      setMessagesLoading(true);
      setMessagesError(null);
      try {
        const response = await api.get<{ results: Message[] }>(`/messaging/conversations/${convId}/messages/`);
        setMessages(response.data.results || []);
        await markMessagesAsRead(convId);
      } catch (err) {
        setMessagesError("Failed to load messages for this conversation.");
        console.error(err);
      } finally {
        setMessagesLoading(false);
      }
    };
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
      const interval = setInterval(() => fetchMessages(selectedConversationId), 5000); // Poll for new messages
      return () => clearInterval(interval);
    }
  }, [selectedConversationId, user]); // Added user to dependencies

  const markMessagesAsRead = async (convId: number) => {
    if (!user) return;
    try {
      // Find all unread messages for the current user in this conversation
      const unreadMessages = messages.filter(msg => !msg.is_read && msg.sender !== user.id);
      for (const msg of unreadMessages) {
        await api.post(`/messaging/messages/${msg.id}/mark_read/`);
      }
      // Update local state
      setMessages(prev => prev.map(msg => msg.sender !== user.id ? { ...msg, is_read: true } : msg));
      fetchConversations(); // Refresh conversation list to update unread counts
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || !user) return;

    try {
      await api.post(`/messaging/conversations/${selectedConversationId}/send_message/`, {
        content: newMessage.trim(),
      });
      setNewMessage("");
      // Refetch messages to show the new one
      const response = await api.get<{ results: Message[] }>(`/messaging/conversations/${selectedConversationId}/messages/`);
      setMessages(response.data.results || []);
      fetchConversations(); // Update conversation list (e.g., last message)
    } catch (err) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const otherParticipantName = conv.other_participant?.name || conv.other_participant?.username || '';
    const propertyTitle = conv.property_title || '';
    return (
      otherParticipantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-8">
            <p className="text-muted-foreground">Please log in to view messages</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-muted-foreground">Communicate with agents and users</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1 glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Conversations
              </CardTitle>
              <CardDescription>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {loading ? (
                  <div className="p-4 flex flex-col gap-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div key={conv.id}>
                      <button
                        onClick={() => setSelectedConversationId(conv.id)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          selectedConversationId === conv.id ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-medium line-clamp-1">
                            {conv.other_participant?.name || conv.other_participant?.username || "Unknown User"}
                            {conv.property_title && ` regarding ${conv.property_title}`}
                          </h3>
                          {conv.unread_count && conv.unread_count > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {conv.last_message?.content && (
                            <span className="truncate block">{conv.last_message.content}</span>
                          )}
                          <span className="text-xs">
                            {formatDistanceToNow(new Date(conv.updated_at), {
                            addSuffix: true,
                          })}
                          </span>
                        </p>
                      </button>
                      <Separator />
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages Area */}
          <Card className="lg:col-span-2 glass-effect">
            {selectedConversationId ? (
              <>
                <CardHeader>
                  <CardTitle>
                    {conversations.find((c) => c.id === selectedConversationId)?.other_participant?.name ||
                     conversations.find((c) => c.id === selectedConversationId)?.other_participant?.username || "Conversation"}
                    {conversations.find((c) => c.id === selectedConversationId)?.property_title &&
                     ` (${conversations.find((c) => c.id === selectedConversationId)?.property_title})`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <ScrollArea className="h-[480px] pr-4">
                    {messagesLoading ? (
                      <div className="flex flex-col gap-4">
                        <Skeleton className="h-12 w-3/4 self-start" />
                        <Skeleton className="h-12 w-2/3 self-end" />
                        <Skeleton className="h-12 w-1/2 self-start" />
                      </div>
                    ) : messagesError ? (
                      <p className="text-red-500">{messagesError}</p>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender === user?.id ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                message.sender === user?.id
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  message.sender === user?.id
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {formatDistanceToNow(new Date(message.created_at), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <Separator />

                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="min-h-[60px]"
                    />
                    <Button onClick={sendMessage} size="icon" className="h-[60px] w-[60px]">
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
