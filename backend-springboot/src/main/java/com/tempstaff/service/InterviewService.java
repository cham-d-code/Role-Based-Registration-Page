package com.tempstaff.service;

import com.tempstaff.dto.response.CandidateResponse;
import com.tempstaff.dto.response.InterviewResponse;
import com.tempstaff.entity.Candidate;
import com.tempstaff.entity.Interview;
import com.tempstaff.entity.InterviewStatus;
import com.tempstaff.repository.CandidateRepository;
import com.tempstaff.repository.InterviewRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final CandidateRepository candidateRepository;

    /**
     * Get all interviews ordered newest-first, with candidate counts.
     */
    public List<InterviewResponse> getAllInterviews() {
        return interviewRepository.findAllByOrderByDateDesc().stream()
                .map(interview -> InterviewResponse.builder()
                        .id(interview.getId().toString())
                        .interviewNumber(interview.getInterviewNumber())
                        .date(interview.getDate())
                        .status(interview.getStatus().name())
                        .candidateCount((int) candidateRepository.countByInterviewId(interview.getId()))
                        .createdAt(interview.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Get all candidates for a specific interview.
     */
    public List<CandidateResponse> getCandidatesForInterview(UUID interviewId) {
        return candidateRepository.findByInterviewId(interviewId).stream()
                .map(c -> CandidateResponse.builder()
                        .id(c.getId().toString())
                        .candidateId(c.getCandidateId())
                        .name(c.getName())
                        .email(c.getEmail())
                        .phone(c.getPhone())
                        .cvUrl(c.getCvUrl())
                        .marksPart1(c.getMarksPart1())
                        .marksPart2(c.getMarksPart2())
                        .marksPart3(c.getMarksPart3())
                        .totalMarks(c.getTotalMarks())
                        .shortlisted(c.getShortlisted())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Create a new interview and import candidates from Excel file.
     * Expected Excel columns (row 1 = header):
     *   0: Candidate ID  1: Name  2: Email  3: Phone  4: CV
     */
    @Transactional
    public InterviewResponse createInterviewWithCandidates(
            String interviewNumber,
            LocalDate date,
            MultipartFile excelFile) throws IOException {

        // 1. Save the Interview first
        Interview interview = Interview.builder()
                .interviewNumber(interviewNumber)
                .date(date)
                .status(InterviewStatus.upcoming)
                .build();
        interview = interviewRepository.save(interview);

        // 2. Parse Excel and save candidates
        List<Candidate> candidates = parseExcelFile(excelFile, interview);
        candidateRepository.saveAll(candidates);

        return InterviewResponse.builder()
                .id(interview.getId().toString())
                .interviewNumber(interview.getInterviewNumber())
                .date(interview.getDate())
                .status(interview.getStatus().name())
                .candidateCount(candidates.size())
                .createdAt(interview.getCreatedAt())
                .build();
    }

    /**
     * Update the date of an existing interview.
     */
    @Transactional
    public InterviewResponse updateInterviewDate(UUID interviewId, LocalDate newDate) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found: " + interviewId));
        interview.setDate(newDate);
        interview = interviewRepository.save(interview);

        return InterviewResponse.builder()
                .id(interview.getId().toString())
                .interviewNumber(interview.getInterviewNumber())
                .date(interview.getDate())
                .status(interview.getStatus().name())
                .candidateCount((int) candidateRepository.countByInterviewId(interview.getId()))
                .createdAt(interview.getCreatedAt())
                .build();
    }

    // ──────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────

    private List<Candidate> parseExcelFile(MultipartFile file, Interview interview) throws IOException {
        List<Candidate> candidates = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // Row 0 = header — find column indices by name (case-insensitive, trimmed)
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) throw new IllegalArgumentException("Excel file has no header row");

            int idxCandidateId = -1, idxName = -1, idxEmail = -1, idxPhone = -1, idxCv = -1;
            for (int c = 0; c < headerRow.getLastCellNum(); c++) {
                Cell cell = headerRow.getCell(c);
                if (cell == null) continue;
                String header = cell.getStringCellValue().trim().toLowerCase();
                switch (header) {
                    case "candidate id", "candidate_id", "candidateid" -> idxCandidateId = c;
                    case "name"                                          -> idxName        = c;
                    case "email"                                         -> idxEmail       = c;
                    case "phone", "phone number", "mobile"               -> idxPhone       = c;
                    case "cv", "cv url", "cv_url", "cvurl"               -> idxCv          = c;
                }
            }

            if (idxName == -1)  throw new IllegalArgumentException("Missing required column: Name");
            if (idxEmail == -1) throw new IllegalArgumentException("Missing required column: Email");
            if (idxPhone == -1) throw new IllegalArgumentException("Missing required column: Phone");

            // Start from row 1
            for (int rowIdx = 1; rowIdx <= sheet.getLastRowNum(); rowIdx++) {
                Row row = sheet.getRow(rowIdx);
                if (row == null) continue;

                String candidateId = idxCandidateId >= 0 ? getCellValue(row, idxCandidateId) : null;
                String name        = getCellValue(row, idxName);
                String email       = getCellValue(row, idxEmail);
                String phone       = getCellValue(row, idxPhone);
                String cvUrl       = idxCv >= 0 ? getCellValue(row, idxCv) : null;

                // Skip completely empty rows
                if (name == null || name.isBlank()) continue;

                Candidate candidate = Candidate.builder()
                        .candidateId(candidateId)
                        .name(name)
                        .email(email != null ? email : "")
                        .phone(phone != null ? phone : "")
                        .cvUrl(cvUrl)
                        .shortlisted(false)
                        .interview(interview)
                        .build();
                candidates.add(candidate);
            }
        }
        return candidates;
    }

    private String getCellValue(Row row, int colIndex) {
        Cell cell = row.getCell(colIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;

        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                // Return without ".0" for whole numbers
                if (val == Math.floor(val)) yield String.valueOf((long) val);
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default      -> null;
        };
    }
}
