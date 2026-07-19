package com.etrm.system.book;

import java.math.BigDecimal;
import java.util.List;

/**
 * Wrapper around a book's ownership rows plus a server-computed advisory
 * total. Same non-blocking, display-only semantics as
 * LegalEntityOwnershipListView (V125) — no DB-enforced sum-to-100%.
 */
public record BookOwnershipListView(
        List<BookOwnershipView> rows,
        BigDecimal totalActiveOwnershipPct) {
}
