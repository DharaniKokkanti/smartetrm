package com.etrm.system.auth;

public record LoginResponse(
        String token,
        Long userId,
        String username,
        String fullName
) {}
