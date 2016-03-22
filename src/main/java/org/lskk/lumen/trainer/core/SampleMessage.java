package org.lskk.lumen.trainer.core;

import org.hibernate.annotations.*;
import org.hibernate.annotations.Parameter;
import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;
import org.lskk.lumen.core.EmotionKind;

import javax.persistence.*;
import javax.persistence.Entity;
import java.io.Serializable;

/**
 * A single message, part of {@link SampleConversation}.
 * Created by ceefour on 22/03/2016.
 *
 * @see org.lskk.lumen.core.CommunicateAction
 */
@Entity
public class SampleMessage implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private SampleConversation conversation;

    @Column(columnDefinition = "timestamp with time zone", nullable = false)
    @Type(type = "org.jadira.usertype.dateandtime.joda.PersistentDateTime")
    private DateTime creationTime;
    @Type(type = "org.jadira.usertype.dateandtime.joda.PersistentDateTimeZoneAsString")
    private DateTimeZone timeZone;
    @Type(type = "org.jadira.usertype.corejava.PersistentEnumAsPostgreSQLEnum",
        parameters = {@Parameter(name = "enumClass", value = "org.lskk.lumen.core.EmotionKind")})
    private EmotionKind emotionKind;
    @Type(type = "org.jadira.usertype.corejava.PersistentEnumAsPostgreSQLEnum",
            parameters = {@Parameter(name = "enumClass", value = "org.lskk.lumen.trainer.core.ChatActor")})
    private ChatActor actor;
    private String inLanguage;
    @Column(columnDefinition = "text")
    private String bodyText;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public DateTime getCreationTime() {
        return creationTime;
    }

    public void setCreationTime(DateTime creationTime) {
        this.creationTime = creationTime;
    }

    public EmotionKind getEmotionKind() {
        return emotionKind;
    }

    public void setEmotionKind(EmotionKind emotionKind) {
        this.emotionKind = emotionKind;
    }

    public ChatActor getActor() {
        return actor;
    }

    public void setActor(ChatActor actor) {
        this.actor = actor;
    }

    public String getInLanguage() {
        return inLanguage;
    }

    public void setInLanguage(String inLanguage) {
        this.inLanguage = inLanguage;
    }

    public SampleConversation getConversation() {
        return conversation;
    }

    public void setConversation(SampleConversation conversation) {
        this.conversation = conversation;
    }

    public DateTimeZone getTimeZone() {
        return timeZone;
    }

    public void setTimeZone(DateTimeZone timeZone) {
        this.timeZone = timeZone;
    }

    public String getBodyText() {
        return bodyText;
    }

    public void setBodyText(String bodyText) {
        this.bodyText = bodyText;
    }

    @PrePersist
    public void prePersist() {
        if (null == creationTime) {
            setCreationTime(new DateTime());
        }
        if (null == timeZone) {
            setTimeZone(DateTimeZone.forID("Asia/Jakarta"));
        }
        if (null == emotionKind) {
            setEmotionKind(EmotionKind.NEUTRAL);
        }
        if (null == inLanguage) {
            setInLanguage("id-ID");
        }
    }
}
