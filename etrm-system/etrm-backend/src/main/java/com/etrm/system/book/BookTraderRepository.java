package com.etrm.system.book;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BookTraderRepository extends JpaRepository<BookTrader, BookTraderId> {

    // bookId/traderId live on the @EmbeddedId (BookTraderId), not as direct
    // attributes of BookTrader, so plain derived-query naming can't resolve
    // "bookId" — explicit JPQL against id.bookId instead.
    @Query("select bt from BookTrader bt where bt.id.bookId = :bookId and bt.isActive = true")
    List<BookTrader> findByBookIdAndIsActiveTrue(@Param("bookId") Integer bookId);

    @Query("select case when count(bt) > 0 then true else false end from BookTrader bt "
            + "where bt.id.bookId = :bookId and bt.role = :role and bt.isActive = true")
    boolean existsByBookIdAndRoleAndIsActiveTrue(@Param("bookId") Integer bookId, @Param("role") String role);
}
