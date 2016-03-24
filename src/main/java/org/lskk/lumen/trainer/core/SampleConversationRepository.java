package org.lskk.lumen.trainer.core;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;

/**
 * Created by ceefour on 22/03/2016.
 */
public interface SampleConversationRepository extends PagingAndSortingRepository<SampleConversation, Long> {

    Page<SampleConversation> findTop200OrderByCaseOrderAndCreationTime(Pageable pageable);

}
