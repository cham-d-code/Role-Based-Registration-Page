package com.tempstaff.service;

import com.tempstaff.entity.MarkingScheme;
import com.tempstaff.entity.User;
import com.tempstaff.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * Permanently removes the authenticated user and dependent rows that would otherwise block deletion.
 */
@Service
@RequiredArgsConstructor
public class UserAccountDeletionService {

    private final UserRepository userRepository;
    private final CandidateMarkRepository candidateMarkRepository;
    private final SessionParticipantRepository sessionParticipantRepository;
    private final MarkingSchemeRepository markingSchemeRepository;
    private final UserSubjectRepository userSubjectRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Transactional
    public void deleteUserAccount(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        userRepository.clearMentorIdReferences(user.getId());

        candidateMarkRepository.deleteAllByMarkerId(user.getId());
        sessionParticipantRepository.deleteAllByUserId(user.getId());

        List<MarkingScheme> schemes = markingSchemeRepository.findByCreatedBy_Id(user.getId());
        for (MarkingScheme scheme : schemes) {
            candidateMarkRepository.deleteAllByMarkingSchemeId(scheme.getId());
            markingSchemeRepository.delete(scheme);
        }

        userNotificationRepository.deleteAllByRecipientId(user.getId());
        passwordResetTokenRepository.deleteAllByUserId(user.getId());
        userSubjectRepository.deleteAllByUserId(user.getId());

        userRepository.delete(user);
    }
}
