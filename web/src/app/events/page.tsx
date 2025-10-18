"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  CalendarIcon,
  PlusIcon,
  UserGroupIcon,
  MapPinIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  HomeIcon,
  UserIcon,
  HeartIcon,
  GiftIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon,
  ShareIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../hooks/useAuth";
import WisheraLogo from "../../components/WisheraLogo";
import ThemeToggle from "../../components/ThemeToggle";
import LanguageSelector from "../../components/LanguageSelector";
import UserSearchAutocomplete from "../../components/UserSearchAutocomplete";
import NotificationBadge from "../../components/NotificationBadge";
import NotificationDropdown from "../../components/NotificationDropdown";
import BirthdayCountdownBanner from "../../components/BirthdayCountdownBanner";
import {
  createEvent,
  getMyEvents,
  getInvitedEvents,
  updateEvent,
  cancelEvent,
  deleteEvent,
  respondToInvitation,
  getFollowing,
  type Event,
  type EventInvitation,
  type CreateEventRequest,
  type UpdateEventRequest,
  type RespondToInvitationRequest,
  type UserSearchDTO
} from "../api";
import { InvitationStatus } from "../../types";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: (eventData: CreateEventRequest) => Promise<void>;
  friends: UserSearchDTO[];
}

function CreateEventModal({ isOpen, onClose, onCreateEvent, friends }: CreateEventModalProps) {
  const [formData, setFormData] = useState<CreateEventRequest>({
    title: "",
    description: "",
    eventDate: "",
    eventTime: "",
    location: "",
    additionalNotes: "",
    inviteeIds: [],
    eventType: "General"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreateEvent(formData);
      setFormData({
        title: "",
        description: "",
        eventDate: "",
        eventTime: "",
        location: "",
        additionalNotes: "",
        inviteeIds: [],
        eventType: "General"
      });
      onClose();
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFriend = (friendId: string) => {
    setFormData(prev => ({
      ...prev,
      inviteeIds: prev.inviteeIds.includes(friendId)
        ? prev.inviteeIds.filter(id => id !== friendId)
        : [...prev.inviteeIds, friendId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create Event</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter event title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Describe your event"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={formData.eventDate}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Time
              </label>
              <input
                type="time"
                value={formData.eventTime}
                onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Where will the event take place?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Type
            </label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="General">General</option>
              <option value="Birthday">Birthday</option>
              <option value="Party">Party</option>
              <option value="Meeting">Meeting</option>
              <option value="Celebration">Celebration</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows={2}
              placeholder="Dress code, special instructions, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invite Friends
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
              {friends.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No friends to invite</p>
              ) : (
                friends.map(friend => (
                  <label key={friend.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                    <input
                      type="checkbox"
                      checked={formData.inviteeIds.includes(friend.id)}
                      onChange={() => toggleFriend(friend.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{friend.username}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onCancel?: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
  onRespond?: (eventId: string, status: InvitationStatus) => void;
  isOwner?: boolean;
}

function EventCard({ event, onEdit, onCancel, onDelete, onRespond, isOwner }: EventCardProps) {
  const router = useRouter();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return null;
    // Handle both "HH:mm:ss" and "HH:mm" formats
    const time = timeString.includes(':') ? timeString : `${timeString}:00`;
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status?: InvitationStatus) => {
    switch (status) {
      case InvitationStatus.Accepted:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case InvitationStatus.Declined:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case InvitationStatus.Maybe:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusText = (status?: InvitationStatus) => {
    switch (status) {
      case InvitationStatus.Accepted:
        return "Accepted";
      case InvitationStatus.Declined:
        return "Declined";
      case InvitationStatus.Maybe:
        return "Maybe";
      default:
        return "Pending";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => router.push(`/events/${event.id}`)}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{event.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">by {event.creatorUsername}</p>
        </div>
        {event.isCancelled && (
          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded-full">
            Cancelled
          </span>
        )}
      </div>

      {event.description && (
        <p className="text-gray-700 dark:text-gray-300 mb-4">{event.description}</p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <CalendarIcon className="h-4 w-4 mr-2" />
          {formatDate(event.eventDate)}
        </div>
        {event.eventTime && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <ClockIcon className="h-4 w-4 mr-2" />
            {formatTime(event.eventTime)}
          </div>
        )}
        {event.location && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <MapPinIcon className="h-4 w-4 mr-2" />
            {event.location}
          </div>
        )}
      </div>

      {event.additionalNotes && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Notes:</strong> {event.additionalNotes}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center">
            <CheckIcon className="h-4 w-4 mr-1 text-green-600" />
            {event.acceptedCount} accepted
          </div>
          <div className="flex items-center">
            <XMarkIcon className="h-4 w-4 mr-1 text-red-600" />
            {event.declinedCount} declined
          </div>
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-yellow-600" />
            {event.pendingCount} pending
          </div>
        </div>

        {!isOwner && event.userResponse !== undefined && (
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.userResponse)}`}>
            {getStatusText(event.userResponse)}
          </span>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        {isOwner ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(event);
              }}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            {!event.isCancelled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel?.(event.id);
                }}
                className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Cancel
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(event.id);
              }}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </>
        ) : (
          !event.isCancelled && event.userResponse === undefined && (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRespond?.(event.id, InvitationStatus.Accepted);
                }}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Accept
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRespond?.(event.id, InvitationStatus.Declined);
                }}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Decline
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRespond?.(event.id, InvitationStatus.Maybe);
                }}
                className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Maybe
              </button>
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}

export default function EventsPage() {
  const { t } = useLanguage();
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my-events' | 'invited-events'>('my-events');
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [invitedEvents, setInvitedEvents] = useState<Event[]>([]);
  const [friends, setFriends] = useState<UserSearchDTO[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showBirthdayNotification, setShowBirthdayNotification] = useState(true);

  useEffect(() => {
    console.log("Events page useEffect - user:", user);
    console.log("Events page useEffect - authLoading:", authLoading);
    console.log("Events page useEffect - localStorage token:", typeof window !== 'undefined' ? localStorage.getItem('token') : 'N/A');
    console.log("Events page useEffect - localStorage user:", typeof window !== 'undefined' ? localStorage.getItem('user') : 'N/A');
    
    if (user) {
      console.log("User found, loading data...");
      loadData();
    } else if (!authLoading) {
      console.log("No user and auth not loading, stopping loading");
      // If no user and auth is not loading, stop loading
      setIsLoading(false);
      setError("Please log in to view events.");
    }
  }, [user, authLoading]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("Loading timeout reached, stopping loading");
        setIsLoading(false);
        setError("Loading timeout. Please refresh the page.");
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  const loadData = async () => {
    try {
      console.log("Loading events data...");
      setIsLoading(true);
      setError(null);
      
      // Try to load events data, but don't fail completely if some calls fail
      const promises = [
        getMyEvents().catch(err => {
          console.error("Failed to load my events:", err);
          return { events: [] };
        }),
        getInvitedEvents().catch(err => {
          console.error("Failed to load invited events:", err);
          return { events: [] };
        }),
        user ? getFollowing(user.id, 1, 100).catch(err => {
          console.error("Failed to load friends:", err);
          return [];
        }) : Promise.resolve([])
      ];

      const [myEventsData, invitedEventsData, friendsData] = await Promise.all(promises);

      console.log("Events data loaded:", { myEventsData, invitedEventsData, friendsData });

      setMyEvents(myEventsData.events || []);
      setInvitedEvents(invitedEventsData.events || []);
      setFriends(friendsData || []);
    } catch (err) {
      console.error("Error loading events:", err);
      setError("Some data failed to load, but you can still use the events page.");
      // Set empty arrays so the page still works
      setMyEvents([]);
      setInvitedEvents([]);
      setFriends([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (eventData: CreateEventRequest) => {
    try {
      await createEvent(eventData);
      await loadData(); // Reload events
    } catch (err) {
      console.error("Error creating event:", err);
      throw err;
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    try {
      await cancelEvent(eventId);
      await loadData();
    } catch (err) {
      console.error("Error cancelling event:", err);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEvent(eventId);
        await loadData();
      } catch (err) {
        console.error("Error deleting event:", err);
      }
    }
  };

  const handleRespondToEvent = async (eventId: string, status: InvitationStatus) => {
    try {
      // Find the invitation for this event
      const invitation = invitedEvents.find(e => e.id === eventId);
      if (invitation) {
        await respondToInvitation(invitation.id, { status });
        await loadData();
      }
    } catch (err) {
      console.error("Error responding to event:", err);
    }
  };

  // Manual auth check function
  const checkAuthManually = () => {
    console.log("=== Manual Auth Check ===");
    console.log("localStorage token:", localStorage.getItem('token'));
    console.log("localStorage user:", localStorage.getItem('user'));
    console.log("localStorage userId:", localStorage.getItem('userId'));
    console.log("localStorage username:", localStorage.getItem('username'));
    console.log("Auth loading:", authLoading);
    console.log("User object:", user);
    console.log("Is authenticated:", !!user);
    
    // Try to manually check auth
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log("Parsed user:", parsedUser);
        console.log("Token exists and user data is valid");
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    } else {
      console.log("Missing token or user data");
    }
  };

  // Show loading if auth is still loading or if we're loading events data
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {authLoading ? "Loading..." : "Loading events..."}
          </p>
        </div>
      </div>
    );
  }

  // If no user after auth loading is complete, show error instead of redirecting
  if (!user && !authLoading) {
    console.log("No user found, showing error instead of redirecting");
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-8 max-w-md">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-4">
              Authentication Required
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-6">
              You need to be logged in to view events.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Go to Login
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Go to Dashboard
              </button>
              <button
                onClick={checkAuthManually}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Debug Auth State
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentEvents = activeTab === 'my-events' ? myEvents : invitedEvents;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <WisheraLogo size="md" />

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative search-container">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search events, people..."
                />
              </div>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <ThemeToggle />
              
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <NotificationBadge />
                </button>
                {showNotificationDropdown && (
                  <NotificationDropdown onClose={() => setShowNotificationDropdown(false)} />
                )}
              </div>

              {/* Chat */}
              <button
                onClick={() => router.push('/chat')}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
              </button>
              
              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Left Sidebar */}
      <div className="w-64 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700 fixed left-0 top-16 bottom-0 overflow-y-auto">
        <div className="p-6">
          <nav className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center px-4 py-4 text-left rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md"
            >
              <HomeIcon className="h-5 w-5 mr-3" />
              <span className="font-medium">{t('dashboard.home')}</span>
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center px-4 py-4 text-left rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md"
            >
              <UserIcon className="h-5 w-5 mr-3" />
              <span className="font-medium">{t('dashboard.profile')}</span>
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center px-4 py-4 text-left rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md"
            >
              <GiftIcon className="h-5 w-5 mr-3" />
              <span className="font-medium">{t('dashboard.myGifts')}</span>
            </button>
            <button
              onClick={() => router.push('/events')}
              className="w-full flex items-center px-4 py-4 text-left rounded-xl transition-all duration-200 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
            >
              <CalendarIcon className="h-5 w-5 mr-3" />
              <span className="font-medium">Events</span>
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center px-4 py-4 text-left rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md"
            >
              <HeartIcon className="h-5 w-5 mr-3" />
              <span className="font-medium">Liked</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 mr-80 pt-16 min-h-screen">
        <div className="p-6">
          {/* Birthday Banner */}
          {showBirthdayNotification && (
            <BirthdayCountdownBanner onClose={() => setShowBirthdayNotification(false)} />
          )}

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Events</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your events and invitations</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Event
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('my-events')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'my-events'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  My Events ({myEvents.length})
                </button>
                <button
                  onClick={() => setActiveTab('invited-events')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'invited-events'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Invited Events ({invitedEvents.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Debug Info */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Debug Info:</h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>User: {user ? `${user.username} (${user.id})` : 'Not logged in'}</p>
              <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
              <p>Data Loading: {isLoading ? 'Yes' : 'No'}</p>
              <p>My Events: {myEvents.length}</p>
              <p>Invited Events: {invitedEvents.length}</p>
              <p>Friends: {friends.length}</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Events Grid */}
          {currentEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No events found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeTab === 'my-events' 
                  ? "You haven't created any events yet." 
                  : "You haven't been invited to any events yet."
                }
              </p>
              {activeTab === 'my-events' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create your first event
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isOwner={activeTab === 'my-events'}
                  onCancel={handleCancelEvent}
                  onDelete={handleDeleteEvent}
                  onRespond={handleRespondToEvent}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-l border-gray-200 dark:border-gray-700 fixed right-0 top-16 bottom-0 overflow-y-auto">
        <div className="p-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Quick Actions
              </h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Event
              </button>
              <button
                onClick={() => setActiveTab('my-events')}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  activeTab === 'my-events'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                My Events
              </button>
              <button
                onClick={() => setActiveTab('invited-events')}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  activeTab === 'invited-events'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Invited Events
              </button>
            </div>
          </div>

          {/* Event Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <CheckIcon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Event Stats
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">My Events</span>
                <span className="font-semibold text-gray-900 dark:text-white">{myEvents.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Invited Events</span>
                <span className="font-semibold text-gray-900 dark:text-white">{invitedEvents.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Events</span>
                <span className="font-semibold text-gray-900 dark:text-white">{myEvents.length + invitedEvents.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateEvent={handleCreateEvent}
        friends={friends}
      />
    </div>
  );
}
