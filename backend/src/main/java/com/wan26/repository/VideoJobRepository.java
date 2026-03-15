package com.wan26.repository;

import com.wan26.model.JobStatus;
import com.wan26.model.VideoJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VideoJobRepository extends JpaRepository<VideoJob, UUID> {

    List<VideoJob> findByStatusInOrderByCreatedAtDesc(List<JobStatus> statuses);

    List<VideoJob> findAllByOrderByCreatedAtAsc();
}
