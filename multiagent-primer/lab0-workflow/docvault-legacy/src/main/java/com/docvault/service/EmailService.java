package com.docvault.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.logging.Logger;

@Service
public class EmailService {

    private static final Logger logger = Logger.getLogger(EmailService.class.getName());

    @Value("${mail.smtp.host:smtp.sendgrid.net}")
    private String smtpHost;

    @Value("${mail.smtp.port:587}")
    private int smtpPort;

    @Value("${mail.smtp.username:apikey}")
    private String smtpUsername;

    @Value("${mail.smtp.password:}")
    private String smtpPassword;

    @Value("${mail.from:noreply@docvault-legacy.com}")
    private String fromAddress;

    public boolean sendEmail(String to, String subject, String body) {
        try {
            logger.info("=== SENDING EMAIL ===");
            logger.info("TO: " + to);
            logger.info("FROM: " + fromAddress);
            logger.info("SUBJECT: " + subject);
            logger.info("BODY: " + body);
            logger.info("=== EMAIL LOGGED (not actually sent) ===");

            return true;
        } catch (Exception e) {
            logger.warning("Email send failed: " + e.getMessage());
            return false;
        }
    }

    public void sendLowStockAlert(String productName, int currentStock) {
        String subject = "LOW STOCK ALERT: " + productName;
        String body = "The following product is running low on stock:\n\n"
            + "Product: " + productName + "\n"
            + "Current Stock: " + currentStock + "\n\n"
            + "Please reorder soon.";

        sendEmail("admin@docvault-legacy.com", subject, body);
    }
}
