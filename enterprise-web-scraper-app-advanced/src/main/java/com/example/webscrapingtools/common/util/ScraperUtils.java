package com.example.webscrapingtools.common.util;

import org.springframework.stereotype.Component;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ScraperUtils {

    private static final Pattern URL_PATTERN = Pattern.compile(
            "^(https?|ftp|file)://[-a-zA-Z0-9+&@#/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#/%=~_|]");

    public boolean isValidUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }
        try {
            new URL(url); // MalformedURLException will be thrown if invalid
            Matcher matcher = URL_PATTERN.matcher(url);
            return matcher.matches();
        } catch (MalformedURLException e) {
            return false;
        }
    }

    // Can add more utility methods like sanitizing data, encoding, etc.
}