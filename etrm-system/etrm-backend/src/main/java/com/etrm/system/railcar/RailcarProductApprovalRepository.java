package com.etrm.system.railcar;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RailcarProductApprovalRepository extends JpaRepository<RailcarProductApproval, Integer> {
    List<RailcarProductApproval> findByAssetTypeAndAssetId(String assetType, Integer assetId);
}
