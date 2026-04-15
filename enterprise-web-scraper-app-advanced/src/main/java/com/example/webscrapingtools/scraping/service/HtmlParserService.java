package com.example.webscrapingtools.scraping.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class HtmlParserService {

    private final ObjectMapper objectMapper; // For JSON conversion

    /**
     * Fetches HTML content from a given URL.
     * @param url The URL to fetch.
     * @return The Document object from Jsoup.
     * @throws IOException if there's an issue connecting or reading the URL.
     */
    public Document fetchHtmlDocument(String url) throws IOException {
        log.info("Fetching HTML from URL: {}", url);
        return Jsoup.connect(url)
                .timeout(10 * 1000) // 10 seconds timeout
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                .header("Accept-Language", "en-US,en;q=0.9")
                .ignoreHttpErrors(true) // Don't throw exception on 4xx/5xx codes
                .get();
    }

    /**
     * Parses a list of data items from an HTML document based on CSS selectors.
     *
     * @param document The Jsoup Document object.
     * @param itemCssSelector The CSS selector to find individual items (e.g., product cards).
     * @param fieldDefinitionsJson JSON string mapping field names to their CSS selectors within each item.
     *                             Example: {"title": ".product-title", "price": ".product-price", "link": "a.product-link[href]"}.
     * @return A list of maps, where each map represents a scraped item with fieldName -> value.
     * @throws JsonProcessingException if there's an issue parsing fieldDefinitionsJson.
     */
    public List<Map<String, String>> parseData(
            Document document,
            String itemCssSelector,
            String fieldDefinitionsJson
    ) throws JsonProcessingException {
        List<Map<String, String>> scrapedDataList = new ArrayList<>();
        Map<String, String> fieldDefinitions = objectMapper.readValue(fieldDefinitionsJson, new TypeReference<>() {});

        Elements itemElements = document.select(itemCssSelector);
        log.info("Found {} items using selector: {}", itemElements.size(), itemCssSelector);

        for (Element itemElement : itemElements) {
            Map<String, String> itemData = new HashMap<>();
            for (Map.Entry<String, String> entry : fieldDefinitions.entrySet()) {
                String fieldName = entry.getKey();
                String selector = entry.getValue();

                // Handle attribute extraction (e.g., img[src], a[href])
                if (selector.contains("[") && selector.contains("]")) {
                    String cssPart = selector.substring(0, selector.indexOf("["));
                    String attrPart = selector.substring(selector.indexOf("[") + 1, selector.indexOf("]"));
                    Element element = itemElement.selectFirst(cssPart);
                    if (element != null) {
                        itemData.put(fieldName, element.attr(attrPart));
                    }
                } else {
                    Element element = itemElement.selectFirst(selector);
                    if (element != null) {
                        itemData.put(fieldName, element.text());
                    }
                }
            }
            if (!itemData.isEmpty()) {
                scrapedDataList.add(itemData);
            }
        }
        return scrapedDataList;
    }
}