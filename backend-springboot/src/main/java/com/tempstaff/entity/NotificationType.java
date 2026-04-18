package com.tempstaff.entity;

public enum NotificationType {
    research_new,
    research_applied,
    research_accepted,
    research_rejected,
    mentor_assigned,
    module_preferences_requested,
    info,
    // Extended notification types used for HOD/Coordinator notifications & reminders
    registration_request,
    leave_request,
    interview_started,
    interview_ended,
    /** Panel notified when an interview round is created or its date changes */
    interview_scheduled,
    interview_upcoming,
    review_due,
    contract_expiry
}
