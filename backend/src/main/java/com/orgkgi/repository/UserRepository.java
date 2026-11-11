package com.orgkgi.repository;

import com.orgkgi.entity.Role;
import com.orgkgi.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);

    List<User> findByDepartmentId(Long departmentId);

    @Query("SELECT u FROM User u WHERE (:role IS NULL OR u.role = :role) AND (:departmentId IS NULL OR u.department.id = :departmentId)")
    Page<User> findUsersWithFilters(@Param("role") Role role, @Param("departmentId") Long departmentId, Pageable pageable);
}
