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
@Table(name = "salary_templates", uniqueConstraints = @UniqueConstraint(columnNames = {"period_key"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "period_key", nullable = false, length = 7)
    private String periodKey; // YYYY-MM (period start month)

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "day_rate", nullable = false, precision = 12, scale = 2)
    private BigDecimal dayRate;

    @Column(name = "extra_leave_day_deduction", nullable = false, precision = 12, scale = 2)
    private BigDecimal extraLeaveDayDeduction;

    @Column(name = "total_workable_days", nullable = false)
    private Integer totalWorkableDays;

    @Column(name = "created_by")
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

