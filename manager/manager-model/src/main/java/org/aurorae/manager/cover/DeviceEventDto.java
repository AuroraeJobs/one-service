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

package org.aurorae.manager.cover;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;
import org.aurorae.common.util.Pages;
import org.aurorae.manager.document.DeviceEvent;
import org.springframework.beans.BeanUtils;

import java.io.Serializable;

/**
 * @author pnoker
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@ToString(callSuper = true)
public class DeviceEventDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long deviceId;
    private Long pointId;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Pages page;

    public void convertTo(DeviceEvent deviceEvent) {
        BeanUtils.copyProperties(this, deviceEvent);
    }

    public DeviceEventDto convert(DeviceEvent deviceEvent) {
        BeanUtils.copyProperties(deviceEvent, this);
        return this;
    }
}
