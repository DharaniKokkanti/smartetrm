package com.etrm.system.book;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BookEodStatusRepository extends JpaRepository<BookEodStatus, Integer> {
    List<BookEodStatus> findByBookIdOrderByBusinessDateDesc(Integer bookId);

    Optional<BookEodStatus> findByBookIdAndBusinessDate(Integer bookId, LocalDate businessDate);
}
