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
  type Event,
  type EventInvitation,
  type UpdateEventRequest
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
      
      const [eventData, invitationsData] = await Promise.all([
        getEventById(eventId),
        getEventInvitations(eventId)
      ]);

      setEvent(eventData);
      setInvitations(invitationsData);
      setEditForm({
        title: eventData.title,
        description: eventData.description,
        eventDate: eventData.eventDate,
        eventTime: eventData.eventTime,
        location: eventData.location,
        additionalNotes: eventData.additionalNotes,
        eventType: eventData.eventType
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
    
    setIsSubmitting(true);
    try {
      const updatedEvent = await updateEvent(event.id, editForm);
      setEvent(updatedEvent);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating event:", err);
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
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case InvitationStatus.Declined:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case InvitationStatus.Maybe:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
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
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/events')}
                className="mr-4 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <WisheraLogo className="h-8 w-8 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
            </div>
            <div className="flex items-center space-x-2">
              {event.isCancelled && (
                <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-sm rounded-full">
                  Cancelled
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Event Details */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Title
                    </label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Event Date
                      </label>
                      <input
                        type="date"
                        value={editForm.eventDate || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, eventDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Event Time
                      </label>
                      <input
                        type="time"
                        value={editForm.eventTime || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, eventTime: e.target.value }))}
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
                      value={editForm.location || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={editForm.additionalNotes || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateEvent}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{event.title}</h2>
                      <p className="text-gray-600 dark:text-gray-400">by {event.creatorUsername}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      {!event.isCancelled && (
                        <button
                          onClick={handleCancelEvent}
                          className="p-2 text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400"
                        >
                          Cancel Event
                        </button>
                      )}
                      <button
                        onClick={handleDeleteEvent}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">{event.description}</p>
                  )}

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <CalendarIcon className="h-5 w-5 mr-3" />
                      <span className="text-lg">{formatDate(event.eventDate)}</span>
                    </div>
                    {event.eventTime && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <ClockIcon className="h-5 w-5 mr-3" />
                        <span className="text-lg">{formatTime(event.eventTime)}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <MapPinIcon className="h-5 w-5 mr-3" />
                        <span className="text-lg">{event.location}</span>
                      </div>
                    )}
                  </div>

                  {event.additionalNotes && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Additional Notes</h3>
                      <p className="text-gray-700 dark:text-gray-300">{event.additionalNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Event Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Accepted</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{event.acceptedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <XMarkIcon className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Declined</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{event.declinedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Pending</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{event.pendingCount}</span>
                </div>
              </div>
            </motion.div>

            {/* Invitations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invitations</h3>
              <div className="space-y-3">
                {invitations.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No invitations yet</p>
                ) : (
                  invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <img
                          src={invitation.inviterAvatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(invitation.inviterUsername)}`}
                          alt={invitation.inviterUsername}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {invitation.inviterUsername}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invitation.status)}`}>
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
