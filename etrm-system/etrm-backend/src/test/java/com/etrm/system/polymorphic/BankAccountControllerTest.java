package com.etrm.system.polymorphic;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/bank-accounts — a read-only, cross-entity directory over
 * dbo.bank_account (see BankAccountController's doc comment: create/update
 * for a specific owning entity already lives on CounterpartyController's
 * /{id}/bank-accounts sub-resource, exercised in CounterpartyControllerTest;
 * GET /bank-accounts is the only endpoint this controller itself exposes).
 * Data is seeded here via that sub-resource, since this controller has no
 * create endpoint of its own.
 */
class BankAccountControllerTest extends ApiTestBase {

    private int createCounterparty(String code) throws Exception {
        Map<String, Object> m = new HashMap<>();
        m.put("cpCode", code);
        m.put("legalName", "Bank Account Test CP " + code);
        m.put("shortName", code + "-short");
        m.put("jurisdictionId", 1);
        m.put("cpType", 1);
        m.put("creditLimitCurrencyId", 1);
        m.put("settlementDays", 2);
        m.put("isIntercompany", false);
        m.put("parentInd", false);
        m.put("kycStatus", 1);
        String body = mockMvc.perform(auth(post("/api/v1/counterparties")).content(json(m)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("counterpartyId").asInt();
    }

    private int createBankAccount(int counterpartyId) throws Exception {
        Map<String, Object> account = new HashMap<>();
        account.put("accountType", 1); // SETTLEMENT
        account.put("currencyId", 1);
        account.put("bankName", "Directory Test Bank");
        account.put("accountName", "Directory Test Account");
        account.put("isPrimary", true);
        String body = mockMvc.perform(auth(post("/api/v1/counterparties/" + counterpartyId + "/bank-accounts")).content(json(account)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("bankAccountId").asInt();
    }

    @Test
    void list_returns_200_and_an_array_including_newly_created_accounts() throws Exception {
        int cpId = createCounterparty(unique());
        int bankAccountId = createBankAccount(cpId);

        mockMvc.perform(auth(get("/api/v1/bank-accounts")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@.bankAccountId == " + bankAccountId + ")]").exists());
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/bank-accounts"))
                .andExpect(status().isForbidden());
    }
}
