package com.etrm.system.legalentity;

import java.math.BigDecimal;
import java.util.List;

/**
 * Wrapper around a JV's ownership rows plus a server-computed advisory total.
 * totalActiveOwnershipPct is the sum of active rows' ownershipPct — display
 * guidance only (green/red "does this total 100%" indicator in the UI), not
 * a hard constraint. No precedent in this schema enforces a hard sum-to-100
 * (real cap tables can be transitionally under/over-allocated during a deal
 * close) — see ProductsPage.tsx's blend-recipe-components footer for the
 * frontend precedent this mirrors.
 */
public record LegalEntityOwnershipListView(
        List<LegalEntityOwnershipView> rows,
        BigDecimal totalActiveOwnershipPct) {
}
