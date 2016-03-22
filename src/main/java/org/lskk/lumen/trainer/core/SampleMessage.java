package org.lskk.lumen.trainer.core;

import org.hibernate.annotations.Type;
import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;
import org.lskk.lumen.core.EmotionKind;

import javax.persistence.*;
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
    @Enumerated(EnumType.STRING)
    private EmotionKind emotionKind;
    @Enumerated(EnumType.STRING)
    private ChatActor actor;
    private String inLanguage;
    @Column(columnDefinition = "text")
    private String text;

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
}
