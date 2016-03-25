package org.lskk.lumen.trainer.core;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.common.base.MoreObjects;
import org.hibernate.annotations.*;
import org.hibernate.annotations.Parameter;
import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;
import org.lskk.lumen.core.Gender;

import javax.persistence.*;
import javax.persistence.Entity;
import javax.persistence.OrderBy;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * A sample conversation used for training Lumen chatbot/helpdesk feature.
 * Contains {@link SampleMessage}s.
 * Created by ceefour on 22/03/2016.
 */
@Entity
@SecondaryTable(name = "sampleconversationex")
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
    @Formula("CASE casestatus WHEN 'NEED_ASSISTANT_RESPONSE' THEN 0\n" +
            "WHEN 'NEED_CLIENT_RESPONSE' THEN 1\n" +
            "WHEN 'ASSISTANT_RESPONDED' THEN 2 ELSE 99 END")
    private Integer caseOrder;
    @Column(table = "sampleconversationex", columnDefinition = "timestamp with time zone",
            insertable = false, updatable = false)
    @Type(type = "org.jadira.usertype.dateandtime.joda.PersistentDateTime")
    private DateTime lastResponseTime;
    @Column(table = "sampleconversationex", insertable = false, updatable = false)
    private Long unrespondedCount;

    @OneToMany(mappedBy = "conversation")
    @OrderBy("creationTime ASC")
    private List<SampleMessage> messages = new ArrayList<>();

    @JsonIgnore
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @JsonProperty("id")
    public Long getThingId() { return id; }

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

    public Integer getCaseOrder() {
        return caseOrder;
    }

    public DateTime getLastResponseTime() {
        return lastResponseTime;
    }

    public Long getUnrespondedCount() {
        return unrespondedCount;
    }

    @Override
    public String toString() {
        return MoreObjects.toStringHelper(this).omitNullValues()
                .add("id", id)
                .add("creationTime", creationTime)
                .add("timeZone", timeZone)
                .add("clientName", clientName)
                .add("clientGender", clientGender)
                .add("clientAge", clientAge)
                .add("initiator", initiator)
                .add("inLanguage", inLanguage)
                .add("caseStatus", caseStatus)
                .toString();
    }
}
