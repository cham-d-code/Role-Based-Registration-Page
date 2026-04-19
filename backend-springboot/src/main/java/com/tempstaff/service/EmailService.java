package com.tempstaff.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@dimtscs.me}")
    private String fromAddress;

    public void sendPasswordResetOtp(String toEmail, String otp, int expiresMinutes) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromAddress);
        msg.setTo(toEmail);
        msg.setSubject("Password reset OTP");
        msg.setText("""
                We received a request to reset your password.

                Your OTP is: %s
                This OTP expires in %d minutes.

                If you didn't request this, you can ignore this email.
                """.formatted(otp, expiresMinutes));

        mailSender.send(msg);
        log.info("Password reset OTP email queued to {}", toEmail);
    }
}

