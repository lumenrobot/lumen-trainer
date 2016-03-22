package org.lskk.lumen.trainer.core;

import org.hibernate.annotations.*;
import org.hibernate.annotations.Parameter;
import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;
import org.lskk.lumen.core.Gender;

import javax.persistence.*;
import javax.persistence.Entity;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * A sample conversation used for training Lumen chatbot/helpdesk feature.
 * Contains {@link SampleMessage}s.
 * Created by ceefour on 22/03/2016.
 */
@Entity
public class SampleConversation implements Serializable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(columnDefinition = "timestamp with time zone", nullable = false)
    @Type(type = "org.jadira.usertype.dateandtime.joda.PersistentDateTime")
    private DateTime creationTime;
    @Type(type = "org.jadira.usertype.dateandtime.joda.PersistentDateTimeZoneAsString")
    private DateTimeZone timeZone;
    private String clientName;
    @Type(type = "org.jadira.usertype.corejava.PersistentEnumAsPostgreSQLEnum",
            parameters = {@Parameter(name = "enumClass", value = "org.lskk.lumen.core.Gender")})
    private Gender clientGender;
    private Short clientAge;
    @Type(type = "org.jadira.usertype.corejava.PersistentEnumAsPostgreSQLEnum",
            parameters = {@org.hibernate.annotations.Parameter(name = "enumClass", value = "org.lskk.lumen.trainer.core.ChatActor")})
    private ChatActor initiator;
    private String inLanguage;
    @Type(type = "org.jadira.usertype.corejava.PersistentEnumAsPostgreSQLEnum",
            parameters = {@Parameter(name = "enumClass", value = "org.lskk.lumen.trainer.core.CaseStatus")})
    private CaseStatus caseStatus;

    @OneToMany(mappedBy = "conversation")
    private List<SampleMessage> messages = new ArrayList<>();

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

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public Gender getClientGender() {
        return clientGender;
    }

    public void setClientGender(Gender clientGender) {
        this.clientGender = clientGender;
    }

    public Short getClientAge() {
        return clientAge;
    }

    public void setClientAge(Short clientAge) {
        this.clientAge = clientAge;
    }

    public ChatActor getInitiator() {
        return initiator;
    }

    public void setInitiator(ChatActor initiator) {
        this.initiator = initiator;
    }

    public String getInLanguage() {
        return inLanguage;
    }

    public void setInLanguage(String inLanguage) {
        this.inLanguage = inLanguage;
    }

    public List<SampleMessage> getMessages() {
        return messages;
    }

    public void setMessages(List<SampleMessage> messages) {
        this.messages = messages;
    }

    public DateTimeZone getTimeZone() {
        return timeZone;
    }

    public void setTimeZone(DateTimeZone timeZone) {
        this.timeZone = timeZone;
    }

    public CaseStatus getCaseStatus() {
        return caseStatus;
    }

    public void setCaseStatus(CaseStatus caseStatus) {
        this.caseStatus = caseStatus;
    }

    @PrePersist
    public void prePersist() {
        if (null == creationTime) {
            setCreationTime(new DateTime());
        }
        if (null == timeZone) {
            setTimeZone(DateTimeZone.forID("Asia/Jakarta"));
        }
        if (null == initiator) {
            setInitiator(ChatActor.CLIENT);
        }
        if (null == inLanguage) {
            setInLanguage("id-ID");
        }
        if (null == caseStatus) {
            setCaseStatus(CaseStatus.NEED_ASSISTANT_RESPONSE);
        }
    }

}
