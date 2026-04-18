package com.tempstaff.service;

import com.tempstaff.dto.request.UpsertJobDescriptionRequest;
import com.tempstaff.dto.response.JobDescriptionResponse;
import com.tempstaff.entity.JobDescription;
import com.tempstaff.entity.NotificationType;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.repository.JobDescriptionRepository;
import com.tempstaff.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JobDescriptionService {

    private final JobDescriptionRepository jobDescriptionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public JobDescriptionResponse upsertForStaff(UUID creatorId, UUID staffId, UpsertJobDescriptionRequest req) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!(creator.getRole() == UserRole.coordinator || creator.getRole() == UserRole.hod)) {
            throw new RuntimeException("Only coordinator/HOD can create job descriptions");
        }

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff user not found"));
        if (staff.getRole() != UserRole.staff) {
            throw new RuntimeException("Only staff users can have job descriptions");
        }

        JobDescription jd = jobDescriptionRepository.findByUser_Id(staffId)
                .orElseGet(() -> JobDescription.builder().user(staff).createdBy(creatorId).build());

        // On update, keep the original creator unless it's missing for legacy rows.
        if (jd.getCreatedBy() == null) {
            jd.setCreatedBy(creatorId);
        }

        jd.setContent(req.getContent());
        jd = jobDescriptionRepository.save(jd);

        // Notify staff member that JD was assigned/updated
        notificationService.notifyUser(
                staff.getId(),
                "Job description assigned",
                "A job description has been assigned/updated. Please check 'My JD'.",
                NotificationType.jd_assigned,
                null,
                null
        );

        return JobDescriptionResponse.builder()
                .userId(staff.getId().toString())
                .content(jd.getContent())
                .createdAt(jd.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public JobDescriptionResponse getMine(UUID staffId) {
        JobDescription jd = jobDescriptionRepository.findByUser_Id(staffId)
                .orElseThrow(() -> new RuntimeException("No job description found"));
        return JobDescriptionResponse.builder()
                .userId(staffId.toString())
                .content(jd.getContent())
                .createdAt(jd.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public JobDescriptionResponse getForStaff(UUID staffId) {
        JobDescription jd = jobDescriptionRepository.findByUser_Id(staffId)
                .orElseThrow(() -> new RuntimeException("No job description found"));
        return JobDescriptionResponse.builder()
                .userId(staffId.toString())
                .content(jd.getContent())
                .createdAt(jd.getCreatedAt())
                .build();
    }
}

