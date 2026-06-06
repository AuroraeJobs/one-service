package com.one.record.web;

import lombok.AllArgsConstructor;
import com.one.record.configuration.TeslaFleetProperties;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@AllArgsConstructor
public class TeslaFleetPublicKeyController {

    private final TeslaFleetProperties properties;

    @GetMapping(value = "/.well-known/appspecific/com.tesla.3p.public-key.pem", produces = MediaType.TEXT_PLAIN_VALUE)
    public String publicKey() {
        return properties.getPublicKey().replace("\\n", "\n");
    }
}
