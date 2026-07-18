package com.etrm.system.book;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

/** Composite key for dbo.book_trader (book_id, trader_id) — see V119. */
@Embeddable
public class BookTraderId implements Serializable {

    @Column(name = "book_id")
    private Integer bookId;

    @Column(name = "trader_id")
    private Integer traderId;

    public BookTraderId() {
    }

    public BookTraderId(Integer bookId, Integer traderId) {
        this.bookId = bookId;
        this.traderId = traderId;
    }

    public Integer getBookId() {
        return bookId;
    }

    public void setBookId(Integer bookId) {
        this.bookId = bookId;
    }

    public Integer getTraderId() {
        return traderId;
    }

    public void setTraderId(Integer traderId) {
        this.traderId = traderId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BookTraderId that)) return false;
        return Objects.equals(bookId, that.bookId) && Objects.equals(traderId, that.traderId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(bookId, traderId);
    }
}
