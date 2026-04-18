package com.tempstaff.controller;

import com.tempstaff.service.AttendanceReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceReportService attendanceReportService;

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR')")
    public ResponseEntity<byte[]> exportMonthly(@RequestParam("periodKey") String periodKey) {
        byte[] body = attendanceReportService.exportMonthlyAttendance(periodKey);
        String filename = "attendance-report-" + periodKey + ".xlsx";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(body);
    }
}
