package com.etrm.system.guarantee;

import com.etrm.system.polymorphic.EntityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ParentCompanyGuaranteeRepository extends JpaRepository<ParentCompanyGuarantee, Integer> {

    boolean existsByPcgReferenceIgnoreCase(String pcgReference);

    /** Every PCG where the given entity appears in ANY of the three roles —
     *  backs the Counterparty/Legal Entity form's "Guarantees" tab, which
     *  shows both guarantees backing an entity and ones it has itself issued. */
    @Query("""
            SELECT g FROM ParentCompanyGuarantee g
            WHERE (g.guarantorEntityType = :entityType AND g.guarantorEntityId = :entityId)
               OR (g.principalEntityType = :entityType AND g.principalEntityId = :entityId)
               OR (g.beneficiaryEntityType = :entityType AND g.beneficiaryEntityId = :entityId)
            """)
    List<ParentCompanyGuarantee> findForEntity(
            @Param("entityType") EntityType entityType,
            @Param("entityId") Integer entityId
    );
}
