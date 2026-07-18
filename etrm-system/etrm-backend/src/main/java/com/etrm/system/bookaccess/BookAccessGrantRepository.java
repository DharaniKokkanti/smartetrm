package com.etrm.system.bookaccess;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookAccessGrantRepository extends JpaRepository<BookAccessGrant, Integer> {
    List<BookAccessGrant> findByUserIdAndIsActiveTrue(Integer userId);
    Optional<BookAccessGrant> findByUserIdAndScopeTypeAndScopeIdAndIsActiveTrue(
            Integer userId, String scopeType, Integer scopeId);
}
