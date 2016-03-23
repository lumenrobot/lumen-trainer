package org.lskk.lumen.trainer.mvc;

import org.lskk.lumen.trainer.core.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.hateoas.Resource;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.inject.Inject;

/**
 * Created by ceefour on 22/03/2016.
 */
@RestController
@RequestMapping("process")
public class TrainerController {
    private static final Logger log = LoggerFactory.getLogger(TrainerController.class);

    @Inject
    private SampleConversationRepository sampleConversationRepo;
    @Inject
    private SampleMessageRepository sampleMessageRepo;

    @RequestMapping(method = RequestMethod.POST, path = "sampleMessages")
    public Resource<SampleMessage> addSampleMessage(Resource<SampleMessage> res) {
        SampleMessage sampleMessage = res.getContent();
        log.info("Saving {}", sampleMessage);
        sampleMessage = sampleMessageRepo.save(sampleMessage);
        SampleConversation conversation = sampleMessage.getConversation();
        if (ChatActor.CLIENT == sampleMessage.getActor()) {
            conversation.setCaseStatus(CaseStatus.NEED_ASSISTANT_RESPONSE);
        } else if (ChatActor.ASSISTANT == sampleMessage.getActor()) {
            if (SentencePurpose.INTERROGATIVE == sampleMessage.getSentencePurpose()) {
                conversation.setCaseStatus(CaseStatus.NEED_CLIENT_RESPONSE);
            } else {
                conversation.setCaseStatus(CaseStatus.ASSISTANT_RESPONDED);
            }
        }
        log.info("Conversation {} is now caseStatus={}", conversation.getId(), conversation.getCaseStatus());
        conversation = sampleConversationRepo.save(conversation);
        return new Resource<>(sampleMessage);
    }
}
