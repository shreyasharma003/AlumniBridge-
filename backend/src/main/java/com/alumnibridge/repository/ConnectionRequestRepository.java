package com.alumnibridge.repository;

import com.alumnibridge.entity.ConnectionRequest;
import com.alumnibridge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ConnectionRequestRepository extends JpaRepository<ConnectionRequest, Long> {
    List<ConnectionRequest> findByReceiverAndStatus(User receiver, ConnectionRequest.Status status);
    List<ConnectionRequest> findBySender(User sender);
    List<ConnectionRequest> findByReceiver(User receiver);
    Optional<ConnectionRequest> findBySenderAndReceiver(User sender, User receiver);
    
    // Find connection in either direction
    @Query("SELECT c FROM ConnectionRequest c WHERE (c.sender = :user1 AND c.receiver = :user2) OR (c.sender = :user2 AND c.receiver = :user1)")
    Optional<ConnectionRequest> findConnectionBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
}
