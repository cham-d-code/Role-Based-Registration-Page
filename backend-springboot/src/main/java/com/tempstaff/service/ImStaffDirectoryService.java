package com.tempstaff.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ImStaffDirectoryService {

    private static final String STAFF_URL = "https://im.kln.ac.lk/staff";
    private static final Duration TIMEOUT = Duration.ofSeconds(6);

    /**
     * Best-effort lookup by full name on https://im.kln.ac.lk/staff.
     *
     * Important: That page does NOT publish email addresses, so we cannot reliably "search the address".
     * We match using the user's provided full name (case-insensitive) and extract the first plausible
     * specialization line after the name block.
     */
    public String lookupSpecializationByFullName(String fullName) {
        if (fullName == null || fullName.isBlank()) return null;

        String body = fetchStaffPage();
        if (body == null || body.isBlank()) return null;

        List<String> lines = normalizeToLines(body);

        int idx = indexOfLine(lines, fullName);
        if (idx < 0) return null;

        // Look ahead a limited window after the staff name for a specialization line.
        for (int i = idx + 1; i < Math.min(lines.size(), idx + 40); i++) {
            String line = lines.get(i);
            if (line.isBlank()) continue;

            // Stop when next person's heading begins (very likely a new staff name).
            if (line.startsWith("#")) break;

            if (looksLikeSpecializationLine(line)) {
                return line.trim();
            }
        }

        return null;
    }

    private String fetchStaffPage() {
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(TIMEOUT)
                    .build();

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(STAFF_URL))
                    .timeout(TIMEOUT)
                    .header("User-Agent", "TempStaffApp/1.0")
                    .GET()
                    .build();

            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() < 200 || resp.statusCode() >= 300) return null;
            return resp.body();
        } catch (Exception ignored) {
            return null;
        }
    }

    private List<String> normalizeToLines(String html) {
        // Very lightweight HTML → text conversion: remove tags, keep separators.
        String text = html
                .replaceAll("(?is)<script.*?>.*?</script>", " ")
                .replaceAll("(?is)<style.*?>.*?</style>", " ")
                .replaceAll("(?is)<br\\s*/?>", "\n")
                .replaceAll("(?is)</p>|</div>|</li>|</h\\d>", "\n")
                .replaceAll("(?is)<[^>]+>", " ")
                .replace("&amp;", "&")
                .replace("&nbsp;", " ");

        String[] raw = text.split("\\r?\\n");
        List<String> lines = new ArrayList<>();
        for (String r : raw) {
            String line = r.replaceAll("\\s+", " ").trim();
            if (!line.isEmpty()) lines.add(line);
        }
        return lines;
    }

    private int indexOfLine(List<String> lines, String fullName) {
        String needle = fullName.toLowerCase(Locale.ROOT).trim();
        for (int i = 0; i < lines.size(); i++) {
            String l = lines.get(i).toLowerCase(Locale.ROOT).trim();
            if (l.equals(needle)) return i;
        }
        return -1;
    }

    private boolean looksLikeSpecializationLine(String line) {
        String l = line.toLowerCase(Locale.ROOT);

        // Exclude common non-specialization lines
        if (l.contains("phd") || l.contains("msc") || l.contains("m.sc") || l.contains("mphil") || l.contains("bsc")
                || l.contains("b.sc") || l.contains("master") || l.contains("doctor") || l.contains("professor")
                || l.contains("senior lecturer") || l.contains("lecturer") || l.contains("head of the department")
                || l.contains("on leave")) {
            return false;
        }

        // Specializations are typically comma-separated topics.
        return line.contains(",") && line.length() >= 12;
    }
}

