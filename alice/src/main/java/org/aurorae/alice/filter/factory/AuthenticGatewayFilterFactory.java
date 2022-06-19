/*
 * Copyright 2016-2021 Pnoker. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.aurorae.alice.filter.factory;

import com.alibaba.fastjson.JSON;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.alice.utils.GatewayUtil;
import org.aurorae.common.constant.Common;
import org.aurorae.common.exception.ServiceException;
import org.aurorae.common.util.Login;
import org.aurorae.common.util.Result;
import org.aurorae.common.util.Utils;
import org.aurorae.sso.client.TenantClient;
import org.aurorae.sso.client.TokenClient;
import org.aurorae.sso.model.Tenant;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;


/**
 * 自定义 Request Header 校验过滤器
 *
 * @author pnoker
 */
@Slf4j
@Component
public class AuthenticGatewayFilterFactory extends AbstractGatewayFilterFactory<Object> {

    @Override
    public GatewayFilter apply(Object config) {
        return new AuthenticGatewayFilter();
    }

    @Component
    static class AuthenticGatewayFilter implements GatewayFilter {
        private static AuthenticGatewayFilter gatewayFilter;

        @Resource
        private TenantClient tenantClient;
        @Resource
        private TokenClient tokenClient;

        @PostConstruct
        public void init() {
            gatewayFilter = this;
        }

        @Override
        public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
            ServerHttpRequest request = exchange.getRequest();

            try {
                String cookieToken = GatewayUtil.getRequestCookie(request, Common.Service.AUTH_TOKEN);
                Login login = JSON.parseObject(Utils.decode(cookieToken), Login.class);
                log.debug("Request cookies: {}", login);

                Result<Tenant> tenantR = gatewayFilter.tenantClient.selectByName(login.getTenant());
                if (!tenantR.isOk() || !tenantR.getData().getEnable()) {
                    throw new ServiceException("Invalid tenant");
                }

                Result<Long> validR = gatewayFilter.tokenClient.checkTokenValid(login);
                if (!validR.isOk()) {
                    throw new ServiceException("Invalid token");
                }
                Tenant tenant = tenantR.getData();
                log.debug("Request tenant: {}", tenant);

                ServerHttpRequest build = request.mutate().headers(
                        httpHeader -> {
                            httpHeader.set(Common.Service.AUTH_TENANT_ID, tenant.getId().toString());
                            httpHeader.set(Common.Service.AUTH_TENANT, login.getTenant());
                            httpHeader.set(Common.Service.AUTH_USER, login.getName());
                        }
                ).build();
                exchange.mutate().request(build).build();
            } catch (Exception e) {
                ServerHttpResponse response = exchange.getResponse();
                response.getHeaders().add(Common.Response.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
                response.setStatusCode(HttpStatus.FORBIDDEN);
                log.error(e.getMessage(), e);

                DataBuffer dataBuffer = response.bufferFactory().wrap(JSON.toJSONBytes(Result.fail(e.getMessage())));
                return response.writeWith(Mono.just(dataBuffer));
            }

            return chain.filter(exchange);
        }
    }

}
