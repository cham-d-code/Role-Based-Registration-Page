package com.tempstaff.service;

import com.tempstaff.entity.Attendance;
import com.tempstaff.entity.AttendanceStatus;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.entity.UserStatus;
import com.tempstaff.repository.AttendanceRepository;
import com.tempstaff.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;

/**
 * Generates Excel reports for staff attendance for a selected calendar month.
 */
@Service
@RequiredArgsConstructor
public class AttendanceReportService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public byte[] exportMonthlyAttendance(String periodKey) {
        YearMonth ym = parsePeriodKey(periodKey);
        LocalDate from = ym.atDay(1);
        LocalDate toExclusive = ym.plusMonths(1).atDay(1);

        List<User> staff = userRepository.findByStatusAndRoleIn(
                UserStatus.approved, List.of(UserRole.staff));
        staff.sort(Comparator.comparing(User::getFullName, Comparator.nullsLast(String::compareToIgnoreCase)));

        List<Attendance> records = attendanceRepository
                .findByAttendanceDateGreaterThanEqualAndAttendanceDateLessThan(from, toExclusive);

        // Map<userId, Map<date, status>>
        Map<UUID, Map<LocalDate, AttendanceStatus>> byStaff = new HashMap<>();
        for (Attendance a : records) {
            byStaff.computeIfAbsent(a.getUserId(), k -> new HashMap<>())
                    .put(a.getAttendanceDate(), a.getStatus());
        }

        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            buildSummarySheet(wb, staff, byStaff, ym, from, toExclusive);
            buildDailySheet(wb, staff, byStaff, ym, from, toExclusive);
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate attendance Excel: " + e.getMessage(), e);
        }
    }

    private void buildSummarySheet(Workbook wb, List<User> staff,
                                   Map<UUID, Map<LocalDate, AttendanceStatus>> byStaff,
                                   YearMonth ym, LocalDate from, LocalDate toExclusive) {
        Sheet sheet = wb.createSheet("Summary");
        CellStyle header = headerStyle(wb);
        CellStyle percent = wb.createCellStyle();
        percent.setDataFormat(wb.createDataFormat().getFormat("0.00%"));

        String monthLabel = ym.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + ym.getYear();

        Row title = sheet.createRow(0);
        Cell titleCell = title.createCell(0);
        titleCell.setCellValue("Attendance Summary - " + monthLabel);
        Font titleFont = wb.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 14);
        CellStyle titleStyle = wb.createCellStyle();
        titleStyle.setFont(titleFont);
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));

        String[] headers = {
                "Staff Name", "Email", "Present", "Half Day", "Leave", "Absent", "Total Records", "Attendance %"
        };
        Row headerRow = sheet.createRow(2);
        for (int c = 0; c < headers.length; c++) {
            Cell cell = headerRow.createCell(c);
            cell.setCellValue(headers[c]);
            cell.setCellStyle(header);
        }

        int rowIdx = 3;
        for (User u : staff) {
            Map<LocalDate, AttendanceStatus> records = byStaff.getOrDefault(u.getId(), Collections.emptyMap());
            long present = records.values().stream().filter(s -> s == AttendanceStatus.present).count();
            long half = records.values().stream().filter(s -> s == AttendanceStatus.half_day).count();
            long leave = records.values().stream().filter(s -> s == AttendanceStatus.leave).count();
            long absent = records.values().stream().filter(s -> s == AttendanceStatus.absent).count();
            long total = present + half + leave + absent;
            double rate = total == 0 ? 0d : ((double) present + 0.5d * half) / (double) total;

            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(nullSafe(u.getFullName()));
            row.createCell(1).setCellValue(nullSafe(u.getEmail()));
            row.createCell(2).setCellValue(present);
            row.createCell(3).setCellValue(half);
            row.createCell(4).setCellValue(leave);
            row.createCell(5).setCellValue(absent);
            row.createCell(6).setCellValue(total);
            Cell rateCell = row.createCell(7);
            rateCell.setCellValue(rate);
            rateCell.setCellStyle(percent);
        }

        Row periodRow = sheet.createRow(rowIdx + 1);
        periodRow.createCell(0).setCellValue(
                "Period: " + from + " to " + toExclusive.minusDays(1));

        for (int c = 0; c < headers.length; c++) sheet.autoSizeColumn(c);
    }

    private void buildDailySheet(Workbook wb, List<User> staff,
                                 Map<UUID, Map<LocalDate, AttendanceStatus>> byStaff,
                                 YearMonth ym, LocalDate from, LocalDate toExclusive) {
        Sheet sheet = wb.createSheet("Daily");
        CellStyle header = headerStyle(wb);

        // Header row: Staff, Email, then one column per day of month
        Row headerRow = sheet.createRow(0);
        Cell c0 = headerRow.createCell(0);
        c0.setCellValue("Staff Name");
        c0.setCellStyle(header);
        Cell c1 = headerRow.createCell(1);
        c1.setCellValue("Email");
        c1.setCellStyle(header);

        List<LocalDate> days = new ArrayList<>();
        for (LocalDate d = from; d.isBefore(toExclusive); d = d.plusDays(1)) days.add(d);
        for (int i = 0; i < days.size(); i++) {
            Cell cell = headerRow.createCell(2 + i);
            cell.setCellValue(String.valueOf(days.get(i).getDayOfMonth()));
            cell.setCellStyle(header);
        }

        int rowIdx = 1;
        for (User u : staff) {
            Map<LocalDate, AttendanceStatus> records = byStaff.getOrDefault(u.getId(), Collections.emptyMap());
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(nullSafe(u.getFullName()));
            row.createCell(1).setCellValue(nullSafe(u.getEmail()));
            for (int i = 0; i < days.size(); i++) {
                AttendanceStatus status = records.get(days.get(i));
                row.createCell(2 + i).setCellValue(status == null ? "" : codeFor(status));
            }
        }

        sheet.setColumnWidth(0, 6000);
        sheet.setColumnWidth(1, 7500);
        for (int i = 0; i < days.size(); i++) sheet.setColumnWidth(2 + i, 1200);

        // Legend
        Row legendHeader = sheet.createRow(rowIdx + 1);
        legendHeader.createCell(0).setCellValue("Legend:");
        Row legend = sheet.createRow(rowIdx + 2);
        legend.createCell(0).setCellValue("P = Present, H = Half Day, L = Leave, A = Absent, blank = Not marked");
    }

    private static String codeFor(AttendanceStatus s) {
        switch (s) {
            case present: return "P";
            case half_day: return "H";
            case leave: return "L";
            case absent: return "A";
            default: return "";
        }
    }

    private static CellStyle headerStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        return style;
    }

    private static String nullSafe(String s) { return s == null ? "" : s; }

    private static YearMonth parsePeriodKey(String raw) {
        if (raw == null || !raw.matches("^\\d{4}-\\d{2}$")) {
            throw new RuntimeException("periodKey must be YYYY-MM");
        }
        return YearMonth.parse(raw);
    }
}
