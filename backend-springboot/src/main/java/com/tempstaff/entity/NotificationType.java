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
    interview_upcoming,
    review_due,
    contract_expiry
}
