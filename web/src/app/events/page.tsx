"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { 
  CalendarIcon,
  PlusIcon,
  MapPinIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  HomeIcon,
  UserIcon,
  HeartIcon,
  GiftIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  EllipsisVerticalIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../hooks/useAuth";
import WisheraLogo from "../../components/WisheraLogo";
import ThemeToggle from "../../components/ThemeToggle";
import LanguageSelector from "../../components/LanguageSelector";
import NotificationBadge from "../../components/NotificationBadge";
import NotificationDropdown from "../../components/NotificationDropdown";
import BirthdayCountdownBanner from "../../components/BirthdayCountdownBanner";
import {
  createEvent,
  getMyEvents,
  getInvitedEvents,
  cancelEvent,
  deleteEvent,
  respondToInvitation,
  getMyFriends,
  type UserSearchDTO
} from "../api";
import { 
  type Event,
  type EventInvitation,
  type CreateEventRequest,
  type EventListResponse,
  InvitationStatus
} from "../../types";

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
  const [showResponseMenu, setShowResponseMenu] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Don't close if clicking on the menu button or menu content
      if (!target.closest('.response-menu-container')) {
        setShowResponseMenu(false);
      }
    };
    
    if (showResponseMenu) {
      // Add a small delay to prevent immediate closure
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showResponseMenu]);

  // Smart positioning logic
  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!showResponseMenu) {
      // Calculate if dropdown should appear above or below
      const buttonRect = e.currentTarget.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // More accurate dropdown height calculation (3 buttons + padding)
      const dropdownHeight = 140; // Reduced from 180 for more accurate calculation
      const dropdownWidth = 208; // w-52 = 13rem = 208px
      
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const spaceRight = viewportWidth - buttonRect.right;
      
      // Check if dropdown would fit below
      const fitsBelow = spaceBelow >= dropdownHeight + 20; // 20px buffer
      const fitsAbove = spaceAbove >= dropdownHeight + 20;
      
      // Check if dropdown would fit to the right (for horizontal positioning)
      const fitsRight = spaceRight >= dropdownWidth + 10;
      
      // Determine vertical position
      let position: 'above' | 'below';
      if (fitsBelow && !fitsAbove) {
        position = 'below';
      } else if (fitsAbove && !fitsBelow) {
        position = 'above';
      } else if (fitsBelow && fitsAbove) {
        // If both fit, prefer below unless we're in the lower third of the screen
        const isInLowerThird = buttonRect.top > (viewportHeight * 2) / 3;
        position = isInLowerThird ? 'above' : 'below';
      } else {
        // If neither fits perfectly, choose the one with more space
        position = spaceAbove > spaceBelow ? 'above' : 'below';
      }
      
      // Calculate coordinates for portal positioning
      const x = fitsRight ? buttonRect.right - dropdownWidth : buttonRect.left;
      const y = position === 'above' 
        ? buttonRect.top - dropdownHeight - 8  // 8px gap
        : buttonRect.bottom + 8; // 8px gap
      
      setDropdownCoords({ x, y });
    }
    
    setShowResponseMenu(!showResponseMenu);
  };
  
  // Debug logging for userResponse
  console.log(`EventCard ${event.id} - userResponse:`, event.userResponse, 'isOwner:', isOwner);
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
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white";
      case InvitationStatus.Declined:
        return "bg-gradient-to-r from-red-500 to-pink-500 text-white";
      case InvitationStatus.Maybe:
        return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
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
      className="group glass-card rounded-2xl p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] relative overflow-hidden"
      onClick={() => router.push(`/events/${event.id}`)}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4">
          <div className="flex justify-between items-start gap-3 mb-2">
            <h3 className="text-xl font-bold text-gradient bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex-1">
              {event.title}
            </h3>
            {event.isCancelled && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold rounded-full shadow-lg flex-shrink-0">
                Cancelled
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">by {event.creatorUsername}</p>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-gray-700 dark:text-gray-300 mb-5 leading-relaxed line-clamp-2">{event.description}</p>
        )}

        {/* Event Details */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 backdrop-blur-sm">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
              <CalendarIcon className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium">{formatDate(event.eventDate)}</span>
          </div>
          {event.eventTime && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 backdrop-blur-sm">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                <ClockIcon className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium">{formatTime(event.eventTime)}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 backdrop-blur-sm">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                <MapPinIcon className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium">{event.location}</span>
            </div>
          )}
        </div>

        {/* Additional Notes */}
        {event.additionalNotes && (
          <div className="mb-5 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold text-amber-700 dark:text-amber-300">Notes:</span> {event.additionalNotes}
            </p>
          </div>
        )}

        {/* Response Stats */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex items-center bg-white/60 dark:bg-gray-800/60 rounded-full px-3 py-1.5 backdrop-blur-sm">
              <CheckIcon className="h-4 w-4 mr-1.5 text-green-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{event.acceptedCount}</span>
            </div>
            <div className="flex items-center bg-white/60 dark:bg-gray-800/60 rounded-full px-3 py-1.5 backdrop-blur-sm">
              <XMarkIcon className="h-4 w-4 mr-1.5 text-red-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{event.declinedCount}</span>
            </div>
            <div className="flex items-center bg-white/60 dark:bg-gray-800/60 rounded-full px-3 py-1.5 backdrop-blur-sm">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1.5 text-yellow-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{event.pendingCount}</span>
            </div>
          </div>

          {!isOwner && (
            <div className="flex justify-end">
              <span className={`px-3 py-1.5 text-xs font-semibold rounded-full shadow-lg ${getStatusColor(event.userResponse)}`}> 
                {getStatusText(event.userResponse)}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end">
        {isOwner ? (
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(event);
              }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <PencilIcon className="h-4 w-4" />
              <span>Edit</span>
            </button>
            {!event.isCancelled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel?.(event.id);
                }}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(event.id);
              }}
              className="px-4 py-2 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <TrashIcon className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        ) : (
          !event.isCancelled && (
            <div className="flex flex-col space-y-3">
              {/* Show current response status */}
              <div className={`px-4 py-2 text-sm font-semibold rounded-xl text-center shadow-lg ${getStatusColor(event.userResponse)}`}>
                {getStatusText(event.userResponse)}
              </div>
              
              {/* Show buttons only if no response yet, otherwise show 3-dots menu */}
              {event.userResponse === undefined ? (
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRespond?.(event.id, InvitationStatus.Accepted);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex-1 min-w-0"
                  >
                    Accept
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRespond?.(event.id, InvitationStatus.Declined);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex-1 min-w-0"
                  >
                    Decline
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRespond?.(event.id, InvitationStatus.Maybe);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex-1 min-w-0"
                  >
                    Maybe
                  </button>
                </div>
              ) : (
                <div className="relative response-menu-container">
                  <button
                    onClick={handleMenuToggle}
                    className="flex items-center justify-center w-full px-4 py-2 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </button>
                  
                  {showResponseMenu && typeof window !== 'undefined' && createPortal(
                    <div 
                      className="fixed w-52 glass-card rounded-xl shadow-2xl z-[9999] border border-gray-200/50 dark:border-gray-700/50"
                      style={{
                        left: `${dropdownCoords.x}px`,
                        top: `${dropdownCoords.y}px`,
                      }}
                    >
                      <div className="py-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Accept clicked for event:", event.id);
                            onRespond?.(event.id, InvitationStatus.Accepted);
                            setShowResponseMenu(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-all duration-200 ${
                            event.userResponse === InvitationStatus.Accepted 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Decline clicked for event:", event.id);
                            onRespond?.(event.id, InvitationStatus.Declined);
                            setShowResponseMenu(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-all duration-200 ${
                            event.userResponse === InvitationStatus.Declined 
                              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                        >
                          ✗ Decline
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Maybe clicked for event:", event.id);
                            onRespond?.(event.id, InvitationStatus.Maybe);
                            setShowResponseMenu(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-all duration-200 ${
                            event.userResponse === InvitationStatus.Maybe 
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                          }`}
                        >
                          ? Maybe
                        </button>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              )}
            </div>
          )
        )}
        </div>
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
  const [myInvitations, setMyInvitations] = useState<EventInvitation[]>([]);
  const [friends, setFriends] = useState<UserSearchDTO[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showBirthdayNotification, setShowBirthdayNotification] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      console.log("Loading events data...");
      console.log("User:", user);
      console.log("Auth loading:", authLoading);
      setIsLoading(true);
      setError(null);
      
      // Try to load events data, but don't fail completely if some calls fail
      const promises = [
        getMyEvents().catch(err => {
          console.error("Failed to load my events:", err);
          return { events: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 } as EventListResponse;
        }),
        getInvitedEvents().catch(err => {
          console.error("Failed to load invited events:", err);
          return { events: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 } as EventListResponse;
        }),
         // Try to load friends, but don't fail if it doesn't work
         user ? getMyFriends(1, 100).catch(err => {
          console.error("Failed to load friends:", err);
          console.log("Continuing without friends data");
          return [];
        }) : Promise.resolve([])
      ];

      const [myEventsData, invitedEventsData, friendsData] = await Promise.all(promises);

      console.log("Events data loaded:", { myEventsData, invitedEventsData, friendsData });

      // Type-safe data extraction
      const myEvents = (myEventsData as EventListResponse).events || [];
      const invitedEvents = (invitedEventsData as EventListResponse).events || [];
      const friends = friendsData as UserSearchDTO[] || [];
      
      console.log("Processed events:", { myEvents, invitedEvents });

      setMyEvents(myEvents);
      setInvitedEvents(invitedEvents);
      setFriends(friends);
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
  }, [user, authLoading]);

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
  }, [user, authLoading, loadData]);

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

  const handleCreateEvent = async (eventData: CreateEventRequest) => {
    try {
      await createEvent(eventData);
      await loadData(); // Reload events
    } catch (err) {
      console.error("Error creating event:", err);
      throw err;
    }
  };

  const handleEditEvent = async (event: Event) => {
    try {
      console.log("Edit event clicked:", event.id);
      // Navigate to the event edit page
      router.push(`/events/${event.id}`);
    } catch (err) {
      console.error("Error navigating to edit event:", err);
      setError("Failed to open event editor. Please try again.");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      console.log("Delete event clicked:", eventId);
      if (window.confirm("Are you sure you want to delete this event?")) {
        console.log("User confirmed deletion");
        await deleteEvent(eventId);
        console.log("Event deleted successfully");
        
        // Update local state instead of reloading everything
        setMyEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
        setInvitedEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
        
        console.log("Event removed from local state");
      }
    } catch (err) {
      console.error("Error deleting event:", err);
      setError("Failed to delete event. Please try again.");
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    try {
      console.log("Cancel event clicked:", eventId);
      if (window.confirm("Are you sure you want to cancel this event?")) {
        console.log("User confirmed cancellation");
        await cancelEvent(eventId);
        console.log("Event cancelled successfully");
        
        // Update local state instead of reloading everything
        setMyEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === eventId 
              ? { ...event, isCancelled: true }
              : event
          )
        );
        setInvitedEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === eventId 
              ? { ...event, isCancelled: true }
              : event
          )
        );
        
        console.log("Event cancelled in local state");
      }
    } catch (err) {
      console.error("Error cancelling event:", err);
      setError("Failed to cancel event. Please try again.");
    }
  };

  const handleRespondToEvent = async (eventId: string, status: InvitationStatus) => {
    try {
      console.log("handleRespondToEvent called with:", { eventId, status });
      console.log("myInvitations:", myInvitations);
      
      // Find the invitation for this event
      const invitation = myInvitations.find(i => i.eventId === eventId);
      console.log("Found invitation:", invitation);
      
      if (invitation) {
        console.log("Responding to invitation:", invitation.id, "with status:", status);
        const response = await respondToInvitation(invitation.id, { status });
        console.log("Response sent successfully:", response);
        
        // Update local state instead of reloading everything
        updateEventCardState(eventId, status);
        
        const statusText = status === InvitationStatus.Accepted ? 'accepted' : 
                           status === InvitationStatus.Declined ? 'declined' : 'maybe';
        setSuccessMessage(`Successfully ${statusText} the invitation!`);
        setError(null);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        console.error("No invitation found for event:", eventId);
        console.error("Available invitations:", myInvitations.map(i => ({ id: i.id, eventId: i.eventId })));
        
        // Fallback: Try to find invitation by event ID in invited events
        const invitedEvent = invitedEvents.find(e => e.id === eventId);
        if (invitedEvent && invitedEvent.invitationId) {
          console.log("Found invitation ID in event:", invitedEvent.invitationId);
          const response = await respondToInvitation(invitedEvent.invitationId, { status });
          console.log("Response sent successfully using event invitation ID:", response);
          
          // Update local state instead of reloading everything
          updateEventCardState(eventId, status);
          
          const statusText = status === InvitationStatus.Accepted ? 'accepted' : 
                             status === InvitationStatus.Declined ? 'declined' : 'maybe';
          setSuccessMessage(`Successfully ${statusText} the invitation!`);
          setError(null);
          
          // Clear success message after 3 seconds
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError("Unable to respond to invitation. Please try again.");
        }
      }
    } catch (err) {
      console.error("Error responding to event:", err);
      console.error("Error details:", {
        eventId,
        status,
        myInvitations: myInvitations.map(i => ({ id: i.id, eventId: i.eventId })),
        invitedEvents: invitedEvents.map(e => ({ id: e.id, invitationId: e.invitationId }))
      });
      setError("Failed to respond to invitation. Please try again.");
    }
  };

  // Function to update only the specific event card state without reloading everything
  const updateEventCardState = (eventId: string, newStatus: InvitationStatus) => {
    console.log("Updating event card state for:", eventId, "with status:", newStatus);
    
    // Update invited events
    setInvitedEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === eventId 
          ? { ...event, userResponse: newStatus }
          : event
      )
    );
    
    // Update my invitations
    setMyInvitations(prevInvitations =>
      prevInvitations.map(invitation =>
        invitation.eventId === eventId
          ? { ...invitation, status: newStatus }
          : invitation
      )
    );
    
    console.log("Event card state updated successfully");
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
            {authLoading ? t('common.loading') : t('events.loadingEvents')}
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
                <NotificationBadge 
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                />
                {showNotificationDropdown && (
                  <NotificationDropdown 
                    isOpen={showNotificationDropdown}
                    onClose={() => setShowNotificationDropdown(false)} 
                  />
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
      <div className="ml-0 xl:ml-64 mr-0 xl:mr-80 pt-16 min-h-screen">
        <div className="p-3 sm:p-4 lg:p-6">
          {/* Birthday Banner */}
          {showBirthdayNotification && (
            <BirthdayCountdownBanner onClose={() => setShowBirthdayNotification(false)} />
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('events.title')}</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">{t('events.subtitle')}</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              {t('events.createEvent')}
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6 sm:mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('my-events')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'my-events'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {t('events.myEvents')} ({myEvents.length})
                </button>
                <button
                  onClick={() => setActiveTab('invited-events')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'invited-events'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {t('events.invitedEvents')} ({invitedEvents.length})
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
              <p>My Invitations: {myInvitations.length}</p>
              <p>Friends: {friends.length}</p>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md p-4">
              <p className="text-green-800 dark:text-green-200">{successMessage}</p>
            </div>
          )}

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
                {t('events.noEventsFound')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeTab === 'my-events' 
                  ? t('events.noMyEvents')
                  : t('events.noInvitedEvents')
                }
              </p>
              {activeTab === 'my-events' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {t('events.createFirstEvent')}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {currentEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isOwner={activeTab === 'my-events'}
                  onEdit={handleEditEvent}
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
      <div className="hidden xl:block w-80 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-l border-gray-200 dark:border-gray-700 fixed right-0 top-16 bottom-0 overflow-y-auto">
        <div className="p-4 sm:p-6">
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
                {t('events.myEvents')}
              </button>
              <button
                onClick={() => setActiveTab('invited-events')}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  activeTab === 'invited-events'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('events.invitedEvents')}
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
                <span className="text-gray-600 dark:text-gray-400">{t('events.myEvents')}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{myEvents.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">{t('events.invitedEvents')}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{invitedEvents.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">{t('events.totalEvents')}</span>
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
