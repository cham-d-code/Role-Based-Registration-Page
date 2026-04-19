package com.tempstaff.support;

import com.tempstaff.dto.response.InterviewReportResponse;
import com.tempstaff.dto.response.MarkingSchemeResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Builds an .xlsx workbook for HOD / coordinator interview marking reports.
 */
public final class InterviewReportExcelExporter {

    public record CandidateMeta(String phone, boolean shortlisted) {
    }

    private InterviewReportExcelExporter() {
    }

    public static byte[] build(InterviewReportResponse report,
                               Map<String, CandidateMeta> metaByCandidateId,
                               LocalDate interviewDate) {
        List<MarkingSchemeResponse.CriterionResponse> criteria = report.getCriteria() == null
                ? List.of()
                : report.getCriteria().stream()
                .sorted(Comparator.comparingInt(MarkingSchemeResponse.CriterionResponse::getDisplayOrder))
                .collect(Collectors.toList());

        List<InterviewReportResponse.CandidateReport> candidates = report.getCandidates() == null
                ? List.of()
                : new ArrayList<>(report.getCandidates());

        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            CellStyle headerStyle = headerStyle(wb);
            CellStyle titleStyle = titleStyle(wb);

            buildSummarySheet(wb, titleStyle, headerStyle, report, interviewDate, candidates, criteria, metaByCandidateId);
            buildRankingSheet(wb, "Shortlisted", headerStyle, candidates.stream()
                    .filter(c -> {
                        CandidateMeta m = metaByCandidateId.get(c.getCandidateId());
                        return m != null && m.shortlisted();
                    })
                    .collect(Collectors.toList()), metaByCandidateId, criteria, true);
            buildRankingSheet(wb, "Complete ranking", headerStyle, candidates, metaByCandidateId, criteria, true);
            buildMarkerDetailSheet(wb, headerStyle, candidates, criteria);

            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate interview report Excel: " + e.getMessage(), e);
        }
    }

    private static void buildSummarySheet(Workbook wb, CellStyle titleStyle, CellStyle headerStyle,
                                          InterviewReportResponse report, LocalDate interviewDate,
                                          List<InterviewReportResponse.CandidateReport> candidates,
                                          List<MarkingSchemeResponse.CriterionResponse> criteria,
                                          Map<String, CandidateMeta> metaByCandidateId) {
        Sheet sheet = wb.createSheet("Summary");
        int r = 0;
        Row title = sheet.createRow(r++);
        Cell t = title.createCell(0);
        t.setCellValue("Interview report — " + safe(report.getInterviewNumber()));
        t.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));
        r++;

        String dateStr = interviewDate == null ? "—" : interviewDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
        putKeyValue(sheet, r++, "Interview number", safe(report.getInterviewNumber()));
        putKeyValue(sheet, r++, "Interview date", dateStr);
        putKeyValue(sheet, r++, "Total candidates", String.valueOf(candidates.size()));
        putKeyValue(sheet, r++, "Maximum marks (total)", String.valueOf(report.getTotalMaxMarks()));

        double avgAll = candidates.stream().mapToDouble(InterviewReportResponse.CandidateReport::getAverageTotal).average().orElse(Double.NaN);
        putKeyValue(sheet, r++, "Average of candidate averages",
                candidates.isEmpty() ? "N/A" : String.format(Locale.US, "%.2f", avgAll));

        // Shortlisted count from meta map
        long shortlisted = candidates.stream()
                .filter(c -> {
                    CandidateMeta m = metaByCandidateId.get(c.getCandidateId());
                    return m != null && m.shortlisted();
                })
                .count();
        putKeyValue(sheet, r++, "Shortlisted", String.valueOf(shortlisted));
        r += 2;

        Row critHeader = sheet.createRow(r++);
        critHeader.createCell(0).setCellValue("Marking criteria");
        critHeader.getCell(0).setCellStyle(headerStyle);
        critHeader.createCell(1).setCellValue("Max marks");
        critHeader.getCell(1).setCellStyle(headerStyle);
        for (MarkingSchemeResponse.CriterionResponse c : criteria) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(safe(c.getName()));
            row.createCell(1).setCellValue(c.getMaxMarks());
        }

        sheet.setColumnWidth(0, 22 * 256);
        sheet.setColumnWidth(1, 18 * 256);
    }

    private static void putKeyValue(Sheet sheet, int rowIdx, String key, String value) {
        Row row = sheet.createRow(rowIdx);
        Cell k = row.createCell(0);
        k.setCellValue(key);
        Font f = sheet.getWorkbook().createFont();
        f.setBold(true);
        CellStyle ks = sheet.getWorkbook().createCellStyle();
        ks.setFont(f);
        k.setCellStyle(ks);
        row.createCell(1).setCellValue(value);
    }

    private static void buildRankingSheet(Workbook wb, String sheetName, CellStyle headerStyle,
                                          List<InterviewReportResponse.CandidateReport> rows,
                                          Map<String, CandidateMeta> metaByCandidateId,
                                          List<MarkingSchemeResponse.CriterionResponse> criteria,
                                          boolean includeStatus) {
        String safeName = sheetName.length() > 31 ? sheetName.substring(0, 31) : sheetName;
        Sheet sheet = wb.createSheet(safeName);

        int col = 0;
        Row header = sheet.createRow(0);
        String[] fixed = {"Rank", "Candidate ID", "Name", "Email", "Phone"};
        for (String h : fixed) {
            Cell c = header.createCell(col++);
            c.setCellValue(h);
            c.setCellStyle(headerStyle);
        }
        for (MarkingSchemeResponse.CriterionResponse cr : criteria) {
            Cell c = header.createCell(col++);
            c.setCellValue("Avg: " + safe(cr.getName()));
            c.setCellStyle(headerStyle);
        }
        Cell cAvg = header.createCell(col++);
        cAvg.setCellValue("Average total");
        cAvg.setCellStyle(headerStyle);
        Cell cMax = header.createCell(col++);
        cMax.setCellValue("Max total");
        cMax.setCellStyle(headerStyle);
        Cell cMc = header.createCell(col++);
        cMc.setCellValue("Markers used");
        cMc.setCellStyle(headerStyle);
        if (includeStatus) {
            Cell st = header.createCell(col++);
            st.setCellValue("Shortlisted");
            st.setCellStyle(headerStyle);
        }

        int rank = 1;
        int r = 1;
        int maxCol = fixed.length + criteria.size() + 3 + (includeStatus ? 1 : 0);
        for (InterviewReportResponse.CandidateReport cand : rows) {
            col = 0;
            Row row = sheet.createRow(r++);
            row.createCell(col++).setCellValue(rank++);
            row.createCell(col++).setCellValue(safe(cand.getDisplayCandidateId()));
            row.createCell(col++).setCellValue(safe(cand.getCandidateName()));
            row.createCell(col++).setCellValue(safe(cand.getCandidateEmail()));
            CandidateMeta meta = metaByCandidateId.get(cand.getCandidateId());
            row.createCell(col++).setCellValue(meta == null ? "" : safe(meta.phone()));

            Map<String, Double> byCrit = cand.getAverageMarksByCriterion() == null
                    ? Map.of() : cand.getAverageMarksByCriterion();
            for (MarkingSchemeResponse.CriterionResponse cr : criteria) {
                Double v = byCrit.get(cr.getId());
                Cell cell = row.createCell(col++);
                if (v == null) {
                    cell.setCellValue("");
                } else {
                    cell.setCellValue(v);
                }
            }
            row.createCell(col++).setCellValue(cand.getAverageTotal());
            row.createCell(col++).setCellValue(cand.getMaxTotal());
            row.createCell(col++).setCellValue(cand.getMarkersIncludedCount());
            if (includeStatus) {
                boolean sh = meta != null && meta.shortlisted();
                row.createCell(col++).setCellValue(sh ? "Yes" : "No");
            }
        }

        for (int i = 0; i < maxCol; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private static void buildMarkerDetailSheet(Workbook wb, CellStyle headerStyle,
                                               List<InterviewReportResponse.CandidateReport> candidates,
                                               List<MarkingSchemeResponse.CriterionResponse> criteria) {
        Sheet sheet = wb.createSheet("Marker detail");
        int col = 0;
        Row header = sheet.createRow(0);
        header.createCell(col++).setCellValue("Candidate");
        header.getCell(0).setCellStyle(headerStyle);
        header.createCell(col++).setCellValue("Marker");
        header.getCell(1).setCellStyle(headerStyle);
        header.createCell(col++).setCellValue("Role");
        header.getCell(2).setCellStyle(headerStyle);
        for (MarkingSchemeResponse.CriterionResponse cr : criteria) {
            Cell c = header.createCell(col++);
            c.setCellValue(safe(cr.getName()));
            c.setCellStyle(headerStyle);
        }
        header.createCell(col++).setCellValue("Total");
        header.getCell(col - 1).setCellStyle(headerStyle);
        header.createCell(col).setCellValue("Comments");
        header.getCell(col).setCellStyle(headerStyle);
        col++;
        int maxCol = col;

        int r = 1;
        for (InterviewReportResponse.CandidateReport cand : candidates) {
            String cname = safe(cand.getCandidateName());
            if (cand.getMarkerResults() == null) {
                continue;
            }
            for (InterviewReportResponse.MarkerResult mr : cand.getMarkerResults()) {
                col = 0;
                Row row = sheet.createRow(r++);
                row.createCell(col++).setCellValue(cname);
                row.createCell(col++).setCellValue(safe(mr.getMarkerName()));
                row.createCell(col++).setCellValue(safe(mr.getMarkerRole()));
                Map<String, Integer> marks = mr.getMarksByCriterion() == null ? Map.of() : mr.getMarksByCriterion();
                for (MarkingSchemeResponse.CriterionResponse cr : criteria) {
                    Integer v = marks.get(cr.getId());
                    Cell cell = row.createCell(col++);
                    if (v == null) {
                        cell.setCellValue("");
                    } else {
                        cell.setCellValue(v);
                    }
                }
                row.createCell(col++).setCellValue(mr.getTotal());
                row.createCell(col++).setCellValue(mr.getComments() == null ? "" : mr.getComments());
            }
        }
        for (int i = 0; i < maxCol; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }

    private static CellStyle headerStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private static CellStyle titleStyle(Workbook wb) {
        Font titleFont = wb.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 14);
        CellStyle titleStyle = wb.createCellStyle();
        titleStyle.setFont(titleFont);
        return titleStyle;
    }
}
