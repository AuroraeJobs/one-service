package com.one.record.service;

import com.one.record.tesla.TeslaFleetApiCache;
import com.one.record.tesla.TeslaFleetChargingHistoryCache;
import com.one.record.tesla.TeslaFleetTokenCache;
import com.one.record.tesla.TeslaFleetTokenRequest;
import com.one.record.tesla.TeslaFleetTokenResponse;
import com.one.record.tesla.TeslaFleetTokenStatus;
import com.one.record.tesla.TeslaFleetTelemetryCache;
import com.one.record.tesla.TeslaFleetVehicleCache;

import java.util.Map;

public interface ITeslaFleetApiService {

    String buildAuthorizeUrl(String state, String nonce, String scope, String redirectUri);

    TeslaFleetTokenResponse exchangeAuthorizationCode(TeslaFleetTokenRequest request);

    TeslaFleetTokenResponse refreshToken(TeslaFleetTokenRequest request);

    TeslaFleetTokenResponse saveToken(String accountKey, TeslaFleetTokenResponse token);

    TeslaFleetTokenResponse exchangeAuthorizationCodeAndStore(String accountKey, TeslaFleetTokenRequest request);

    TeslaFleetTokenResponse refreshStoredToken(String accountKey);

    TeslaFleetTokenStatus getTokenStatus(String accountKey);

    TeslaFleetTokenCache getStoredToken(String accountKey);

    TeslaFleetTokenResponse partnerToken(String scope);

    Map<String, Object> listVehicles(String accessToken);

    Map<String, Object> chargingHistory(String accessToken, Map<String, String> query);

    Map<String, Object> chargingInvoice(String accessToken, String invoiceId);

    Map<String, Object> userMe(String accessToken);

    Map<String, Object> userMeWithStoredToken(String accountKey);

    TeslaFleetApiCache getApiCache(String accountKey, String type, String key);

    TeslaFleetApiCache refreshUserMeCache(String accountKey);

    TeslaFleetApiCache refreshUserRegionCache(String accountKey);

    TeslaFleetApiCache refreshVehicleCache(String accountKey, String vin);

    TeslaFleetApiCache refreshVehicleDataCache(String accountKey, String vin);

    TeslaFleetApiCache refreshNearbyChargingSitesCache(String accountKey, String vin);

    TeslaFleetApiCache refreshChargingInvoiceCache(String accountKey, String invoiceId);

    TeslaFleetVehicleCache getCachedVehicles(String accountKey);

    TeslaFleetVehicleCache refreshCachedVehicles(String accountKey);

    TeslaFleetChargingHistoryCache getCachedChargingHistory(String accountKey);

    TeslaFleetChargingHistoryCache refreshCachedChargingHistory(String accountKey, Map<String, String> query);

    Map<String, Object> getVehicle(String accessToken, String vin);

    Map<String, Object> getVehicleData(String accessToken, String vin);

    Map<String, Object> wakeUp(String accessToken, String vin);

    Map<String, Object> vehicleCommand(String accessToken, String vin, String command, Map<String, Object> body);

    Map<String, Object> vehicleCommandWithStoredToken(String accountKey, String vin, String command, Map<String, Object> body);

    Map<String, Object> createFleetTelemetryConfigWithStoredToken(String accountKey, Map<String, Object> body);

    Map<String, Object> getFleetTelemetryConfigWithStoredToken(String accountKey, String vin);

    Map<String, Object> deleteFleetTelemetryConfigWithStoredToken(String accountKey, String vin);

    Map<String, Object> fleetTelemetryErrorsWithStoredToken(String accountKey, String vin);

    TeslaFleetTelemetryCache getFleetTelemetryCache(String vin, String recordType);

    Map<String, Object> nearbyChargingSites(String accessToken, String vin);

    Map<String, Object> userRegion(String accessToken);

    Map<String, Object> registerPartnerAccount(String partnerToken, String domain);

    Map<String, Object> getPartnerPublicKey(String partnerToken, String domain);
}
