package com.etrm.system.book;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Integer> {
    boolean existsByBookCodeIgnoreCase(String bookCode);
}
