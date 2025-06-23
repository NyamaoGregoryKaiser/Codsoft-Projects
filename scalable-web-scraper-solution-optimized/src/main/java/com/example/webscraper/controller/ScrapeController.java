```java
package com.example.webscraper.controller;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
public class ScrapeController {

    @GetMapping("/scrape")
    public List<String> scrape(@RequestParam String url) {
        List<String> results = new ArrayList<>();
        try {
            Document doc = Jsoup.connect(url).get();
            Elements links = doc.select("a[href]"); // Example: extract all links
            for (Element link : links) {
                results.add(link.attr("abs:href"));
            }
        } catch (IOException e) {
            e.printStackTrace(); //In production, use proper logging and error handling
        }
        return results;
    }
}
```