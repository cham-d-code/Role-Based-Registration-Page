package com.tempstaff.entity;

public enum NotificationType {
    research_new,
    research_applied,
    research_accepted,
    research_rejected,
    mentor_assigned,
    module_preferences_requested,
    /** Staff submitted module preferences (HOD/Coordinator inbox). */
    module_preferences_received,
    /** Daily reminder until JD is created after module preferences were submitted. */
    jd_pending,
    jd_assigned,
    leave_approved,
    leave_rejected,
    info,
    // Extended notification types used for HOD/Coordinator notifications & reminders
    registration_request,
    leave_request,
    interview_started,
    interview_ended,
    /** Coordinator released averaged interview marks for HOD review. */
    interview_report_for_hod,
    /** Panel notified when an interview round is created or its date changes */
    interview_scheduled,
    interview_upcoming,
    review_due,
    contract_expiry
}
