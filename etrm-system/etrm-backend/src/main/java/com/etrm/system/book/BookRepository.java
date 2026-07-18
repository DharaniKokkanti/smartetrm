package com.etrm.system.book;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BookRepository extends JpaRepository<Book, Integer> {
    boolean existsByBookCodeIgnoreCase(String bookCode);

    /**
     * SQL Server recursive CTE walking book.parent_book_id from rootBookId
     * down to every leaf — the query shape a "roll up P&L for this book and
     * everything under it" call needs (e.g. a CONSOLIDATION book over a
     * whole desk group). Includes rootBookId itself at depth 0. MAXRECURSION
     * is set generously above BookService.MAX_PARENT_DEPTH (the write-side
     * cap enforced in application code) purely as a runaway-query guard.
     */
    @Query(value = """
            WITH book_tree AS (
                SELECT book_id, parent_book_id, 0 AS depth
                FROM dbo.book
                WHERE book_id = :rootBookId
                UNION ALL
                SELECT b.book_id, b.parent_book_id, bt.depth + 1
                FROM dbo.book b
                JOIN book_tree bt ON b.parent_book_id = bt.book_id
            )
            SELECT book_id FROM book_tree
            OPTION (MAXRECURSION 100)
            """, nativeQuery = true)
    List<Integer> findDescendantIds(@Param("rootBookId") Integer rootBookId);
}
