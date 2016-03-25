package org.lskk.lumen.trainer.core;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;

/**
 * Created by ceefour on 22/03/2016.
 */
public interface SampleMessageRepository extends PagingAndSortingRepository<SampleMessage, Long> {

    Page<SampleMessage> findAllByConversationId(@Param("conversationId") long conversationId, Pageable pageable);
}
