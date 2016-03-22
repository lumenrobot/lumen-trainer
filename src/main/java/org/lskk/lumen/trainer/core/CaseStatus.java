package org.lskk.lumen.trainer.core;

/**
 * Created by ceefour on 22/03/2016.
 */
public enum CaseStatus {
    /**
     * Client asked but assistant not yet responded.
     */
    NEED_ASSISTANT_RESPONSE,
    /**
     * Assistant responded and requiring more information.
     */
    NEED_CLIENT_RESPONSE,
    /**
     * Assistant responded and does not require client to respond.
     * If this is left for some time, case can be transitioned to {@link #RESOLVED}.
     */
    ASSISTANT_RESPONDED,
    /**
     * Assistant has responded to client request and client does not need
     * further assistance.
     */
    RESOLVED
}
