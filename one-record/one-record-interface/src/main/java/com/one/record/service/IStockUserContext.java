package com.one.record.service;

/**
 * Resolves the current stock-module user. Implementations read the active
 * security context when available and fall back to the shared default scope
 * for anonymous sessions and background jobs.
 */
public interface IStockUserContext {

    String DEFAULT_USER_ID = "default";

    String currentUserId();
}
