package com.example.webscrapingtools.scraping.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
class HtmlParserServiceTest {

    @Spy // Use Spy because ObjectMapper has a default constructor and methods to be tested directly
    private ObjectMapper objectMapper;

    @InjectMocks
    private HtmlParserService htmlParserService;

    private Document mockDocument;

    @BeforeEach
    void setUp() {
        // Mock HTML content for testing parsing logic
        String htmlContent = "<html><body>" +
                "<div class='product-card'>" +
                "  <h2 class='product-title'>Product A</h2>" +
                "  <p class='product-price'>$10.00</p>" +
                "  <a class='product-link' href='/product/a'>View Product A</a>" +
                "  <img class='product-image' src='/img/a.jpg'>" +
                "</div>" +
                "<div class='product-card'>" +
                "  <h2 class='product-title'>Product B</h2>" +
                "  <p class='product-price'>$25.50</p>" +
                "  <a class='product-link' href='/product/b'>View Product B</a>" +
                "  <img class='product-image' src='/img/b.png'>" +
                "</div>" +
                "<div class='product-card'>" +
                "  <h2 class='product-title'>Product C (No Link)</h2>" +
                "  <p class='product-price'>$5.00</p>" +
                "</div>" +
                "</body></html>";
        mockDocument = Jsoup.parse(htmlContent);
    }

    @Test
    void testParseData_SuccessfulExtraction() throws IOException {
        String itemCssSelector = "div.product-card";
        String fieldDefinitionsJson = "{\"title\": \"h2.product-title\", \"price\": \"p.product-price\", \"link\": \"a.product-link[href]\", \"image\": \"img.product-image[src]\"}";

        List<Map<String, String>> result = htmlParserService.parseData(mockDocument, itemCssSelector, fieldDefinitionsJson);

        assertNotNull(result);
        assertEquals(3, result.size()); // Should find 3 product cards

        // Verify Product A
        Map<String, String> productA = result.get(0);
        assertEquals("Product A", productA.get("title"));
        assertEquals("$10.00", productA.get("price"));
        assertEquals("/product/a", productA.get("link"));
        assertEquals("/img/a.jpg", productA.get("image"));

        // Verify Product B
        Map<String, String> productB = result.get(1);
        assertEquals("Product B", productB.get("title"));
        assertEquals("$25.50", productB.get("price"));
        assertEquals("/product/b", productB.get("link"));
        assertEquals("/img/b.png", productB.get("image"));

        // Verify Product C (missing link)
        Map<String, String> productC = result.get(2);
        assertEquals("Product C (No Link)", productC.get("title"));
        assertEquals("$5.00", productC.get("price"));
        assertNull(productC.get("link")); // Should be null as selector won't find it
        assertNull(productC.get("image")); // Should be null
    }

    @Test
    void testParseData_NoItemsFound() throws IOException {
        String itemCssSelector = "div.non-existent-card"; // Selector that won't match
        String fieldDefinitionsJson = "{\"title\": \".product-title\"}";

        List<Map<String, String>> result = htmlParserService.parseData(mockDocument, itemCssSelector, fieldDefinitionsJson);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testParseData_EmptyFieldDefinitions() throws IOException {
        String itemCssSelector = "div.product-card";
        String fieldDefinitionsJson = "{}"; // Empty field definitions

        List<Map<String, String>> result = htmlParserService.parseData(mockDocument, itemCssSelector, fieldDefinitionsJson);

        assertNotNull(result);
        assertEquals(3, result.size());
        assertTrue(result.get(0).isEmpty()); // Each item map should be empty
    }

    @Test
    void testParseData_InvalidFieldDefinitionsJson() {
        String itemCssSelector = "div.product-card";
        String fieldDefinitionsJson = "{invalid json}"; // Malformed JSON

        assertThrows(IOException.class, () -> htmlParserService.parseData(mockDocument, itemCssSelector, fieldDefinitionsJson));
    }

    // Note: fetchHtmlDocument directly interacts with external network.
    // In a real unit test, you'd mock Jsoup.connect().get() if you wanted to test fetchHtmlDocument in isolation
    // without actual network calls. For this example, we assume Jsoup itself works, focusing on parseData.
}