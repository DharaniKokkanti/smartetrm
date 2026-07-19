package com.etrm.system.book;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookOwnershipRepository extends JpaRepository<BookOwnership, Integer> {
    List<BookOwnership> findByBookId(Integer bookId);
    Optional<BookOwnership> findByBookIdAndIsOperatorTrueAndIsActiveTrue(Integer bookId);
}
