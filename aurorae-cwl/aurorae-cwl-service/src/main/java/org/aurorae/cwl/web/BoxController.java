package org.aurorae.cwl.web;

import lombok.AllArgsConstructor;
import org.aurorae.cwl.service.IBoxService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("box")
@AllArgsConstructor
public class BoxController {

    private final IBoxService boxService;
}
