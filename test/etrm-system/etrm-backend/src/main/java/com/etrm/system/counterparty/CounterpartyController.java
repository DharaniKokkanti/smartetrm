package com.etrm.system.counterparty;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.polymorphic.Address;
import com.etrm.system.polymorphic.AddressRepository;
import com.etrm.system.polymorphic.BankAccount;
import com.etrm.system.polymorphic.BankAccountRepository;
import com.etrm.system.polymorphic.Contact;
import com.etrm.system.polymorphic.ContactRepository;
import com.etrm.system.polymorphic.EntityType;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Path/verb shape — including the nested children endpoints — must stay in
 * sync with etrm-frontend/src/features/tier1/counterparty/api.ts.
 */
@RestController
@RequestMapping("/api/v1/counterparties")
public class CounterpartyController {

    private final CounterpartyService service;
    private final ContactRepository contactRepository;
    private final BankAccountRepository bankAccountRepository;
    private final AddressRepository addressRepository;

    public CounterpartyController(
            CounterpartyService service,
            ContactRepository contactRepository,
            BankAccountRepository bankAccountRepository,
            AddressRepository addressRepository
    ) {
        this.service = service;
        this.contactRepository = contactRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.addressRepository = addressRepository;
    }

    // ── Core ──────────────────────────────────────────────────────────────

    @GetMapping
    public List<Counterparty> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public Counterparty get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<Counterparty> create(@Valid @RequestBody Counterparty input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Counterparty update(@PathVariable Long id, @Valid @RequestBody Counterparty input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    // ── Contacts ─────────────────────────────────────────────────────────

    @GetMapping("/{id}/contacts")
    public List<Contact> listContacts(@PathVariable Long id) {
        return contactRepository.findByEntityTypeAndEntityId(EntityType.COUNTERPARTY, id);
    }

    @PostMapping("/{id}/contacts")
    public ResponseEntity<Contact> addContact(@PathVariable Long id, @Valid @RequestBody Contact input) {
        service.get(id); // 404s if the parent doesn't exist
        input.setContactId(null);
        input.setEntityType(EntityType.COUNTERPARTY);
        input.setEntityId(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(contactRepository.save(input));
    }

    @PutMapping("/{id}/contacts/{contactId}")
    public Contact updateContact(
            @PathVariable Long id, @PathVariable Long contactId, @Valid @RequestBody Contact input
    ) {
        contactRepository.findById(contactId)
                .orElseThrow(() -> new NotFoundException("No contact with id " + contactId + "."));
        input.setContactId(contactId);
        input.setEntityType(EntityType.COUNTERPARTY);
        input.setEntityId(id);
        return contactRepository.save(input);
    }

    // ── Bank accounts ────────────────────────────────────────────────────

    @GetMapping("/{id}/bank-accounts")
    public List<BankAccount> listBankAccounts(@PathVariable Long id) {
        return bankAccountRepository.findByEntityTypeAndEntityId(EntityType.COUNTERPARTY, id);
    }

    @PostMapping("/{id}/bank-accounts")
    public ResponseEntity<BankAccount> addBankAccount(@PathVariable Long id, @Valid @RequestBody BankAccount input) {
        service.get(id);
        input.setBankAccountId(null);
        input.setEntityType(EntityType.COUNTERPARTY);
        input.setEntityId(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(bankAccountRepository.save(input));
    }

    @PutMapping("/{id}/bank-accounts/{bankAccountId}")
    public BankAccount updateBankAccount(
            @PathVariable Long id, @PathVariable Long bankAccountId, @Valid @RequestBody BankAccount input
    ) {
        bankAccountRepository.findById(bankAccountId)
                .orElseThrow(() -> new NotFoundException("No bank account with id " + bankAccountId + "."));
        input.setBankAccountId(bankAccountId);
        input.setEntityType(EntityType.COUNTERPARTY);
        input.setEntityId(id);
        return bankAccountRepository.save(input);
    }

    // ── Addresses ────────────────────────────────────────────────────────

    @GetMapping("/{id}/addresses")
    public List<Address> listAddresses(@PathVariable Long id) {
        return addressRepository.findByEntityTypeAndEntityId(EntityType.COUNTERPARTY, id);
    }

    @PostMapping("/{id}/addresses")
    public ResponseEntity<Address> addAddress(@PathVariable Long id, @Valid @RequestBody Address input) {
        service.get(id);
        input.setAddressId(null);
        input.setEntityType(EntityType.COUNTERPARTY);
        input.setEntityId(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(addressRepository.save(input));
    }

    @PutMapping("/{id}/addresses/{addressId}")
    public Address updateAddress(
            @PathVariable Long id, @PathVariable Long addressId, @Valid @RequestBody Address input
    ) {
        addressRepository.findById(addressId)
                .orElseThrow(() -> new NotFoundException("No address with id " + addressId + "."));
        input.setAddressId(addressId);
        input.setEntityType(EntityType.COUNTERPARTY);
        input.setEntityId(id);
        return addressRepository.save(input);
    }
}
