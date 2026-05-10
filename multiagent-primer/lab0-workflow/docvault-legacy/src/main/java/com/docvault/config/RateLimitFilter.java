package com.docvault.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class RateLimitFilter implements Filter {

    private static final int MAX_REQUESTS_PER_MINUTE = 30;
    private static final long WINDOW_MS = 60_000;
    private static final long EVICTION_MS = 5 * WINDOW_MS;
    private final Map<String, RateBucket> buckets = new ConcurrentHashMap<>();
    private volatile long lastEviction = System.currentTimeMillis();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String path = httpRequest.getRequestURI();

        if (path.startsWith("/api/products/search") || path.startsWith("/api/products/filter")
                || path.equals("/api/auth/login") || path.equals("/api/auth/reset-password")) {
            evictStale();
            String clientIp = httpRequest.getRemoteAddr();
            RateBucket bucket = buckets.computeIfAbsent(clientIp, k -> new RateBucket());

            if (!bucket.tryConsume()) {
                HttpServletResponse httpResponse = (HttpServletResponse) response;
                httpResponse.setStatus(429);
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"error\":\"Rate limit exceeded. Try again later.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private void evictStale() {
        long now = System.currentTimeMillis();
        if (now - lastEviction < EVICTION_MS) return;
        lastEviction = now;
        Iterator<Map.Entry<String, RateBucket>> it = buckets.entrySet().iterator();
        while (it.hasNext()) {
            if (now - it.next().getValue().windowStart.get() > EVICTION_MS) {
                it.remove();
            }
        }
    }

    private static class RateBucket {
        private final AtomicLong windowStart = new AtomicLong(System.currentTimeMillis());
        private final AtomicLong count = new AtomicLong(0);

        boolean tryConsume() {
            long now = System.currentTimeMillis();
            long start = windowStart.get();
            if (now - start > WINDOW_MS) {
                if (windowStart.compareAndSet(start, now)) {
                    count.set(1);
                    return true;
                }
            }
            return count.incrementAndGet() <= MAX_REQUESTS_PER_MINUTE;
        }
    }
}
