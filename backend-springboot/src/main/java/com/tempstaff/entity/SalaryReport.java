package com.tempstaff.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "salary_reports", uniqueConstraints = @UniqueConstraint(columnNames = {"staff_id", "period_key"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "template_id")
    private UUID templateId;

    @Column(name = "staff_id", nullable = false)
    private UUID staffId;

    @Column(name = "period_key", nullable = false, length = 7)
    private String periodKey;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "total_workable_days", nullable = false)
    private Integer totalWorkableDays;

    @Column(name = "present_days", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal presentDays = BigDecimal.ZERO;

    @Column(name = "leave_days", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal leaveDays = BigDecimal.ZERO;

    @Column(name = "absent_days", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal absentDays = BigDecimal.ZERO;

    @Column(name = "free_leave_days", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal freeLeaveDays = new BigDecimal("2.00");

    @Column(name = "extra_leave_days", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal extraLeaveDays = BigDecimal.ZERO;

    @Column(name = "day_rate", nullable = false, precision = 12, scale = 2)
    private BigDecimal dayRate;

    @Column(name = "gross_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal grossSalary;

    @Column(name = "deduction_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal deductionAmount = BigDecimal.ZERO;

    @Column(name = "net_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal netSalary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SalaryReportStatus status = SalaryReportStatus.draft;

    @Column(name = "sent_to_hod_at")
    private LocalDateTime sentToHodAt;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

