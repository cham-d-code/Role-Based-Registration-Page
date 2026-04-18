package com.tempstaff.controller;

import com.tempstaff.entity.ApplicationStatus;
import com.tempstaff.entity.Interview;
import com.tempstaff.entity.InterviewStatus;
import com.tempstaff.entity.ResearchOpportunity;
import com.tempstaff.entity.ResearchStatus;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.entity.UserStatus;
import com.tempstaff.entity.DayOfWeek;
import com.tempstaff.entity.RequestStatus;
import com.tempstaff.entity.TaskStatus;
import com.tempstaff.repository.InterviewRepository;
import com.tempstaff.repository.LeaveRequestRepository;
import com.tempstaff.repository.ResearchApplicationRepository;
import com.tempstaff.repository.ResearchOpportunityRepository;
import com.tempstaff.repository.UserRepository;
import com.tempstaff.repository.WeeklyTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Dashboard statistics endpoints used by the HOD / Coordinator dashboards.
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final UserRepository userRepository;
    private final InterviewRepository interviewRepository;
    private final ResearchOpportunityRepository researchOpportunityRepository;
    private final ResearchApplicationRepository researchApplicationRepository;
    private final WeeklyTaskRepository weeklyTaskRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    /**
     * GET /api/dashboard/hod-stats
     * Returns aggregated counts for the HOD dashboard:
     *  - totalTemporaryStaff
     *  - activeMentorships
     *  - contractsExpiringSoon (within the next 30 days)
     *  - upcomingInterviewRounds
     */
    @GetMapping("/hod-stats")
    @PreAuthorize("hasAnyRole('HOD','COORDINATOR')")
    public ResponseEntity<Map<String, Object>> getHodStats() {
        List<User> approvedStaff = userRepository.findByStatusAndRole(
                UserStatus.approved, UserRole.staff);

        long totalTemporaryStaff = approvedStaff.size();

        long activeMentorships = approvedStaff.stream()
                .filter(u -> u.getMentorId() != null)
                .count();

        LocalDate today = LocalDate.now();
        LocalDate cutoff = today.plusDays(30);
        long contractsExpiringSoon = approvedStaff.stream()
                .map(User::getContractEndDate)
                .filter(d -> d != null && !d.isBefore(today) && !d.isAfter(cutoff))
                .count();

        List<Interview> upcoming = interviewRepository.findByStatus(InterviewStatus.upcoming);
        long upcomingInterviewRounds = upcoming.stream()
                .filter(i -> i.getDate() != null && !i.getDate().isBefore(today))
                .count();

        return ResponseEntity.ok(Map.of(
                "totalTemporaryStaff", totalTemporaryStaff,
                "activeMentorships", activeMentorships,
                "contractsExpiringSoon", contractsExpiringSoon,
                "upcomingInterviewRounds", upcomingInterviewRounds
        ));
    }

    /**
     * GET /api/dashboard/coordinator-stats
     * Cards on the Coordinator dashboard:
     *  - activeTempStaff: approved temporary staff whose contract end date is today or later (or unset)
     *  - pendingRegistrationApproval: pending mentor + staff registrations
     *  - upcomingInterviewRounds: interviews in {@link InterviewStatus#upcoming} with date on or after today
     *  - activeMentorships: approved staff assigned to a mentor
     */
    @GetMapping("/coordinator-stats")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<Map<String, Object>> getCoordinatorStats() {
        LocalDate today = LocalDate.now();

        List<User> approvedStaff = userRepository.findByStatusAndRole(UserStatus.approved, UserRole.staff);
        long activeTempStaff = approvedStaff.stream()
                .filter(u -> u.getContractEndDate() == null || !u.getContractEndDate().isBefore(today))
                .count();

        List<UserRole> approvableRoles = Arrays.asList(UserRole.mentor, UserRole.staff);
        long pendingRegistrationApproval = userRepository
                .findByStatusAndRoleIn(UserStatus.pending, approvableRoles)
                .size();

        long activeMentorships = approvedStaff.stream()
                .filter(u -> u.getMentorId() != null)
                .count();

        List<Interview> upcoming = interviewRepository.findByStatus(InterviewStatus.upcoming);
        long upcomingInterviewRounds = upcoming.stream()
                .filter(i -> i.getDate() != null && !i.getDate().isBefore(today))
                .count();

        return ResponseEntity.ok(Map.of(
                "activeTempStaff", activeTempStaff,
                "pendingRegistrationApproval", pendingRegistrationApproval,
                "upcomingInterviewRounds", upcomingInterviewRounds,
                "activeMentorships", activeMentorships
        ));
    }

    /**
     * GET /api/dashboard/mentor-stats
     * Aggregated counts for the mentor home dashboard.
     */
    @GetMapping("/mentor-stats")
    @PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<Map<String, Object>> getMentorStats(@AuthenticationPrincipal UserDetails userDetails) {
        User me = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        long menteesCount = userRepository.countByStatusAndRoleAndMentorId(
                UserStatus.approved, UserRole.staff, me.getId());

        List<ResearchOpportunity> mine = researchOpportunityRepository.findByCreatedByOrderByCreatedAtDesc(me.getId());
        long activeResearchPosts = mine.stream()
                .filter(o -> o.getStatus() == ResearchStatus.open)
                .count();

        long pendingResearchApplicants = 0L;
        for (ResearchOpportunity o : mine) {
            pendingResearchApplicants += researchApplicationRepository.countByOpportunityIdAndStatus(
                    o.getId(), ApplicationStatus.applied);
        }

        LocalDate today = LocalDate.now();
        List<Interview> upcoming = interviewRepository.findByStatus(InterviewStatus.upcoming);
        long upcomingInterviewRounds = upcoming.stream()
                .filter(i -> i.getDate() != null && !i.getDate().isBefore(today))
                .count();

        return ResponseEntity.ok(Map.of(
                "menteesCount", menteesCount,
                "activeResearchPosts", activeResearchPosts,
                "pendingResearchApplicants", pendingResearchApplicants,
                "upcomingInterviewRounds", upcomingInterviewRounds
        ));
    }

    /**
     * GET /api/dashboard/staff-stats
     * Stats for the Temporary Staff dashboard:
     *  - tasksAvailableToday
     *  - leaveDaysRemaining
     *  - daysToContractEnd
     */
    @GetMapping("/staff-stats")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Map<String, Object>> getStaffStats(@AuthenticationPrincipal UserDetails userDetails) {
        User me = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate today = LocalDate.now();

        // WeeklyTask.DayOfWeek is title-cased (Monday...), so map from java.time.DayOfWeek
        DayOfWeek dow = DayOfWeek.valueOf(
                today.getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH)
        );
        long tasksAvailableToday = weeklyTaskRepository.countByUserIdAndDayOfWeekAndStatusNot(
                me.getId(), dow, TaskStatus.completed);

        // Leave balance: 2 leaves per month (single-day leave requests in current implementation).
        final int MONTHLY_LEAVE_ENTITLEMENT_DAYS = 2;
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());
        long approvedLeaveDaysThisMonth = leaveRequestRepository.countByUser_IdAndStatusAndStartDateBetween(
                me.getId(), RequestStatus.approved, monthStart, monthEnd);
        long leaveDaysRemaining = Math.max(0L, MONTHLY_LEAVE_ENTITLEMENT_DAYS - approvedLeaveDaysThisMonth);

        Long daysToContractEnd = null;
        if (me.getContractEndDate() != null) {
            daysToContractEnd = java.time.temporal.ChronoUnit.DAYS.between(today, me.getContractEndDate());
        }

        // NOTE: Map.of(...) rejects null values; daysToContractEnd can be null.
        Map<String, Object> out = new HashMap<>();
        out.put("tasksAvailableToday", tasksAvailableToday);
        out.put("leaveDaysRemaining", leaveDaysRemaining);
        out.put("daysToContractEnd", daysToContractEnd);
        return ResponseEntity.ok(out);
    }
}
