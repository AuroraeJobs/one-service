package com.one.record.ai;

import lombok.Data;

import java.io.Serializable;

@Data
public class MiniGptRunNoteRequest implements Serializable {

    private String hypothesis;

    private String observation;

    private String conclusion;

    private String nextStep;
}
