package com.one.record.web;

import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import com.one.record.service.ITeslaFleetApiService;
import com.one.record.tesla.TeslaFleetApiCache;
import com.one.record.tesla.TeslaFleetTokenRequest;
import com.one.record.tesla.TeslaFleetTokenCache;
import com.one.record.tesla.TeslaFleetTokenResponse;
import com.one.record.tesla.TeslaFleetTokenStatus;
import com.one.record.tesla.TeslaFleetChargingHistoryCache;
import com.one.record.tesla.TeslaFleetTelemetryCache;
import com.one.record.tesla.TeslaFleetVehicleCache;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("tesla/fleet")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class TeslaFleetController {

    private final ITeslaFleetApiService service;

    @GetMapping("oauth/authorize-url")
    @Operation(summary = "生成 Tesla 授权地址", description = "生成 Tesla Fleet API 第三方授权码流程的 authorize URL")
    public String authorizeUrl(@RequestParam(name = "state", required = false) String state,
                               @RequestParam(name = "nonce", required = false) String nonce,
                               @RequestParam(name = "scope", required = false) String scope,
                               @RequestParam(name = "redirectUri", required = false) String redirectUri) {
        return service.buildAuthorizeUrl(state, nonce, scope, redirectUri);
    }

    @PostMapping("oauth/token")
    @Operation(summary = "Tesla 授权码换 token", description = "使用授权回调 code 换取 access_token 和 refresh_token")
    public TeslaFleetTokenResponse exchangeAuthorizationCode(@RequestBody TeslaFleetTokenRequest request) {
        return service.exchangeAuthorizationCode(request);
    }

    @PostMapping("oauth/token/store")
    @Operation(summary = "Tesla 授权码换 token 并保存", description = "使用授权回调 code 换取 token，并将 access_token/refresh_token 保存到 Redis")
    public TeslaFleetTokenResponse exchangeAuthorizationCodeAndStore(
            @RequestParam(name = "accountKey", required = false) String accountKey,
            @RequestBody TeslaFleetTokenRequest request) {
        return service.exchangeAuthorizationCodeAndStore(accountKey, request);
    }

    @PostMapping("oauth/refresh")
    @Operation(summary = "刷新 Tesla token", description = "使用 refresh_token 换取新的 access_token")
    public TeslaFleetTokenResponse refreshToken(@RequestBody TeslaFleetTokenRequest request) {
        return service.refreshToken(request);
    }

    @PostMapping("oauth/token/save")
    @Operation(summary = "手动保存 Tesla token", description = "将手动输入的 access_token/refresh_token 保存到 Redis")
    public TeslaFleetTokenResponse saveToken(@RequestParam(name = "accountKey", required = false) String accountKey,
                                             @RequestBody TeslaFleetTokenResponse token) {
        return service.saveToken(accountKey, token);
    }

    @PostMapping("oauth/refresh/store")
    @Operation(summary = "刷新 Redis 中的 Tesla token", description = "使用 Redis 中保存的 refresh_token 刷新 access_token，并回写 Redis")
    public TeslaFleetTokenResponse refreshStoredToken(@RequestParam(name = "accountKey", required = false) String accountKey) {
        return service.refreshStoredToken(accountKey);
    }

    @GetMapping("oauth/token/status")
    @Operation(summary = "查询 Tesla token 缓存状态", description = "查询 Redis 中 Tesla token 是否存在及过期时间，不返回明文 token")
    public TeslaFleetTokenStatus getTokenStatus(@RequestParam(name = "accountKey", required = false) String accountKey) {
        return service.getTokenStatus(accountKey);
    }

    @GetMapping("oauth/token/store")
    @Operation(summary = "查询 Redis 中的 Tesla token", description = "查询 Redis 中保存的 Tesla token 明文")
    public TeslaFleetTokenCache getStoredToken(@RequestParam(name = "accountKey", required = false) String accountKey) {
        return service.getStoredToken(accountKey);
    }

    @PostMapping("partner/token")
    @Operation(summary = "生成 Tesla partner token", description = "使用 client_credentials 生成合作伙伴令牌")
    public TeslaFleetTokenResponse partnerToken(@RequestParam(name = "scope", required = false) String scope) {
        return service.partnerToken(scope);
    }

    @GetMapping("vehicles")
    @Operation(summary = "查询 Tesla 车辆列表", description = "代理调用 GET /api/1/vehicles")
    public Map<String, Object> listVehicles(@RequestHeader("Authorization") String authorization) {
        return service.listVehicles(token(authorization));
    }

    @GetMapping("charging/history")
    @Operation(summary = "查询 Tesla 充电记录", description = "代理调用 GET /api/1/dx/charging/history")
    public Map<String, Object> chargingHistory(@RequestHeader("Authorization") String authorization,
                                               @RequestParam Map<String, String> query) {
        return service.chargingHistory(token(authorization), query);
    }

    @GetMapping("charging/invoice/{invoiceId}")
    @Operation(summary = "查询 Tesla 充电发票", description = "代理调用 GET /api/1/dx/charging/invoice/{id}")
    public Map<String, Object> chargingInvoice(@RequestHeader("Authorization") String authorization,
                                               @PathVariable("invoiceId") String invoiceId) {
        return service.chargingInvoice(token(authorization), invoiceId);
    }

    @GetMapping("vehicles/cache")
    @Operation(summary = "查询 Redis 中的 Tesla 车辆信息", description = "读取 Redis 中缓存的 Tesla 车辆列表")
    public TeslaFleetVehicleCache getCachedVehicles(@RequestParam(name = "accountKey", required = false) String accountKey) {
        return service.getCachedVehicles(accountKey);
    }

    @PostMapping("vehicles/cache/refresh")
    @Operation(summary = "刷新 Tesla 车辆缓存", description = "使用 Redis 中的 Tesla token 查询车辆列表，并保存到 Redis")
    public TeslaFleetVehicleCache refreshCachedVehicles(@RequestParam(name = "accountKey", required = false) String accountKey) {
        return service.refreshCachedVehicles(accountKey);
    }

    @GetMapping("charging/history/cache")
    @Operation(summary = "查询 Redis 中的 Tesla 充电记录", description = "读取 Redis 中缓存的 Tesla 充电记录")
    public TeslaFleetChargingHistoryCache getCachedChargingHistory(@RequestParam(name = "accountKey", required = false) String accountKey) {
        return service.getCachedChargingHistory(accountKey);
    }

    @PostMapping("charging/history/cache/refresh")
    @Operation(summary = "刷新 Tesla 充电记录缓存", description = "使用 Redis 中的 Tesla token 查询充电记录，并保存到 Redis")
    public TeslaFleetChargingHistoryCache refreshCachedChargingHistory(@RequestParam Map<String, String> query) {
        return service.refreshCachedChargingHistory(query.get("accountKey"), query);
    }

    @GetMapping("api/cache")
    @Operation(summary = "查询 Tesla API 缓存", description = "按类型和 key 读取 Redis 中缓存的 Tesla API 响应")
    public TeslaFleetApiCache getApiCache(@RequestParam(name = "accountKey", required = false) String accountKey,
                                          @RequestParam("type") String type,
                                          @RequestParam("key") String key) {
        return service.getApiCache(accountKey, type, key);
    }

    @PostMapping("users/me/cache/refresh")
    @Operation(summary = "刷新 Tesla 用户信息缓存", description = "调用 GET /api/1/users/me 并保存到 Redis")
    public TeslaFleetApiCache refreshUserMeCache(@RequestParam(name = "accountKey", required = false) String accountKey) {
        return service.refreshUserMeCache(accountKey);
    }

    @PostMapping("users/me")
    @Operation(summary = "查询 Tesla 用户信息", description = "使用 Redis 中的 Tesla token 调用 GET /api/1/users/me，不保存 API 响应")
    public Map<String, Object> userMeWithStoredToken(@RequestParam(name = "accountKey", required = false) String accountKey) {
        return service.userMeWithStoredToken(accountKey);
    }

    @PostMapping("users/region/cache/refresh")
    @Operation(summary = "刷新 Tesla 用户区域缓存", description = "调用 GET /api/1/users/region 并保存到 Redis")
    public TeslaFleetApiCache refreshUserRegionCache(@RequestParam(name = "accountKey", required = false) String accountKey) {
        return service.refreshUserRegionCache(accountKey);
    }

    @PostMapping("vehicles/{vin}/cache/refresh")
    @Operation(summary = "刷新 Tesla 车辆详情缓存", description = "调用 GET /api/1/vehicles/{vin} 并保存到 Redis")
    public TeslaFleetApiCache refreshVehicleCache(@RequestParam(name = "accountKey", required = false) String accountKey,
                                                  @PathVariable("vin") String vin) {
        return service.refreshVehicleCache(accountKey, vin);
    }

    @PostMapping("vehicles/{vin}/vehicle-data/cache/refresh")
    @Operation(summary = "刷新 Tesla 车辆实时数据缓存", description = "调用 GET /api/1/vehicles/{vin}/vehicle_data 并保存到 Redis")
    public TeslaFleetApiCache refreshVehicleDataCache(@RequestParam(name = "accountKey", required = false) String accountKey,
                                                      @PathVariable("vin") String vin) {
        return service.refreshVehicleDataCache(accountKey, vin);
    }

    @PostMapping("vehicles/{vin}/nearby-charging-sites/cache/refresh")
    @Operation(summary = "刷新 Tesla 附近充电站缓存", description = "调用 GET /api/1/vehicles/{vin}/nearby_charging_sites 并保存到 Redis")
    public TeslaFleetApiCache refreshNearbyChargingSitesCache(@RequestParam(name = "accountKey", required = false) String accountKey,
                                                              @PathVariable("vin") String vin) {
        return service.refreshNearbyChargingSitesCache(accountKey, vin);
    }

    @PostMapping("charging/invoice/{invoiceId}/cache/refresh")
    @Operation(summary = "刷新 Tesla 充电发票缓存", description = "调用 GET /api/1/dx/charging/invoice/{id} 并保存到 Redis")
    public TeslaFleetApiCache refreshChargingInvoiceCache(@RequestParam(name = "accountKey", required = false) String accountKey,
                                                          @PathVariable("invoiceId") String invoiceId) {
        return service.refreshChargingInvoiceCache(accountKey, invoiceId);
    }

    @GetMapping("vehicles/{vin}")
    @Operation(summary = "查询 Tesla 车辆信息", description = "代理调用 GET /api/1/vehicles/{vin}")
    public Map<String, Object> getVehicle(@RequestHeader("Authorization") String authorization,
                                          @PathVariable("vin") String vin) {
        return service.getVehicle(token(authorization), vin);
    }

    @GetMapping("vehicles/{vin}/vehicle-data")
    @Operation(summary = "查询 Tesla 车辆实时数据", description = "代理调用 GET /api/1/vehicles/{vin}/vehicle_data")
    public Map<String, Object> getVehicleData(@RequestHeader("Authorization") String authorization,
                                              @PathVariable("vin") String vin) {
        return service.getVehicleData(token(authorization), vin);
    }

    @PostMapping("vehicles/{vin}/wake-up")
    @Operation(summary = "唤醒 Tesla 车辆", description = "代理调用 POST /api/1/vehicles/{vin}/wake_up")
    public Map<String, Object> wakeUp(@RequestHeader("Authorization") String authorization,
                                      @PathVariable("vin") String vin) {
        return service.wakeUp(token(authorization), vin);
    }

    @PostMapping("vehicles/{vin}/command/{command}")
    @Operation(summary = "执行 Tesla 车辆指令", description = "使用 Redis 中的 Tesla token 代理调用 POST /api/1/vehicles/{vin}/command/{command}")
    public Map<String, Object> vehicleCommand(@RequestParam(name = "accountKey", required = false) String accountKey,
                                              @PathVariable("vin") String vin,
                                              @PathVariable("command") String command,
                                              @RequestBody(required = false) Map<String, Object> body) {
        return service.vehicleCommandWithStoredToken(accountKey, vin, command, body);
    }

    @PostMapping("telemetry/config")
    @Operation(summary = "创建 Tesla Fleet Telemetry 配置", description = "使用 Redis 中的 Tesla token 调用 POST /api/1/vehicles/fleet_telemetry_config")
    public Map<String, Object> createFleetTelemetryConfig(@RequestParam(name = "accountKey", required = false) String accountKey,
                                                          @RequestBody(required = false) Map<String, Object> body) {
        return service.createFleetTelemetryConfigWithStoredToken(accountKey, body);
    }

    @GetMapping("vehicles/{vin}/telemetry/config")
    @Operation(summary = "查询 Tesla Fleet Telemetry 配置", description = "调用 GET /api/1/vehicles/{vin}/fleet_telemetry_config")
    public Map<String, Object> getFleetTelemetryConfig(@RequestParam(name = "accountKey", required = false) String accountKey,
                                                       @PathVariable("vin") String vin) {
        return service.getFleetTelemetryConfigWithStoredToken(accountKey, vin);
    }

    @DeleteMapping("vehicles/{vin}/telemetry/config")
    @Operation(summary = "删除 Tesla Fleet Telemetry 配置", description = "调用 DELETE /api/1/vehicles/{vin}/fleet_telemetry_config")
    public Map<String, Object> deleteFleetTelemetryConfig(@RequestParam(name = "accountKey", required = false) String accountKey,
                                                          @PathVariable("vin") String vin) {
        return service.deleteFleetTelemetryConfigWithStoredToken(accountKey, vin);
    }

    @GetMapping("vehicles/{vin}/telemetry/errors")
    @Operation(summary = "查询 Tesla Fleet Telemetry 错误", description = "调用 GET /api/1/vehicles/{vin}/fleet_telemetry_errors")
    public Map<String, Object> fleetTelemetryErrors(@RequestParam(name = "accountKey", required = false) String accountKey,
                                                    @PathVariable("vin") String vin) {
        return service.fleetTelemetryErrorsWithStoredToken(accountKey, vin);
    }

    @GetMapping("vehicles/{vin}/telemetry/cache")
    @Operation(summary = "查询 Tesla Fleet Telemetry 最新缓存", description = "读取 fleet-telemetry Redis Pub/Sub 消息落地后的最新快照")
    public TeslaFleetTelemetryCache getFleetTelemetryCache(@PathVariable("vin") String vin,
                                                           @RequestParam(name = "recordType", defaultValue = "V") String recordType) {
        return service.getFleetTelemetryCache(vin, recordType);
    }

    @GetMapping("vehicles/{vin}/nearby-charging-sites")
    @Operation(summary = "查询附近 Tesla 充电站", description = "代理调用 GET /api/1/vehicles/{vin}/nearby_charging_sites")
    public Map<String, Object> nearbyChargingSites(@RequestHeader("Authorization") String authorization,
                                                   @PathVariable("vin") String vin) {
        return service.nearbyChargingSites(token(authorization), vin);
    }

    @GetMapping("users/region")
    @Operation(summary = "查询 Tesla 用户区域", description = "代理调用 GET /api/1/users/region")
    public Map<String, Object> userRegion(@RequestHeader("Authorization") String authorization) {
        return service.userRegion(token(authorization));
    }

    @PostMapping("partner/register")
    @Operation(summary = "注册 Tesla partner account", description = "代理调用 POST /api/1/partner_accounts")
    public Map<String, Object> registerPartnerAccount(@RequestHeader("Authorization") String authorization,
                                                      @RequestParam("domain") String domain) {
        return service.registerPartnerAccount(token(authorization), domain);
    }

    @GetMapping("partner/public-key")
    @Operation(summary = "校验 Tesla partner public key", description = "代理调用 GET /api/1/partner_accounts/public_key")
    public Map<String, Object> getPartnerPublicKey(@RequestHeader("Authorization") String authorization,
                                                   @RequestParam("domain") String domain) {
        return service.getPartnerPublicKey(token(authorization), domain);
    }

    private String token(String authorization) {
        if (authorization != null && authorization.toLowerCase().startsWith("bearer ")) {
            return authorization.substring(7);
        }
        return authorization;
    }
}
