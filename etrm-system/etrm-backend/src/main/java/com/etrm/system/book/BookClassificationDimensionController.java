package com.etrm.system.book;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** GET /api/v1/book-classification-dimensions — the extensible axis list for dbo.book_classification. */
@RestController
@RequestMapping("/api/v1/book-classification-dimensions")
public class BookClassificationDimensionController {

    private final BookClassificationService service;

    public BookClassificationDimensionController(BookClassificationService service) {
        this.service = service;
    }

    @GetMapping
    public List<BookClassificationDimension> list() {
        return service.listDimensions();
    }
}
