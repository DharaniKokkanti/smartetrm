package com.etrm.system.product;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Path/verb shape must stay in sync with productSpecApi.listParameters in products/api.ts. */
@RestController
@RequestMapping("/api/v1/spec-parameters")
public class SpecParameterController {

    private final SpecParameterService service;

    public SpecParameterController(SpecParameterService service) {
        this.service = service;
    }

    @GetMapping
    public List<SpecParameter> list(@RequestParam(required = false) String commodityType) {
        return service.list(commodityType);
    }
}
