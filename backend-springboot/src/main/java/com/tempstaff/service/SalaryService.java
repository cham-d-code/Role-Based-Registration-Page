package com.tempstaff.service;

import com.tempstaff.dto.request.UpsertSalaryTemplateRequest;
import com.tempstaff.dto.response.SalaryReportResponse;
import com.tempstaff.dto.response.SalaryTemplateResponse;
import com.tempstaff.entity.*;
import com.tempstaff.repository.AttendanceRepository;
import com.tempstaff.repository.SalaryReportRepository;
import com.tempstaff.repository.SalaryTemplateRepository;
import com.tempstaff.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SalaryService {

    private static final BigDecimal FREE_LEAVES = new BigDecimal("2.00");

    private final SalaryTemplateRepository salaryTemplateRepository;
    private final SalaryReportRepository salaryReportRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public static LocalDate periodStartForKey(String periodKey) {
        YearMonth ym = YearMonth.parse(periodKey);
        return LocalDate.of(ym.getYear(), ym.getMonth(), 10);
    }

    public static LocalDate periodEndExclusiveForKey(String periodKey) {
        YearMonth ym = YearMonth.parse(periodKey).plusMonths(1);
        return LocalDate.of(ym.getYear(), ym.getMonth(), 10);
    }

    @Transactional
    public SalaryTemplateResponse upsertTemplate(UUID coordinatorId, UpsertSalaryTemplateRequest req) {
        String key = normalizePeriodKey(req.getPeriodKey());
        LocalDate start = periodStartForKey(key);
        LocalDate end = periodEndExclusiveForKey(key);

        SalaryTemplate tpl = salaryTemplateRepository.findByPeriodKey(key)
                .orElseGet(() -> SalaryTemplate.builder().periodKey(key).build());

        tpl.setPeriodStart(start);
        tpl.setPeriodEnd(end);
        tpl.setDayRate(req.getDayRate().setScale(2, RoundingMode.HALF_UP));
        tpl.setExtraLeaveDayDeduction(req.getExtraLeaveDayDeduction().setScale(2, RoundingMode.HALF_UP));
        tpl.setTotalWorkableDays(req.getTotalWorkableDays());
        if (tpl.getCreatedBy() == null) tpl.setCreatedBy(coordinatorId);

        tpl = salaryTemplateRepository.save(tpl);
        return toTemplateResponse(tpl);
    }

    @Transactional(readOnly = true)
    public Optional<SalaryTemplateResponse> getTemplate(String periodKey) {
        String key = normalizePeriodKey(periodKey);
        return salaryTemplateRepository.findByPeriodKey(key).map(this::toTemplateResponse);
    }

    @Transactional
    public List<SalaryReportResponse> generateReports(UUID coordinatorId, String periodKey) {
        String key = normalizePeriodKey(periodKey);
        SalaryTemplate tpl = salaryTemplateRepository.findByPeriodKey(key)
                .orElseThrow(() -> new RuntimeException("Salary template not found for " + key));

        LocalDate from = tpl.getPeriodStart();
        LocalDate toExclusive = tpl.getPeriodEnd(); // stored as exclusive end date (10th next month)

        List<User> staff = userRepository.findByStatusAndRoleIn(UserStatus.approved, List.of(UserRole.staff));
        Map<UUID, User> userMap = new HashMap<>();
        for (User u : staff) userMap.put(u.getId(), u);

        List<SalaryReportResponse> out = new ArrayList<>();
        for (User s : staff) {
            Aggregates agg = computeAttendanceAggregates(s.getId(), from, toExclusive);

            BigDecimal totalWorkable = new BigDecimal(String.valueOf(tpl.getTotalWorkableDays()));
            BigDecimal gross = tpl.getDayRate().multiply(totalWorkable).setScale(2, RoundingMode.HALF_UP);

            BigDecimal unpaidDaysRaw = agg.leaveDays.add(agg.absentDays).add(agg.halfDayAsUnpaidDays());
            BigDecimal extraLeaveDays = unpaidDaysRaw.subtract(FREE_LEAVES);
            if (extraLeaveDays.compareTo(BigDecimal.ZERO) < 0) extraLeaveDays = BigDecimal.ZERO;
            extraLeaveDays = extraLeaveDays.setScale(2, RoundingMode.HALF_UP);

            BigDecimal deductionAmount = tpl.getExtraLeaveDayDeduction()
                    .multiply(extraLeaveDays)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal net = gross.subtract(deductionAmount).setScale(2, RoundingMode.HALF_UP);
            if (net.compareTo(BigDecimal.ZERO) < 0) net = BigDecimal.ZERO;

            SalaryReport report = salaryReportRepository.findByStaffIdAndPeriodKey(s.getId(), key)
                    .orElseGet(() -> SalaryReport.builder()
                            .staffId(s.getId())
                            .periodKey(key)
                            .build());

            report.setTemplateId(tpl.getId());
            report.setPeriodStart(from);
            report.setPeriodEnd(toExclusive);
            report.setTotalWorkableDays(tpl.getTotalWorkableDays());
            report.setPresentDays(agg.presentDays);
            report.setLeaveDays(agg.leaveDays);
            report.setAbsentDays(agg.absentDays.add(agg.halfDayAsUnpaidDays()));
            report.setFreeLeaveDays(FREE_LEAVES);
            report.setExtraLeaveDays(extraLeaveDays);
            report.setDayRate(tpl.getDayRate());
            report.setGrossSalary(gross);
            report.setDeductionAmount(deductionAmount);
            report.setNetSalary(net);

            // Regeneration should not override HOD decisions
            if (report.getStatus() == null) report.setStatus(SalaryReportStatus.draft);

            report = salaryReportRepository.save(report);
            out.add(toReportResponse(report, s, null));
        }

        // newest first
        out.sort(Comparator.comparing(SalaryReportResponse::getStaffName, Comparator.nullsLast(String::compareToIgnoreCase)));
        return out;
    }

    @Transactional(readOnly = true)
    public List<SalaryReportResponse> listReports(String periodKey) {
        String key = normalizePeriodKey(periodKey);
        List<SalaryReport> reports = salaryReportRepository.findByPeriodKeyOrderByUpdatedAtDesc(key);

        Map<UUID, User> userMap = new HashMap<>();
        Set<UUID> userIds = new HashSet<>();
        for (SalaryReport r : reports) userIds.add(r.getStaffId());
        userRepository.findAllById(userIds).forEach(u -> userMap.put(u.getId(), u));

        Map<UUID, User> reviewerMap = new HashMap<>();
        Set<UUID> reviewerIds = new HashSet<>();
        for (SalaryReport r : reports) if (r.getReviewedBy() != null) reviewerIds.add(r.getReviewedBy());
        userRepository.findAllById(reviewerIds).forEach(u -> reviewerMap.put(u.getId(), u));

        List<SalaryReportResponse> out = new ArrayList<>();
        for (SalaryReport r : reports) {
            out.add(toReportResponse(r, userMap.get(r.getStaffId()), reviewerMap.get(r.getReviewedBy())));
        }
        return out;
    }

    @Transactional
    public void sendToHod(UUID coordinatorId, String periodKey) {
        String key = normalizePeriodKey(periodKey);
        List<SalaryReport> reports = salaryReportRepository.findByPeriodKeyOrderByUpdatedAtDesc(key);
        if (reports.isEmpty()) throw new RuntimeException("No salary reports found for " + key);

        LocalDateTime now = LocalDateTime.now();
        for (SalaryReport r : reports) {
            r.setStatus(SalaryReportStatus.sent_to_hod);
            r.setSentToHodAt(now);
            salaryReportRepository.save(r);
        }

        List<User> hods = userRepository.findByStatusAndRoleIn(UserStatus.approved, List.of(UserRole.hod));
        String title = "Salary reports received";
        String msg = "Salary reports for period " + key + " are ready for review.";
        for (User hod : hods) {
            notificationService.notifyUser(hod.getId(), title, msg, NotificationType.info, null, null);
        }
    }

    @Transactional
    public SalaryReportResponse approve(UUID hodId, UUID reportId, String note) {
        SalaryReport r = salaryReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Salary report not found"));
        r.setStatus(SalaryReportStatus.approved);
        r.setReviewedBy(hodId);
        r.setReviewedAt(LocalDateTime.now());
        r.setReviewNote(note);
        r = salaryReportRepository.save(r);
        User staff = userRepository.findById(r.getStaffId()).orElse(null);
        User hod = userRepository.findById(hodId).orElse(null);
        return toReportResponse(r, staff, hod);
    }

    @Transactional
    public SalaryReportResponse reject(UUID hodId, UUID reportId, String note) {
        SalaryReport r = salaryReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Salary report not found"));
        r.setStatus(SalaryReportStatus.rejected);
        r.setReviewedBy(hodId);
        r.setReviewedAt(LocalDateTime.now());
        r.setReviewNote(note);
        r = salaryReportRepository.save(r);
        User staff = userRepository.findById(r.getStaffId()).orElse(null);
        User hod = userRepository.findById(hodId).orElse(null);
        return toReportResponse(r, staff, hod);
    }

    private SalaryTemplateResponse toTemplateResponse(SalaryTemplate t) {
        return SalaryTemplateResponse.builder()
                .id(t.getId() == null ? null : t.getId().toString())
                .periodKey(t.getPeriodKey())
                .periodStart(t.getPeriodStart())
                .periodEnd(t.getPeriodEnd())
                .dayRate(t.getDayRate())
                .extraLeaveDayDeduction(t.getExtraLeaveDayDeduction())
                .totalWorkableDays(t.getTotalWorkableDays())
                .createdBy(t.getCreatedBy() == null ? null : t.getCreatedBy().toString())
                .updatedAt(t.getUpdatedAt() == null ? null : t.getUpdatedAt().toString())
                .build();
    }

    private SalaryReportResponse toReportResponse(SalaryReport r, User staff, User reviewer) {
        return SalaryReportResponse.builder()
                .id(r.getId() == null ? null : r.getId().toString())
                .staffId(r.getStaffId() == null ? null : r.getStaffId().toString())
                .staffName(staff == null ? null : staff.getFullName())
                .staffEmail(staff == null ? null : staff.getEmail())
                .periodKey(r.getPeriodKey())
                .periodStart(r.getPeriodStart())
                .periodEnd(r.getPeriodEnd())
                .totalWorkableDays(r.getTotalWorkableDays())
                .presentDays(r.getPresentDays())
                .leaveDays(r.getLeaveDays())
                .absentDays(r.getAbsentDays())
                .freeLeaveDays(r.getFreeLeaveDays())
                .extraLeaveDays(r.getExtraLeaveDays())
                .dayRate(r.getDayRate())
                .grossSalary(r.getGrossSalary())
                .deductionAmount(r.getDeductionAmount())
                .netSalary(r.getNetSalary())
                .status(r.getStatus() == null ? null : r.getStatus().name())
                .sentToHodAt(r.getSentToHodAt())
                .reviewedById(r.getReviewedBy() == null ? null : r.getReviewedBy().toString())
                .reviewedByName(reviewer == null ? null : reviewer.getFullName())
                .reviewedAt(r.getReviewedAt())
                .reviewNote(r.getReviewNote())
                .build();
    }

    /**
     * Build an Excel (.xlsx) workbook for salary reports in the given period.
     */
    @Transactional(readOnly = true)
    public byte[] exportReportsAsExcel(String periodKey) {
        String key = normalizePeriodKey(periodKey);
        List<SalaryReportResponse> rows = listReports(key);

        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Salary Reports " + key);

            // Styles
            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            CellStyle moneyStyle = wb.createCellStyle();
            DataFormat df = wb.createDataFormat();
            moneyStyle.setDataFormat(df.getFormat("#,##0.00"));

            CellStyle dateStyle = wb.createCellStyle();
            dateStyle.setDataFormat(df.getFormat("yyyy-mm-dd"));

            String[] headers = {
                    "Staff Name", "Email", "Period", "Period Start", "Period End",
                    "Workable Days", "Present Days", "Leave Days", "Absent/Half Days",
                    "Free Leave Days", "Extra Leave Days",
                    "Day Rate (LKR)", "Gross Salary (LKR)", "Deduction (LKR)", "Net Salary (LKR)",
                    "Status", "Reviewed By", "Reviewed At", "Review Note"
            };
            Row headerRow = sheet.createRow(0);
            for (int c = 0; c < headers.length; c++) {
                Cell cell = headerRow.createCell(c);
                cell.setCellValue(headers[c]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (SalaryReportResponse r : rows) {
                Row row = sheet.createRow(rowIdx++);
                int c = 0;
                row.createCell(c++).setCellValue(nullToEmpty(r.getStaffName()));
                row.createCell(c++).setCellValue(nullToEmpty(r.getStaffEmail()));
                row.createCell(c++).setCellValue(nullToEmpty(r.getPeriodKey()));
                writeDate(row.createCell(c++), r.getPeriodStart(), dateStyle);
                writeDate(row.createCell(c++), r.getPeriodEnd(), dateStyle);
                row.createCell(c++).setCellValue(r.getTotalWorkableDays());
                writeDecimal(row.createCell(c++), r.getPresentDays());
                writeDecimal(row.createCell(c++), r.getLeaveDays());
                writeDecimal(row.createCell(c++), r.getAbsentDays());
                writeDecimal(row.createCell(c++), r.getFreeLeaveDays());
                writeDecimal(row.createCell(c++), r.getExtraLeaveDays());
                writeMoney(row.createCell(c++), r.getDayRate(), moneyStyle);
                writeMoney(row.createCell(c++), r.getGrossSalary(), moneyStyle);
                writeMoney(row.createCell(c++), r.getDeductionAmount(), moneyStyle);
                writeMoney(row.createCell(c++), r.getNetSalary(), moneyStyle);
                row.createCell(c++).setCellValue(nullToEmpty(r.getStatus()));
                row.createCell(c++).setCellValue(nullToEmpty(r.getReviewedByName()));
                row.createCell(c++).setCellValue(r.getReviewedAt() == null ? "" : r.getReviewedAt().toString());
                row.createCell(c).setCellValue(nullToEmpty(r.getReviewNote()));
            }

            // Totals row
            if (!rows.isEmpty()) {
                Row totalRow = sheet.createRow(rowIdx);
                Cell label = totalRow.createCell(0);
                label.setCellValue("TOTAL");
                label.setCellStyle(headerStyle);

                BigDecimal totalGross = BigDecimal.ZERO;
                BigDecimal totalDed = BigDecimal.ZERO;
                BigDecimal totalNet = BigDecimal.ZERO;
                for (SalaryReportResponse r : rows) {
                    if (r.getGrossSalary() != null) totalGross = totalGross.add(r.getGrossSalary());
                    if (r.getDeductionAmount() != null) totalDed = totalDed.add(r.getDeductionAmount());
                    if (r.getNetSalary() != null) totalNet = totalNet.add(r.getNetSalary());
                }
                writeMoney(totalRow.createCell(12), totalGross, moneyStyle);
                writeMoney(totalRow.createCell(13), totalDed, moneyStyle);
                writeMoney(totalRow.createCell(14), totalNet, moneyStyle);
            }

            for (int c = 0; c < headers.length; c++) sheet.autoSizeColumn(c);

            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate salary Excel: " + e.getMessage(), e);
        }
    }

    private static void writeDate(Cell cell, LocalDate date, CellStyle style) {
        if (date == null) { cell.setCellValue(""); return; }
        cell.setCellValue(java.sql.Date.valueOf(date));
        cell.setCellStyle(style);
    }

    private static void writeDecimal(Cell cell, BigDecimal value) {
        if (value == null) { cell.setCellValue(0d); return; }
        cell.setCellValue(value.doubleValue());
    }

    private static void writeMoney(Cell cell, BigDecimal value, CellStyle style) {
        if (value == null) { cell.setCellValue(0d); }
        else { cell.setCellValue(value.doubleValue()); }
        cell.setCellStyle(style);
    }

    private static String nullToEmpty(String s) { return s == null ? "" : s; }

    private static String normalizePeriodKey(String raw) {
        if (raw == null) throw new RuntimeException("periodKey is required");
        String s = raw.trim();
        if (!s.matches("^\\d{4}-\\d{2}$")) {
            throw new RuntimeException("periodKey must be YYYY-MM");
        }
        return s;
    }

    private Aggregates computeAttendanceAggregates(UUID staffId, LocalDate from, LocalDate toExclusive) {
        // Treat missing records as "present" is risky; for now missing = 0 and coordinator sets workable days.
        // Attendance marking can later populate the table.
        long present = attendanceRepository.countByUserIdAndAttendanceDateGreaterThanEqualAndAttendanceDateLessThanAndStatus(
                staffId, from, toExclusive, AttendanceStatus.present);
        long leave = attendanceRepository.countByUserIdAndAttendanceDateGreaterThanEqualAndAttendanceDateLessThanAndStatus(
                staffId, from, toExclusive, AttendanceStatus.leave);
        long absent = attendanceRepository.countByUserIdAndAttendanceDateGreaterThanEqualAndAttendanceDateLessThanAndStatus(
                staffId, from, toExclusive, AttendanceStatus.absent);
        long half = attendanceRepository.countByUserIdAndAttendanceDateGreaterThanEqualAndAttendanceDateLessThanAndStatus(
                staffId, from, toExclusive, AttendanceStatus.half_day);

        return new Aggregates(
                new BigDecimal(present).setScale(2, RoundingMode.HALF_UP),
                new BigDecimal(leave).setScale(2, RoundingMode.HALF_UP),
                new BigDecimal(absent).setScale(2, RoundingMode.HALF_UP),
                half
        );
    }

    private record Aggregates(BigDecimal presentDays, BigDecimal leaveDays, BigDecimal absentDays, long halfDays) {
        BigDecimal halfDayAsUnpaidDays() {
            if (halfDays <= 0) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            return new BigDecimal(halfDays).multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
        }
    }
}

