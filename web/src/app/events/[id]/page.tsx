"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { useLanguage } from "../../../contexts/LanguageContext";
import WisheraLogo from "../../../components/WisheraLogo";
import {
  getEventById,
  updateEvent,
  cancelEvent,
  deleteEvent,
  respondToInvitation,
  getEventInvitations,
  getMyFriends,
  type Event,
  type EventInvitation,
  type UpdateEventRequest,
  type UserSearchDTO
} from "../../api";
import { InvitationStatus } from "../../../types";

interface EventDetailPageProps {}

export default function EventDetailPage({}: EventDetailPageProps) {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [invitations, setInvitations] = useState<EventInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateEventRequest>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [friends, setFriends] = useState<UserSearchDTO[]>([]);
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);

  const eventId = params?.id as string;

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [eventData, invitationsData, friendsData] = await Promise.all([
        getEventById(eventId),
        getEventInvitations(eventId),
        getMyFriends(1, 100).catch(() => []) // Load friends, fallback to empty array if fails
      ]);

      setEvent(eventData);
      setInvitations(invitationsData);
      setFriends(friendsData);
      setSelectedInvitees(eventData.inviteeIds || []);
      setEditForm({
        title: eventData.title,
        description: eventData.description,
        eventDate: eventData.eventDate ? new Date(eventData.eventDate).toISOString().split('T')[0] : '',
        eventTime: eventData.eventTime ? eventData.eventTime.substring(0, 5) : '', // Convert "HH:mm:ss" to "HH:mm"
        location: eventData.location,
        additionalNotes: eventData.additionalNotes,
        eventType: eventData.eventType,
        inviteeIds: eventData.inviteeIds || []
      });
    } catch (err) {
      console.error("Error loading event:", err);
      setError("Failed to load event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!event) return;
    
    // Validate required fields
    if (!editForm.title || editForm.title.trim() === '') {
      setError("Event title is required");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Filter out empty/undefined values to avoid validation errors
      const filteredForm: UpdateEventRequest = {};
      
      if (editForm.title && editForm.title.trim() !== '') {
        filteredForm.title = editForm.title.trim();
      }
      if (editForm.description && editForm.description.trim() !== '') {
        filteredForm.description = editForm.description.trim();
      }
      if (editForm.eventDate) {
        // Convert "YYYY-MM-DD" to ISO string format
        filteredForm.eventDate = new Date(editForm.eventDate).toISOString();
      }
      if (editForm.eventTime) {
        // Convert "HH:mm" to "HH:mm:ss" format for TimeSpan
        filteredForm.eventTime = `${editForm.eventTime}:00`;
      }
      if (editForm.location && editForm.location.trim() !== '') {
        filteredForm.location = editForm.location.trim();
      }
      if (editForm.additionalNotes && editForm.additionalNotes.trim() !== '') {
        filteredForm.additionalNotes = editForm.additionalNotes.trim();
      }
      if (editForm.eventType && editForm.eventType.trim() !== '') {
        filteredForm.eventType = editForm.eventType.trim();
      }
      if (selectedInvitees.length > 0) {
        filteredForm.inviteeIds = selectedInvitees;
      }
      
      console.log("Sending update request:", filteredForm);
      const updatedEvent = await updateEvent(event.id, filteredForm);
      setEvent(updatedEvent);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error("Error updating event:", err);
      setError("Failed to update event. Please check your input and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!event) return;
    
    if (window.confirm("Are you sure you want to cancel this event?")) {
      try {
        await cancelEvent(event.id);
        await loadEvent();
      } catch (err) {
        console.error("Error cancelling event:", err);
      }
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    
    if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      try {
        await deleteEvent(event.id);
        router.push('/events');
      } catch (err) {
        console.error("Error deleting event:", err);
      }
    }
  };

  const handleRespondToInvitation = async (invitationId: string, status: InvitationStatus) => {
    try {
      await respondToInvitation(invitationId, { status });
      await loadEvent();
    } catch (err) {
      console.error("Error responding to invitation:", err);
    }
  };

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

  const getStatusColor = (status: InvitationStatus) => {
    switch (status) {
      case InvitationStatus.Accepted:
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white";
      case InvitationStatus.Declined:
        return "bg-gradient-to-r from-red-500 to-pink-500 text-white";
      case InvitationStatus.Maybe:
        return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const getStatusText = (status: InvitationStatus) => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || "The event you're looking for doesn't exist."}</p>
          <button
            onClick={() => router.push('/events')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/events')}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <WisheraLogo size="md" />
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
                <h1 className="text-2xl font-bold text-gradient bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {event.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {event.isCancelled && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-semibold rounded-full shadow-lg">
                  Cancelled
                </span>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>
                {!event.isCancelled && (
                  <button
                    onClick={handleCancelEvent}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    Cancel Event
                  </button>
                )}
                <button
                  onClick={handleDeleteEvent}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Event Details */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-8 relative overflow-hidden"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
              {isEditing ? (
                <div className="space-y-6">
                  {error && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-4">
                      <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white transition-all duration-200"
                      placeholder="Enter event title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Description
                    </label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white transition-all duration-200"
                      rows={4}
                      placeholder="Describe your event"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Event Date
                      </label>
                      <input
                        type="date"
                        value={editForm.eventDate || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, eventDate: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Event Time
                      </label>
                      <input
                        type="time"
                        value={editForm.eventTime || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, eventTime: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editForm.location || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white transition-all duration-200"
                      placeholder="Where will the event take place?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Additional Notes
                    </label>
                    <textarea
                      value={editForm.additionalNotes || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white transition-all duration-200"
                      rows={3}
                      placeholder="Dress code, special instructions, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Invite Friends
                    </label>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {friends.map((friend) => (
                        <label key={friend.id} className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedInvitees.includes(friend.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedInvitees(prev => [...prev, friend.id]);
                              } else {
                                setSelectedInvitees(prev => prev.filter(id => id !== friend.id));
                              }
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <div className="flex items-center space-x-3">
                            {friend.avatarUrl ? (
                              <img src={friend.avatarUrl} alt={friend.username} className="h-8 w-8 rounded-full" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                                <UserGroupIcon className="h-4 w-4 text-white" />
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{friend.username}</span>
                          </div>
                        </label>
                      ))}
                      {friends.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No friends available to invite.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateEvent}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-8">
                    <h2 className="text-4xl font-bold text-gradient bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                      {event.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">by {event.creatorUsername}</p>
                  </div>

                  {event.description && (
                    <div className="mb-8">
                      <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">{event.description}</p>
                    </div>
                  )}

                  <div className="space-y-6 mb-8">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-4">
                        <CalendarIcon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-lg font-medium">{formatDate(event.eventDate)}</span>
                    </div>
                    {event.eventTime && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-4">
                          <ClockIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-medium">{formatTime(event.eventTime)}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-4">
                          <MapPinIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-medium">{event.location}</span>
                      </div>
                    )}
                  </div>

                  {event.additionalNotes && (
                    <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                      <h3 className="font-semibold text-amber-700 dark:text-amber-300 mb-3 text-lg">Additional Notes</h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{event.additionalNotes}</p>
                    </div>
                  )}
                </div>
              )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Event Stats</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Accepted</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">{event.acceptedCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center">
                    <XMarkIcon className="h-5 w-5 text-red-500 mr-3" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Declined</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">{event.declinedCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-3" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Pending</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">{event.pendingCount}</span>
                </div>
              </div>
            </motion.div>

            {/* Invitations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Invitations</h3>
              </div>
              <div className="space-y-3">
                {invitations.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No invitations yet</p>
                ) : (
                  invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center">
                        <img
                          src={invitation.inviterAvatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(invitation.inviterUsername)}`}
                          alt={invitation.inviterUsername}
                          className="w-10 h-10 rounded-full mr-3 border-2 border-white/20"
                        />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {invitation.inviterUsername}
                        </span>
                      </div>
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full shadow-lg ${getStatusColor(invitation.status)}`}>
                        {getStatusText(invitation.status)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
