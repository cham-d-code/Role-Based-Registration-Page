package com.tempstaff.controller;

import com.tempstaff.entity.Interview;
import com.tempstaff.entity.InterviewStatus;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.entity.UserStatus;
import com.tempstaff.repository.InterviewRepository;
import com.tempstaff.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
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
}
