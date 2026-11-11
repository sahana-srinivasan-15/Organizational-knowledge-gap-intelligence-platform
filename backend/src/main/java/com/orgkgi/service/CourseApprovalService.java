package com.orgkgi.service;

import com.orgkgi.dto.approval.CourseApprovalRequestDto;
import com.orgkgi.dto.approval.ReviewCourseApprovalRequest;
import com.orgkgi.dto.approval.SubmitCourseApprovalRequest;
import com.orgkgi.dto.common.PagedResponse;
import com.orgkgi.dto.skillgap.SkillGapItemDto;
import com.orgkgi.dto.skillgap.SkillGapReportDto;
import com.orgkgi.entity.*;
import com.orgkgi.exception.BadRequestException;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.repository.*;
import com.orgkgi.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CourseApprovalService {

    private final CourseApprovalRequestRepository approvalRequestRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final CourseRepository courseRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final LearningPathRepository learningPathRepository;
    private final LearningPathCourseRepository learningPathCourseRepository;
    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final SkillGapService skillGapService;

    public CourseApprovalService(
            CourseApprovalRequestRepository approvalRequestRepository,
            EmployeeProfileRepository employeeProfileRepository,
            CourseRepository courseRepository,
            SkillRepository skillRepository,
            UserRepository userRepository,
            LearningPathRepository learningPathRepository,
            LearningPathCourseRepository learningPathCourseRepository,
            MentorAssignmentRepository mentorAssignmentRepository,
            SkillGapService skillGapService) {
        this.approvalRequestRepository = approvalRequestRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.courseRepository = courseRepository;
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
        this.learningPathRepository = learningPathRepository;
        this.learningPathCourseRepository = learningPathCourseRepository;
        this.mentorAssignmentRepository = mentorAssignmentRepository;
        this.skillGapService = skillGapService;
    }

    @Transactional
    public CourseApprovalRequestDto submitRequest(SubmitCourseApprovalRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile employeeProfile = employeeProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));

        // Prevent accidental duplicate submission for the same active course request
        boolean hasDuplicate = approvalRequestRepository.existsByEmployeeProfileIdAndExternalCourseTitleIgnoreCaseAndStatusIn(
                employeeProfile.getId(),
                request.getExternalCourseTitle().trim(),
                List.of(CourseApprovalStatus.PENDING, CourseApprovalStatus.APPROVED, CourseApprovalStatus.IN_PROGRESS)
        );

        if (hasDuplicate) {
            throw new BadRequestException("An active approval request for '" + request.getExternalCourseTitle() + "' is already submitted and pending or approved.");
        }

        CourseApprovalRequest entity = new CourseApprovalRequest();
        entity.setEmployeeProfile(employeeProfile);
        entity.setExternalCourseTitle(request.getExternalCourseTitle().trim());
        entity.setExternalCourseProvider(request.getExternalCourseProvider().trim());
        entity.setExternalCourseUrl(request.getExternalCourseUrl());
        entity.setPrice(request.getPrice() != null ? request.getPrice() : java.math.BigDecimal.ZERO);
        entity.setDurationHours(request.getDurationHours() != null ? request.getDurationHours() : 10);
        entity.setDifficultyLevel(request.getDifficultyLevel() != null ? request.getDifficultyLevel() : "BEGINNER");
        entity.setRating(request.getRating() != null ? request.getRating() : new java.math.BigDecimal("4.50"));
        entity.setReason(request.getReason().trim());
        entity.setExpectedOutcome(request.getExpectedOutcome());
        entity.setPriority(request.getPriority() != null ? request.getPriority() : CourseRequestPriority.MEDIUM);
        entity.setStatus(CourseApprovalStatus.PENDING);
        entity.setTargetCompletionDate(request.getTargetCompletionDate());

        // Resolve catalog course if provided
        if (request.getCourseId() != null) {
            Course catalogCourse = courseRepository.findById(request.getCourseId()).orElse(null);
            entity.setCourse(catalogCourse);
        }

        // Resolve skill
        if (request.getTargetSkillId() != null) {
            Skill skill = skillRepository.findById(request.getTargetSkillId()).orElse(null);
            entity.setTargetSkill(skill);
            entity.setTargetSkillName(skill != null ? skill.getName() : request.getTargetSkillName());
        } else {
            entity.setTargetSkillName(request.getTargetSkillName());
        }

        CourseApprovalRequest saved = approvalRequestRepository.save(entity);
        return mapToDto(saved);
    }

    @Transactional
    public CourseApprovalRequestDto reviewRequest(Long requestId, ReviewCourseApprovalRequest reviewRequest) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User managerUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        CourseApprovalRequest request = approvalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("CourseApprovalRequest", "id", requestId));

        // Enforce departmental security check
        Long empDeptId = request.getEmployeeProfile().getUser().getDepartment() != null
                ? request.getEmployeeProfile().getUser().getDepartment().getId() : null;
        SecurityUtils.validateUserAccess(request.getEmployeeProfile().getUser().getId(), empDeptId);

        // Cannot review request if employee is reviewer themselves
        if (Objects.equals(request.getEmployeeProfile().getUser().getId(), currentUserId)) {
            throw new BadRequestException("Employees cannot approve or review their own course requests.");
        }

        request.setStatus(reviewRequest.getStatus());
        request.setManager(managerUser);
        request.setManagerComment(reviewRequest.getManagerComment());
        request.setReviewedAt(OffsetDateTime.now());

        if (reviewRequest.getTargetCompletionDate() != null) {
            request.setTargetCompletionDate(reviewRequest.getTargetCompletionDate());
        }

        // Alternative course suggestion
        if (reviewRequest.getAlternativeCourseId() != null) {
            Course alt = courseRepository.findById(reviewRequest.getAlternativeCourseId()).orElse(null);
            request.setAlternativeCourse(alt);
        }

        // Assign Mentor if selected
        if (reviewRequest.getRecommendedMentorProfileId() != null) {
            EmployeeProfile mentorProfile = employeeProfileRepository.findById(reviewRequest.getRecommendedMentorProfileId())
                    .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", reviewRequest.getRecommendedMentorProfileId()));
            request.setRecommendedMentor(mentorProfile);

            // Create or update mentor assignment if skill is identified
            if (request.getTargetSkill() != null) {
                Optional<MentorAssignment> existingAssign = mentorAssignmentRepository.findByMenteeIdAndMentorIdAndSkillIdAndStatusIn(
                        request.getEmployeeProfile().getId(),
                        mentorProfile.getId(),
                        request.getTargetSkill().getId(),
                        List.of(MentorAssignmentStatus.ACTIVE, MentorAssignmentStatus.APPROVED_BY_MANAGER, MentorAssignmentStatus.RECOMMENDED)
                );

                if (existingAssign.isEmpty()) {
                    MentorAssignment assignment = new MentorAssignment();
                    assignment.setMentee(request.getEmployeeProfile());
                    assignment.setMentor(mentorProfile);
                    assignment.setSkill(request.getTargetSkill());
                    assignment.setStatus(MentorAssignmentStatus.APPROVED_BY_MANAGER);
                    assignment.setManager(managerUser);
                    assignment.setAssignedAt(OffsetDateTime.now());
                    assignment.setNotes("Assigned by Manager during course approval for " + request.getExternalCourseTitle());
                    mentorAssignmentRepository.save(assignment);
                }
            }
        }

        // If APPROVED: Add to employee's learning path
        if (reviewRequest.getStatus() == CourseApprovalStatus.APPROVED) {
            integrateApprovedCourseToLearningPath(request);
        }

        CourseApprovalRequest saved = approvalRequestRepository.save(request);
        return mapToDto(saved);
    }

    @Transactional
    public CourseApprovalRequestDto withdrawRequest(Long requestId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        CourseApprovalRequest request = approvalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("CourseApprovalRequest", "id", requestId));

        // Ownership authorization check: only the employee who submitted or ADMIN can withdraw
        boolean isOwner = Objects.equals(request.getEmployeeProfile().getUser().getId(), currentUserId);
        if (!isOwner && !SecurityUtils.isAdmin()) {
            throw new org.springframework.security.access.AccessDeniedException("You are only authorized to withdraw your own course requests.");
        }

        // Only PENDING or CHANGES_REQUESTED can be withdrawn
        if (request.getStatus() != CourseApprovalStatus.PENDING && request.getStatus() != CourseApprovalStatus.CHANGES_REQUESTED) {
            throw new BadRequestException("Only pending course requests or requests requiring changes can be withdrawn. Current status: " + request.getStatus());
        }

        request.setStatus(CourseApprovalStatus.WITHDRAWN);
        request.setManagerComment(request.getManagerComment() != null 
                ? request.getManagerComment() + " [Withdrawn by employee]" 
                : "Withdrawn by employee");
        CourseApprovalRequest saved = approvalRequestRepository.save(request);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteRequest(Long requestId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        CourseApprovalRequest request = approvalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("CourseApprovalRequest", "id", requestId));

        boolean isOwner = Objects.equals(request.getEmployeeProfile().getUser().getId(), currentUserId);
        if (!isOwner && !SecurityUtils.isAdmin()) {
            throw new org.springframework.security.access.AccessDeniedException("You are only authorized to delete your own course requests.");
        }

        approvalRequestRepository.delete(request);
    }

    private void integrateApprovedCourseToLearningPath(CourseApprovalRequest request) {
        EmployeeProfile employeeProfile = request.getEmployeeProfile();

        // 1. Ensure course entity exists in catalog (or create external reference entry)
        Course targetCourse = request.getCourse();
        if (targetCourse == null) {
            targetCourse = new Course();
            targetCourse.setTitle(request.getExternalCourseTitle());
            targetCourse.setProvider(request.getExternalCourseProvider());
            targetCourse.setCourseUrl(request.getExternalCourseUrl());
            targetCourse.setDifficultyLevel(request.getDifficultyLevel() != null ? request.getDifficultyLevel() : "INTERMEDIATE");
            targetCourse.setDurationHours(request.getDurationHours() != null ? request.getDurationHours() : 15);
            targetCourse.setRating(request.getRating() != null ? request.getRating() : new java.math.BigDecimal("4.50"));
            targetCourse.setDescription("Approved external course: " + request.getReason());
            targetCourse = courseRepository.save(targetCourse);
            request.setCourse(targetCourse);
        }

        // 2. Find or create active learning path
        LearningPath learningPath = learningPathRepository.findByEmployeeProfileIdAndStatus(employeeProfile.getId(), "ACTIVE")
                .orElse(null);

        if (learningPath == null) {
            learningPath = new LearningPath();
            learningPath.setEmployeeProfile(employeeProfile);
            learningPath.setTargetJobRole(employeeProfile.getTargetJobRole() != null
                    ? employeeProfile.getTargetJobRole()
                    : employeeProfile.getCurrentJobRole());
            learningPath.setTitle((learningPath.getTargetJobRole() != null ? learningPath.getTargetJobRole().getTitle() : "Career") + " Upskilling Pathway");
            learningPath.setStatus("ACTIVE");
            learningPath = learningPathRepository.save(learningPath);
        }

        request.setLearningPath(learningPath);

        // 3. Add course to learning path if not already added
        Optional<LearningPathCourse> existingLpc = learningPathCourseRepository.findByLearningPathIdAndCourseId(
                learningPath.getId(), targetCourse.getId()
        );

        if (existingLpc.isEmpty()) {
            List<LearningPathCourse> existingCourses = learningPathCourseRepository.findByLearningPathIdOrderByStepOrderAsc(learningPath.getId());
            int stepOrder = existingCourses.stream().mapToInt(LearningPathCourse::getStepOrder).max().orElse(0) + 1;
            LearningPathCourse lpc = new LearningPathCourse();
            lpc.setLearningPath(learningPath);
            lpc.setCourse(targetCourse);
            lpc.setStepOrder(stepOrder);
            lpc.setStatus("IN_PROGRESS");
            lpc.setProgressPercentage(0);
            LearningPathCourse savedLpc = learningPathCourseRepository.save(lpc);
            request.setLearningPathCourse(savedLpc);
        } else {
            request.setLearningPathCourse(existingLpc.get());
        }
    }

    @Transactional(readOnly = true)
    public List<CourseApprovalRequestDto> getMyRequests() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));

        List<CourseApprovalRequest> list = approvalRequestRepository.findByEmployeeProfileIdOrderByCreatedAtDesc(profile.getId());
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PagedResponse<CourseApprovalRequestDto> getDepartmentRequests(
            CourseApprovalStatus status,
            Long employeeProfileId,
            Pageable pageable) {

        Long managerDeptId = SecurityUtils.getCurrentUserDepartmentId();
        if (SecurityUtils.isAdmin()) {
            managerDeptId = null; // Admin sees all
        }

        Page<CourseApprovalRequest> page = approvalRequestRepository.findRequestsFiltered(
                status, managerDeptId, employeeProfileId, pageable
        );

        Page<CourseApprovalRequestDto> dtoPage = page.map(this::mapToDto);
        return PagedResponse.from(dtoPage);
    }

    @Transactional(readOnly = true)
    public CourseApprovalRequestDto getRequestById(Long id) {
        CourseApprovalRequest request = approvalRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CourseApprovalRequest", "id", id));

        Long empDeptId = request.getEmployeeProfile().getUser().getDepartment() != null
                ? request.getEmployeeProfile().getUser().getDepartment().getId() : null;
        SecurityUtils.validateUserAccess(request.getEmployeeProfile().getUser().getId(), empDeptId);

        return mapToDto(request);
    }

    private CourseApprovalRequestDto mapToDto(CourseApprovalRequest r) {
        CourseApprovalRequestDto dto = new CourseApprovalRequestDto();
        dto.setId(r.getId());
        dto.setEmployeeProfileId(r.getEmployeeProfile().getId());
        dto.setEmployeeUserId(r.getEmployeeProfile().getUser().getId());
        dto.setEmployeeFullName(r.getEmployeeProfile().getUser().getFullName());
        dto.setEmployeeEmail(r.getEmployeeProfile().getUser().getEmail());

        if (r.getEmployeeProfile().getUser().getDepartment() != null) {
            dto.setDepartmentId(r.getEmployeeProfile().getUser().getDepartment().getId());
            dto.setDepartmentName(r.getEmployeeProfile().getUser().getDepartment().getName());
        }

        if (r.getEmployeeProfile().getCurrentJobRole() != null) {
            dto.setEmployeeRoleTitle(r.getEmployeeProfile().getCurrentJobRole().getTitle());
        }

        dto.setCourseId(r.getCourse() != null ? r.getCourse().getId() : null);
        dto.setExternalCourseTitle(r.getExternalCourseTitle());
        dto.setExternalCourseProvider(r.getExternalCourseProvider());
        dto.setExternalCourseUrl(r.getExternalCourseUrl());
        dto.setPrice(r.getPrice());
        dto.setDurationHours(r.getDurationHours());
        dto.setDifficultyLevel(r.getDifficultyLevel());
        dto.setRating(r.getRating());

        dto.setTargetSkillId(r.getTargetSkill() != null ? r.getTargetSkill().getId() : null);
        dto.setTargetSkillName(r.getTargetSkillName());

        dto.setReason(r.getReason());
        dto.setExpectedOutcome(r.getExpectedOutcome());
        dto.setPriority(r.getPriority());
        dto.setStatus(r.getStatus());

        if (r.getManager() != null) {
            dto.setManagerId(r.getManager().getId());
            dto.setManagerFullName(r.getManager().getFullName());
        }
        dto.setManagerComment(r.getManagerComment());

        if (r.getAlternativeCourse() != null) {
            dto.setAlternativeCourseId(r.getAlternativeCourse().getId());
            dto.setAlternativeCourseTitle(r.getAlternativeCourse().getTitle());
        }

        if (r.getRecommendedMentor() != null) {
            dto.setRecommendedMentorId(r.getRecommendedMentor().getId());
            dto.setRecommendedMentorFullName(r.getRecommendedMentor().getUser().getFullName());
        }

        dto.setTargetCompletionDate(r.getTargetCompletionDate());
        dto.setLearningPathId(r.getLearningPath() != null ? r.getLearningPath().getId() : null);
        dto.setLearningPathCourseId(r.getLearningPathCourse() != null ? r.getLearningPathCourse().getId() : null);

        dto.setCreatedAt(r.getCreatedAt());
        dto.setUpdatedAt(r.getUpdatedAt());
        dto.setReviewedAt(r.getReviewedAt());

        // Extract skill gap info for the target skill
        if (r.getTargetSkill() != null) {
            try {
                SkillGapReportDto report = skillGapService.generateReport(r.getEmployeeProfile());
                if (report != null && report.getSkillGaps() != null) {
                    report.getSkillGaps().stream()
                            .filter(g -> g.getSkillId().equals(r.getTargetSkill().getId()))
                            .findFirst()
                            .ifPresent(item -> {
                                dto.setCurrentVerifiedProficiency(item.getVerifiedProficiency());
                                dto.setRequiredProficiencyLevel(item.getRequiredProficiency());
                                dto.setSkillGap(item.getRawGap());
                            });
                }
            } catch (Exception ignored) {}
        }

        return dto;
    }
}
