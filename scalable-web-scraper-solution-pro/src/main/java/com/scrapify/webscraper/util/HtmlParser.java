```java
package com.scrapify.webscraper.util;

import com.scrapify.webscraper.exception.ScrapingException;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Component
@Slf4j
public class HtmlParser {

    private static final int TIMEOUT_MILLIS = 10000; // 10 seconds timeout

    public Document fetchDocument(String url) throws ScrapingException {
        try {
            Connection connection = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                    .timeout(TIMEOUT_MILLIS)
                    .followRedirects(true);

            Connection.Response response = connection.execute();

            if (response.statusCode() >= 400) {
                throw new ScrapingException(String.format("Failed to fetch URL %s. Status Code: %d", url, response.statusCode()));
            }

            return response.parse();
        } catch (IOException e) {
            log.error("Error fetching document from {}: {}", url, e.getMessage());
            throw new ScrapingException("Network or I/O error while fetching URL: " + url + ". " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("An unexpected error occurred while fetching document from {}: {}", url, e.getMessage());
            throw new ScrapingException("An unexpected error occurred: " + e.getMessage(), e);
        }
    }

    /**
     * Extracts data from a Document based on a configuration map of key-CSS_selector pairs.
     * For each selector, it attempts to extract text from the first matching element.
     *
     * @param document The Jsoup Document to parse.
     * @param config A map where keys are desired data field names and values are CSS selectors.
     * @return A map of extracted data.
     */
    public Map<String, String> extractData(Document document, Map<String, String> config) {
        Map<String, String> extracted = new HashMap<>();
        for (Map.Entry<String, String> entry : config.entrySet()) {
            String fieldName = entry.getKey();
            String selector = entry.getValue();

            // Try to select the element and get its text
            Optional<String> value = selectElementAndExtractText(document, selector);
            extracted.put(fieldName, value.orElse("")); // Store empty string if not found
        }
        return extracted;
    }

    /**
     * Helper to select an element by CSS selector and extract its text content.
     * This is a basic approach. For attributes (e.g., `img[src]`), it needs extension.
     *
     * @param document The Jsoup Document.
     * @param selector The CSS selector.
     * @return An Optional containing the text if found, otherwise empty.
     */
    public Optional<String> selectElementAndExtractText(Document document, String selector) {
        Elements elements = document.select(selector);
        if (elements.isEmpty()) {
            log.warn("No element found for selector: {}", selector);
            return Optional.empty();
        }

        // Basic approach: take text from the first element
        // For more complex cases (e.g., getting an attribute, or multiple elements),
        // the selector or extraction logic needs to be more sophisticated.
        Element element = elements.first();
        if (element != null) {
            // Check for specific attribute extraction (e.g., a[href], img[src])
            if (selector.contains("[") && selector.contains("]")) {
                String attribute = selector.substring(selector.indexOf("[") + 1, selector.indexOf("]"));
                return Optional.ofNullable(element.attr(attribute));
            } else {
                return Optional.ofNullable(element.text());
            }
        }
        return Optional.empty();
    }
}
```