package org.lskk.lumen.trainer;

/**
 * Created by ceefour on 27/10/2015.
 */
public class TrainerException extends RuntimeException {

    public TrainerException() {
    }

    public TrainerException(String message) {
        super(message);
    }

    public TrainerException(String message, Throwable cause) {
        super(message, cause);
    }

    public TrainerException(Throwable cause) {
        super(cause);
    }

    public TrainerException(Throwable cause, String format, Object... params) {
        super(String.format(format, params), cause);
    }

    public TrainerException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}
