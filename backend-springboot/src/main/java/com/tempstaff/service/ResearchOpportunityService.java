package com.tempstaff.service;

import com.tempstaff.dto.request.CreateResearchOpportunityRequest;
import com.tempstaff.dto.request.UpdateResearchOpportunityRequest;
import com.tempstaff.dto.response.ResearchApplicantResponse;
import com.tempstaff.dto.response.ResearchApplicationResponse;
import com.tempstaff.dto.response.ResearchOpportunityResponse;
import com.tempstaff.entity.*;
import com.tempstaff.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResearchOpportunityService {

    private final ResearchOpportunityRepository researchOpportunityRepository;
    private final ResearchApplicationRepository researchApplicationRepository;
    private final UserRepository userRepository;
    private final UserSubjectRepository userSubjectRepository;
    private final ModuleRepository moduleRepository;
    private final NotificationService notificationService;
    private final UserNotificationRepository userNotificationRepository;

    @Transactional
    public ResearchOpportunityResponse createOpportunity(UUID creatorId, CreateResearchOpportunityRequest request) {
        ResearchOpportunity opportunity = ResearchOpportunity.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .createdBy(creatorId)
                .deadline(request.getDeadline())
                .maxApplicants(request.getMaxApplicants())
                .status(request.getStatus() != null ? request.getStatus() : ResearchStatus.open)
                .build();

        ResearchOpportunity saved = researchOpportunityRepository.save(opportunity);

        // Notify all approved staff about the new opportunity
        List<User> staffUsers = userRepository.findByStatusAndRoleIn(UserStatus.approved, List.of(UserRole.staff));
        User creator = userRepository.findById(creatorId).orElse(null);
        String creatorName = creator != null ? creator.getFullName() : "Senior Staff";
        for (User staff : staffUsers) {
            notificationService.notifyUser(
                    staff.getId(),
                    "New research opportunity",
                    creatorName + " posted: " + saved.getTitle(),
                    NotificationType.research_new,
                    saved.getId(),
                    null
            );
        }

        return toOpportunityResponse(saved);
    }

    public List<ResearchOpportunityResponse> listMyOpportunities(UUID creatorId) {
        return researchOpportunityRepository.findByCreatedByOrderByCreatedAtDesc(creatorId).stream()
                .map(this::toOpportunityResponse)
                .collect(Collectors.toList());
    }

    public List<ResearchOpportunityResponse> listOpenOpportunitiesForStaff() {
        return researchOpportunityRepository.findByStatusOrderByCreatedAtDesc(ResearchStatus.open).stream()
                .map(this::toOpportunityResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ResearchOpportunityResponse updateOpportunity(UUID editorId, UUID opportunityId, UpdateResearchOpportunityRequest request) {
        ResearchOpportunity opp = researchOpportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));

        if (!opp.getCreatedBy().equals(editorId)) {
            throw new RuntimeException("You can only edit your own opportunity");
        }

        if (request.getTitle() != null) opp.setTitle(request.getTitle());
        if (request.getDescription() != null) opp.setDescription(request.getDescription());
        if (request.getDeadline() != null) opp.setDeadline(request.getDeadline());
        if (request.getMaxApplicants() != null) opp.setMaxApplicants(request.getMaxApplicants());
        if (request.getStatus() != null) opp.setStatus(request.getStatus());

        return toOpportunityResponse(researchOpportunityRepository.save(opp));
    }

    @Transactional
    public void deleteOpportunity(UUID deleterId, UUID opportunityId) {
        ResearchOpportunity opp = researchOpportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));
        if (!opp.getCreatedBy().equals(deleterId)) {
            throw new RuntimeException("You can only delete your own opportunity");
        }
        researchOpportunityRepository.delete(opp);
    }

    @Transactional
    public ResearchApplicationResponse apply(UUID staffUserId, UUID opportunityId) {
        ResearchOpportunity opp = researchOpportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));

        if (opp.getStatus() != ResearchStatus.open) {
            throw new RuntimeException("Opportunity is not open");
        }

        if (researchApplicationRepository.existsByOpportunityIdAndUserId(opportunityId, staffUserId)) {
            throw new RuntimeException("You already applied to this opportunity");
        }

        if (opp.getMaxApplicants() != null) {
            long current = researchApplicationRepository.findByOpportunityIdOrderByAppliedAtDesc(opportunityId).size();
            if (current >= opp.getMaxApplicants()) {
                throw new RuntimeException("Maximum applicants reached");
            }
        }

        ResearchApplication application = ResearchApplication.builder()
                .opportunityId(opportunityId)
                .userId(staffUserId)
                .status(ApplicationStatus.applied)
                .build();
        ResearchApplication saved = researchApplicationRepository.save(application);

        User staff = userRepository.findById(staffUserId).orElse(null);
        String staffName = staff != null ? staff.getFullName() : "A temp staff member";
        notificationService.notifyUser(
                opp.getCreatedBy(),
                "New application received",
                staffName + " applied for: " + opp.getTitle(),
                NotificationType.research_applied,
                opportunityId,
                saved.getId()
        );

        return ResearchApplicationResponse.builder()
                .id(saved.getId())
                .opportunityId(saved.getOpportunityId())
                .status(saved.getStatus())
                .appliedAt(saved.getAppliedAt())
                .build();
    }

    public List<ResearchApplicationResponse> listMyApplications(UUID staffUserId) {
        return researchApplicationRepository.findByUserIdOrderByAppliedAtDesc(staffUserId).stream()
                .map(a -> ResearchApplicationResponse.builder()
                        .id(a.getId())
                        .opportunityId(a.getOpportunityId())
                        .status(a.getStatus())
                        .appliedAt(a.getAppliedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public List<ResearchApplicantResponse> listApplicants(UUID ownerId, UUID opportunityId) {
        ResearchOpportunity opp = researchOpportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));
        if (!opp.getCreatedBy().equals(ownerId)) {
            throw new RuntimeException("You can only view applicants for your own opportunity");
        }

        return researchApplicationRepository.findByOpportunityIdOrderByAppliedAtDesc(opportunityId).stream()
                .map(app -> {
                    User applicant = userRepository.findById(app.getUserId())
                            .orElseThrow(() -> new RuntimeException("Applicant not found"));

                    List<String> specializations = userSubjectRepository
                            .findByUserIdAndIsPreferred(applicant.getId(), true)
                            .stream()
                            .map(UserSubject::getModuleId)
                            .map(moduleId -> moduleRepository.findById(moduleId)
                                    .map(com.tempstaff.entity.Module::getName)
                                    .orElse(null))
                            .filter(name -> name != null && !name.isBlank())
                            .collect(Collectors.toList());

                    return ResearchApplicantResponse.builder()
                            .applicationId(app.getId())
                            .userId(applicant.getId())
                            .fullName(applicant.getFullName())
                            .email(applicant.getEmail())
                            .specializations(specializations)
                            .status(app.getStatus())
                            .appliedAt(app.getAppliedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public ResearchApplicantResponse acceptApplicant(UUID ownerId, UUID applicationId) {
        ResearchApplication app = researchApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        ResearchOpportunity opp = researchOpportunityRepository.findById(app.getOpportunityId())
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));
        if (!opp.getCreatedBy().equals(ownerId)) {
            throw new RuntimeException("You can only decide on applications for your own opportunity");
        }

        app.setStatus(ApplicationStatus.accepted);
        researchApplicationRepository.save(app);

        // Clear the "new application" badge for this opportunity on the owner's inbox.
        // Once at least one applicant is accepted for a research opportunity, we mark all
        // research_applied notifications for that opportunity as read, so the red count drops.
        List<UserNotification> appliedNotifs = userNotificationRepository
                .findByRecipientIdAndTypeAndRelatedOpportunityId(
                        ownerId, NotificationType.research_applied, opp.getId());
        for (UserNotification n : appliedNotifs) {
            if (Boolean.FALSE.equals(n.getIsRead())) {
                n.setIsRead(true);
            }
        }
        if (!appliedNotifs.isEmpty()) {
            userNotificationRepository.saveAll(appliedNotifs);
        }

        notificationService.notifyUser(
                app.getUserId(),
                "Application accepted",
                "You were accepted for: " + opp.getTitle(),
                NotificationType.research_accepted,
                opp.getId(),
                app.getId()
        );

        return listApplicants(ownerId, opp.getId()).stream()
                .filter(a -> a.getApplicationId().equals(applicationId))
                .findFirst()
                .orElseThrow();
    }

    @Transactional
    public ResearchApplicantResponse rejectApplicant(UUID ownerId, UUID applicationId) {
        ResearchApplication app = researchApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        ResearchOpportunity opp = researchOpportunityRepository.findById(app.getOpportunityId())
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));
        if (!opp.getCreatedBy().equals(ownerId)) {
            throw new RuntimeException("You can only decide on applications for your own opportunity");
        }

        app.setStatus(ApplicationStatus.rejected);
        researchApplicationRepository.save(app);

        notificationService.notifyUser(
                app.getUserId(),
                "Application rejected",
                "Your application was rejected for: " + opp.getTitle(),
                NotificationType.research_rejected,
                opp.getId(),
                app.getId()
        );

        return listApplicants(ownerId, opp.getId()).stream()
                .filter(a -> a.getApplicationId().equals(applicationId))
                .findFirst()
                .orElseThrow();
    }

    private ResearchOpportunityResponse toOpportunityResponse(ResearchOpportunity opp) {
        User creator = userRepository.findById(opp.getCreatedBy()).orElse(null);
        long applicants = researchApplicationRepository.findByOpportunityIdOrderByAppliedAtDesc(opp.getId()).size();
        return ResearchOpportunityResponse.builder()
                .id(opp.getId())
                .title(opp.getTitle())
                .description(opp.getDescription())
                .status(opp.getStatus())
                .deadline(opp.getDeadline())
                .maxApplicants(opp.getMaxApplicants())
                .createdBy(opp.getCreatedBy())
                .createdByName(creator != null ? creator.getFullName() : null)
                .createdAt(opp.getCreatedAt())
                .applicantsCount(applicants)
                .build();
    }
}

