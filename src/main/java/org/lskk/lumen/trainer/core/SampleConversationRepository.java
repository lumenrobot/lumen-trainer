package org.lskk.lumen.trainer.core;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.web.PageableDefault;

/**
 * Created by ceefour on 22/03/2016.
 */
public interface SampleConversationRepository extends PagingAndSortingRepository<SampleConversation, Long> {

    @Query("SELECT sc FROM SampleConversation sc ORDER BY sc.caseOrder, sc.creationTime")
    //@PageableDefault(sort = {"caseOrder", "creationTime"}, size = 200)
    Page<SampleConversation> findTopUnresponded(Pageable pageable);

}
