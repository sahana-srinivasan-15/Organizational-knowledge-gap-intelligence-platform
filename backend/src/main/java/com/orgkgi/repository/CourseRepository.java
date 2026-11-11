package com.orgkgi.repository;

import com.orgkgi.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByTitle(String title);
    Optional<Course> findByTitleIgnoreCase(String title);
    Optional<Course> findByTitleContainingIgnoreCase(String title);
}
