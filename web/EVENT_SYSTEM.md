# Event Management System

This document describes the event management system implemented in the Wishera application.

## Overview

The event management system allows users to create, manage, and respond to events. It includes both backend API endpoints and frontend React components.

## Backend Implementation

### Controllers

#### EventController (`/api/events`)
- `POST /api/events` - Create a new event
- `GET /api/events/{id}` - Get event details by ID
- `GET /api/events/my-events` - Get events created by current user
- `GET /api/events/invited-events` - Get events user is invited to
- `PUT /api/events/{id}` - Update event details
- `PUT /api/events/{id}/cancel` - Cancel an event
- `DELETE /api/events/{id}` - Delete an event
- `GET /api/events/{id}/invitations` - Get invitations for an event

#### EventInvitationController (`/api/eventinvitations`)
- `GET /api/eventinvitations` - Get user's invitations
- `GET /api/eventinvitations/pending` - Get pending invitations
- `PUT /api/eventinvitations/{id}/respond` - Respond to an invitation

### Models

#### Event
- `Id` - Unique identifier
- `Title` - Event title
- `Description` - Event description
- `EventDate` - Date of the event
- `EventTime` - Time of the event (optional)
- `Location` - Event location
- `AdditionalNotes` - Additional information
- `CreatorId` - ID of the user who created the event
- `InviteeIds` - List of invited user IDs
- `CreatedAt` - Creation timestamp
- `UpdatedAt` - Last update timestamp
- `IsCancelled` - Whether the event is cancelled
- `EventType` - Type of event (General, Birthday, Party, etc.)

#### EventInvitation
- `Id` - Unique identifier
- `EventId` - ID of the related event
- `InviteeId` - ID of the invited user
- `InviterId` - ID of the user who sent the invitation
- `Status` - Invitation status (Pending, Accepted, Declined, Maybe)
- `InvitedAt` - When the invitation was sent
- `RespondedAt` - When the user responded (optional)
- `ResponseMessage` - Optional response message

### Services

#### EventService
- `CreateEventAsync()` - Create a new event
- `GetEventByIdAsync()` - Get event by ID
- `GetMyEventsAsync()` - Get events created by user
- `GetInvitedEventsAsync()` - Get events user is invited to
- `UpdateEventAsync()` - Update event details
- `CancelEventAsync()` - Cancel an event
- `DeleteEventAsync()` - Delete an event
- `GetEventInvitationsAsync()` - Get invitations for an event

#### EventInvitationService
- `GetMyInvitationsAsync()` - Get user's invitations
- `GetPendingInvitationsAsync()` - Get pending invitations
- `RespondToInvitationAsync()` - Respond to an invitation

## Frontend Implementation

### Pages

#### Events Page (`/events`)
- Lists all events (created by user and invited to)
- Tab navigation between "My Events" and "Invited Events"
- Create new event modal
- Event cards with basic information
- Quick action buttons (Accept/Decline/Maybe for invitations)

#### Event Detail Page (`/events/[id]`)
- Detailed view of a single event
- Edit event functionality
- Event statistics (accepted/declined/pending counts)
- List of invitations
- Cancel/Delete event options

### Components

#### EventCard
- Displays event information in a card format
- Shows event title, creator, date, time, location
- Displays response statistics
- Action buttons based on user role (owner vs invitee)

#### CreateEventModal
- Modal form for creating new events
- Form fields for all event properties
- Friend selection for invitations
- Form validation and submission

### API Integration

The frontend uses the following API functions:

```typescript
// Event management
createEvent(eventData: CreateEventRequest): Promise<Event>
getEventById(id: string): Promise<Event>
getMyEvents(page?: number, pageSize?: number): Promise<EventListResponse>
getInvitedEvents(page?: number, pageSize?: number): Promise<EventListResponse>
updateEvent(id: string, eventData: UpdateEventRequest): Promise<Event>
cancelEvent(id: string): Promise<{message: string, success: boolean}>
deleteEvent(id: string): Promise<{message: string, success: boolean}>

// Invitation management
getMyInvitations(page?: number, pageSize?: number): Promise<EventInvitationListResponse>
getPendingInvitations(page?: number, pageSize?: number): Promise<EventInvitationListResponse>
respondToInvitation(invitationId: string, response: RespondToInvitationRequest): Promise<EventInvitation>
```

## Features

### Event Creation
- Users can create events with title, description, date, time, location
- Optional additional notes and event type selection
- Invite friends by selecting from their friend list
- Events are automatically associated with the creator

### Event Management
- Event creators can edit event details
- Events can be cancelled (soft delete) or permanently deleted
- Event statistics show response counts
- Real-time updates when users respond to invitations

### Invitation System
- Users receive invitations for events they're invited to
- Three response options: Accept, Decline, Maybe
- Optional response messages
- Invitation status tracking

### User Interface
- Responsive design for mobile and desktop
- Dark/light theme support
- Smooth animations and transitions
- Intuitive navigation and user experience

## Usage

1. **Creating Events**: Navigate to the Events page and click "Create Event"
2. **Viewing Events**: Click on any event card to view details
3. **Responding to Invitations**: Use the Accept/Decline/Maybe buttons on invitation cards
4. **Managing Events**: Use the edit, cancel, or delete buttons on events you created

## Technical Notes

- Events are stored in MongoDB with proper indexing
- JWT authentication is required for all event operations
- User permissions are enforced (only creators can edit/delete their events)
- Pagination is supported for large event lists
- Error handling and validation are implemented throughout
- The system integrates with the existing user and notification systems
