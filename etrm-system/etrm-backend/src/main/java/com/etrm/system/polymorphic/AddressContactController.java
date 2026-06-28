package com.etrm.system.polymorphic;

import com.etrm.system.common.NotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

/**
 * REST endpoints for the address + contact pool and their entity-link tables.
 *
 * Pool endpoints  : GET/POST/PUT /api/v1/addresses   and /api/v1/contacts
 * Link endpoints  : GET/POST/PUT /api/v1/entity-addresses and /api/v1/entity-contacts
 *                   PATCH /.../deactivate to soft-delete a link
 * Filter by entity: ?entityType=COUNTERPARTY&entityId=5
 */
@RestController
@RequestMapping("/api/v1")
public class AddressContactController {

    private final AddressRepository       addressRepo;
    private final EntityAddressRepository entityAddressRepo;
    private final ContactRepository       contactRepo;
    private final EntityContactRepository entityContactRepo;

    public AddressContactController(
            AddressRepository addressRepo,
            EntityAddressRepository entityAddressRepo,
            ContactRepository contactRepo,
            EntityContactRepository entityContactRepo) {
        this.addressRepo       = addressRepo;
        this.entityAddressRepo = entityAddressRepo;
        this.contactRepo       = contactRepo;
        this.entityContactRepo = entityContactRepo;
    }

    // ── Address pool ──────────────────────────────────────────────────────────

    @GetMapping("/addresses")
    public List<Address> listAddresses() {
        return addressRepo.findByIsActiveTrue();
    }

    @PostMapping("/addresses")
    @ResponseStatus(HttpStatus.CREATED)
    public Address createAddress(@Valid @RequestBody Address address) {
        address.setAddressId(null);
        return addressRepo.save(address);
    }

    @PutMapping("/addresses/{id}")
    public Address updateAddress(@PathVariable Long id, @Valid @RequestBody Address body) {
        Address existing = addressRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("Address " + id + " not found"));
        body.setAddressId(existing.getAddressId());
        return addressRepo.save(body);
    }

    // ── Entity-address links ──────────────────────────────────────────────────

    @GetMapping("/entity-addresses")
    public List<EntityAddress> listEntityAddresses(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long entityId) {
        if (entityType != null && entityId != null) {
            EntityType et = EntityType.valueOf(entityType);
            return entityAddressRepo.findByEntityTypeAndEntityId(et, entityId);
        }
        return entityAddressRepo.findAll();
    }

    @PostMapping("/entity-addresses")
    @ResponseStatus(HttpStatus.CREATED)
    public EntityAddress createEntityAddress(@Valid @RequestBody EntityAddress link) {
        link.setEntityAddressId(null);
        if (link.getAddress() != null && link.getAddress().getAddressId() != null) {
            Long addrId = Objects.requireNonNull(link.getAddress().getAddressId());
            Address addr = addressRepo.findById(addrId)
                    .orElseThrow(() -> new NotFoundException("Address " + addrId + " not found"));
            link.setAddress(addr);
        }
        return entityAddressRepo.save(link);
    }

    @PutMapping("/entity-addresses/{id}")
    public EntityAddress updateEntityAddress(@PathVariable Long id, @RequestBody EntityAddress body) {
        EntityAddress existing = entityAddressRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("EntityAddress " + id + " not found"));
        body.setEntityAddressId(existing.getEntityAddressId());
        return entityAddressRepo.save(body);
    }

    @PatchMapping("/entity-addresses/{id}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateEntityAddress(@PathVariable Long id) {
        EntityAddress link = entityAddressRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("EntityAddress " + id + " not found"));
        link.setIsActive(false);
        entityAddressRepo.save(link);
    }

    // ── Contact pool ──────────────────────────────────────────────────────────

    @GetMapping("/contacts")
    public List<Contact> listContacts() {
        return contactRepo.findByIsActiveTrue();
    }

    @PostMapping("/contacts")
    @ResponseStatus(HttpStatus.CREATED)
    public Contact createContact(@Valid @RequestBody Contact contact) {
        contact.setContactId(null);
        return contactRepo.save(contact);
    }

    @PutMapping("/contacts/{id}")
    public Contact updateContact(@PathVariable Long id, @Valid @RequestBody Contact body) {
        Contact existing = contactRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("Contact " + id + " not found"));
        body.setContactId(existing.getContactId());
        return contactRepo.save(body);
    }

    // ── Entity-contact links ──────────────────────────────────────────────────

    @GetMapping("/entity-contacts")
    public List<EntityContact> listEntityContacts(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long entityId) {
        if (entityType != null && entityId != null) {
            EntityType et = EntityType.valueOf(entityType);
            return entityContactRepo.findByEntityTypeAndEntityId(et, entityId);
        }
        return entityContactRepo.findAll();
    }

    @PostMapping("/entity-contacts")
    @ResponseStatus(HttpStatus.CREATED)
    public EntityContact createEntityContact(@Valid @RequestBody EntityContact link) {
        link.setEntityContactId(null);
        if (link.getContact() != null && link.getContact().getContactId() != null) {
            Long contactId = Objects.requireNonNull(link.getContact().getContactId());
            Contact contact = contactRepo.findById(contactId)
                    .orElseThrow(() -> new NotFoundException("Contact " + contactId + " not found"));
            link.setContact(contact);
        }
        return entityContactRepo.save(link);
    }

    @PutMapping("/entity-contacts/{id}")
    public EntityContact updateEntityContact(@PathVariable Long id, @RequestBody EntityContact body) {
        EntityContact existing = entityContactRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("EntityContact " + id + " not found"));
        body.setEntityContactId(existing.getEntityContactId());
        return entityContactRepo.save(body);
    }

    @PatchMapping("/entity-contacts/{id}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateEntityContact(@PathVariable Long id) {
        EntityContact link = entityContactRepo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NotFoundException("EntityContact " + id + " not found"));
        link.setIsActive(false);
        entityContactRepo.save(link);
    }
}
