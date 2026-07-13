package com.etrm.system.guarantee;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.polymorphic.EntityType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ParentCompanyGuaranteeService {

    private final ParentCompanyGuaranteeRepository repository;

    public ParentCompanyGuaranteeService(ParentCompanyGuaranteeRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ParentCompanyGuarantee> list() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ParentCompanyGuarantee> listForEntity(EntityType entityType, Integer entityId) {
        return repository.findForEntity(entityType, entityId);
    }

    public ParentCompanyGuarantee create(ParentCompanyGuarantee input) {
        if (repository.existsByPcgReferenceIgnoreCase(input.getPcgReference())) {
            throw new ConflictException("PCG Reference \"" + input.getPcgReference() + "\" already exists.");
        }
        if (input.getGuarantorEntityType() == input.getPrincipalEntityType()
                && input.getGuarantorEntityId().equals(input.getPrincipalEntityId())) {
            throw new ConflictException("A guarantor cannot guarantee itself.");
        }
        input.setPcgId(null);
        input.setIsActive(true);
        return repository.save(input);
    }

    public ParentCompanyGuarantee update(Integer id, ParentCompanyGuarantee input) {
        ParentCompanyGuarantee existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No guarantee with id " + id + "."));
        input.setPcgId(id);
        input.setIsActive(existing.getIsActive());
        return repository.save(input);
    }

    public void deactivate(Integer id) {
        ParentCompanyGuarantee existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No guarantee with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
