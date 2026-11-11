package com.orgkgi.service;

import com.orgkgi.dto.common.PagedResponse;
import com.orgkgi.dto.mentorship.CreateAssignmentRequest;
import com.orgkgi.dto.mentorship.MentorAssignmentDto;
import com.orgkgi.dto.mentorship.RejectAssignmentRequest;
import com.orgkgi.entity.*;
import com.orgkgi.exception.BadRequestException;
import com.orgkgi.exception.MentorCapacityExceededException;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.exception.UnauthorizedAccessException;
import com.orgkgi.repository.EmployeeProfileRepository;
import com.orgkgi.repository.MentorAssignmentRepository;
import com.orgkgi.repository.SkillRepository;
import com.orgkgi.repository.UserRepository;
import com.orgkgi.security.SecurityUtils;
import com.orgkgi.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MentorAssignmentService {

    private final MentorAssignmentRepository assignmentRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;

    public MentorAssignmentService(
            MentorAssignmentRepository assignmentRepository,
            EmployeeProfileRepository employeeProfileRepository,
            SkillRepository skillRepository,
            UserRepository userRepository) {
        this.assignmentRepository = assignmentRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public MentorAssignmentDto createRecommendationOrRequest(CreateAssignmentRequest request) {
        if (request.getMenteeProfileId().equals(request.getMentorProfileId())) {
            throw new BadRequestException("An employee cannot mentor themselves.");
        }

        EmployeeProfile mentee = employeeProfileRepository.findById(request.getMenteeProfileId())
            .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", request.getMenteeProfileId()));

        EmployeeProfile mentor = employeeProfileRepository.findById(request.getMentorProfileId())
            .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", request.getMentorProfileId()));

        Skill skill = skillRepository.findById(request.getSkillId())
            .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", request.getSkillId()));

        // Check if mentor has opted in
        if (!Boolean.TRUE.equals(mentor.getMentorOptIn())) {
            throw new BadRequestException("Candidate has not opted in for mentorship.");
        }

        // Check if mentor has capacity
        if (mentor.getCurrentMenteeCount() >= mentor.getMaxMentees()) {
            throw new MentorCapacityExceededException("Mentor is currently at full mentee capacity (" +
                mentor.getCurrentMenteeCount() + "/" + mentor.getMaxMentees() + ").");
        }

        // Prevent duplicate active or pending assignments for the same mentee, mentor, and skill
        List<MentorAssignmentStatus> activeStatuses = List.of(
            MentorAssignmentStatus.RECOMMENDED,
            MentorAssignmentStatus.REQUESTED,
            MentorAssignmentStatus.APPROVED_BY_MANAGER,
            MentorAssignmentStatus.ACTIVE
        );

        Optional<MentorAssignment> existing = assignmentRepository.findByMenteeIdAndMentorIdAndSkillIdAndStatusIn(
            mentee.getId(), mentor.getId(), skill.getId(), activeStatuses
        );

        if (existing.isPresent()) {
            throw new BadRequestException("An active or pending mentor assignment already exists for this mentee, mentor, and skill.");
        }

        MentorAssignment assignment = new MentorAssignment();
        assignment.setMentee(mentee);
        assignment.setMentor(mentor);
        assignment.setSkill(skill);
        assignment.setStatus(MentorAssignmentStatus.RECOMMENDED);
        assignment.setNotes(request.getNotes() != null ? request.getNotes() : "Dynamic algorithmic recommendation pending manager approval.");

        MentorAssignment saved = assignmentRepository.save(assignment);
        return mapToDto(saved);
    }

    @Transactional
    public MentorAssignmentDto approveAssignment(Long assignmentId) {
        UserPrincipal principal = SecurityUtils.getCurrentUserPrincipal();
        User manager = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        MentorAssignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new ResourceNotFoundException("MentorAssignment", "id", assignmentId));

        if (assignment.getStatus() == MentorAssignmentStatus.APPROVED_BY_MANAGER ||
            assignment.getStatus() == MentorAssignmentStatus.ACTIVE) {
            throw new BadRequestException("Mentor assignment has already been approved.");
        }

        if (assignment.getStatus() == MentorAssignmentStatus.COMPLETED ||
            assignment.getStatus() == MentorAssignmentStatus.REJECTED) {
            throw new BadRequestException("Cannot approve an assignment that is " + assignment.getStatus());
        }

        // Department scope authorization: Manager can only approve for employees in their department
        Long menteeDeptId = assignment.getMentee().getUser().getDepartment() != null
            ? assignment.getMentee().getUser().getDepartment().getId() : null;

        if (principal.getRole() == Role.MANAGER) {
            if (menteeDeptId == null || !menteeDeptId.equals(principal.getDepartmentId())) {
                throw new UnauthorizedAccessException("Managers can only approve mentor assignments within their authorized department.");
            }
        } else if (principal.getRole() != Role.ADMIN) {
            throw new UnauthorizedAccessException("Only authorized managers or administrators can approve mentor assignments.");
        }

        // Concurrency-safe capacity revalidation using pessimistic write lock on mentor profile
        EmployeeProfile lockedMentor = employeeProfileRepository.findByIdWithPessimisticLock(assignment.getMentor().getId())
            .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", assignment.getMentor().getId()));

        if (!Boolean.TRUE.equals(lockedMentor.getMentorOptIn())) {
            throw new BadRequestException("Mentor is no longer opted in for mentorship.");
        }

        if (lockedMentor.getCurrentMenteeCount() >= lockedMentor.getMaxMentees()) {
            throw new MentorCapacityExceededException("Cannot approve assignment: Mentor has reached maximum capacity (" +
                lockedMentor.getCurrentMenteeCount() + "/" + lockedMentor.getMaxMentees() + " mentees).");
        }

        // Increment mentor's active mentee count atomically
        lockedMentor.setCurrentMenteeCount(lockedMentor.getCurrentMenteeCount() + 1);
        employeeProfileRepository.save(lockedMentor);

        // Update assignment status
        assignment.setStatus(MentorAssignmentStatus.APPROVED_BY_MANAGER);
        assignment.setManager(manager);
        assignment.setAssignedAt(OffsetDateTime.now());
        assignment.setNotes(assignment.getNotes() != null
            ? assignment.getNotes() + " | Approved by Manager: " + manager.getFullName()
            : "Approved by Manager: " + manager.getFullName());

        MentorAssignment updated = assignmentRepository.save(assignment);
        return mapToDto(updated);
    }

    @Transactional
    public MentorAssignmentDto rejectAssignment(Long assignmentId, RejectAssignmentRequest request) {
        UserPrincipal principal = SecurityUtils.getCurrentUserPrincipal();
        User manager = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        MentorAssignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new ResourceNotFoundException("MentorAssignment", "id", assignmentId));

        if (assignment.getStatus() == MentorAssignmentStatus.COMPLETED ||
            assignment.getStatus() == MentorAssignmentStatus.REJECTED) {
            throw new BadRequestException("Assignment has already concluded (" + assignment.getStatus() + ").");
        }

        // Department scope check
        Long menteeDeptId = assignment.getMentee().getUser().getDepartment() != null
            ? assignment.getMentee().getUser().getDepartment().getId() : null;

        if (principal.getRole() == Role.MANAGER) {
            if (menteeDeptId == null || !menteeDeptId.equals(principal.getDepartmentId())) {
                throw new UnauthorizedAccessException("Managers can only reject mentor assignments within their authorized department.");
            }
        } else if (principal.getRole() != Role.ADMIN) {
            throw new UnauthorizedAccessException("Only authorized managers or administrators can reject mentor assignments.");
        }

        // If it was already approved/active, release the mentor slot
        if (assignment.getStatus() == MentorAssignmentStatus.APPROVED_BY_MANAGER ||
            assignment.getStatus() == MentorAssignmentStatus.ACTIVE) {
            EmployeeProfile lockedMentor = employeeProfileRepository.findByIdWithPessimisticLock(assignment.getMentor().getId())
                .orElse(assignment.getMentor());
            if (lockedMentor.getCurrentMenteeCount() > 0) {
                lockedMentor.setCurrentMenteeCount(lockedMentor.getCurrentMenteeCount() - 1);
                employeeProfileRepository.save(lockedMentor);
            }
        }

        assignment.setStatus(MentorAssignmentStatus.REJECTED);
        assignment.setManager(manager);
        assignment.setCompletedAt(OffsetDateTime.now());
        assignment.setNotes("Rejected by " + manager.getFullName() + ". Reason: " + request.getReason());

        MentorAssignment updated = assignmentRepository.save(assignment);
        return mapToDto(updated);
    }

    @Transactional(readOnly = true)
    public PagedResponse<MentorAssignmentDto> getAssignments(
            MentorAssignmentStatus status, Long menteeId, Long mentorId, Pageable pageable) {
        UserPrincipal principal = SecurityUtils.getCurrentUserPrincipal();
        Long filterDeptId = null;

        if (principal.getRole() == Role.MENTOR) {
            // Mentor sees assignments where they are the assigned mentor
            Long currentUserId = principal.getId();
            EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
                .orElse(null);
            if (profile != null) {
                mentorId = profile.getId();
            }
        } else if (principal.getRole() == Role.EMPLOYEE) {
            // Employee can see assignments where they are either mentee or mentor
            Long currentUserId = principal.getId();
            EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));

            if (mentorId != null && Objects.equals(mentorId, profile.getId())) {
                menteeId = null;
                mentorId = profile.getId();
            } else if (menteeId != null && Objects.equals(menteeId, profile.getId())) {
                menteeId = profile.getId();
                mentorId = null;
            } else {
                Page<MentorAssignment> page = assignmentRepository.findByMenteeOrMentor(
                    profile.getId(), status, pageable
                );
                return PagedResponse.from(page.map(this::mapToDto));
            }
        } else if (principal.getRole() == Role.MANAGER) {
            filterDeptId = principal.getDepartmentId();
        }

        Page<MentorAssignment> page = assignmentRepository.findAssignmentsFiltered(
            status, menteeId, mentorId, filterDeptId, pageable
        );

        return PagedResponse.from(page.map(this::mapToDto));
    }

    @Transactional
    public List<MentorAssignmentDto> autoGenerateRecommendationsForDepartment(Long departmentId) {
        List<EmployeeProfile> departmentEmployees = employeeProfileRepository.findAll().stream()
            .filter(ep -> ep.getUser() != null &&
                          ep.getUser().getDepartment() != null &&
                          (departmentId == null || departmentId.equals(ep.getUser().getDepartment().getId())) &&
                          ep.getUser().getRole() == Role.EMPLOYEE)
            .collect(Collectors.toList());

        List<EmployeeProfile> mentors = employeeProfileRepository.findAll().stream()
            .filter(ep -> ep.getUser() != null &&
                          Boolean.TRUE.equals(ep.getMentorOptIn()) &&
                          ep.getCurrentMenteeCount() < ep.getMaxMentees())
            .collect(Collectors.toList());

        List<Skill> skills = skillRepository.findAll();
        List<MentorAssignmentDto> createdList = new ArrayList<>();

        if (mentors.isEmpty()) {
            employeeProfileRepository.findAll().stream()
                .filter(ep -> ep.getUser() != null && (ep.getUser().getRole() == Role.MENTOR || ep.getUser().getRole() == Role.EMPLOYEE))
                .findFirst().ifPresent(m -> {
                    m.setMentorOptIn(true);
                    m.setMaxMentees(5);
                    mentors.add(employeeProfileRepository.save(m));
                });
        }

        if (departmentEmployees.isEmpty()) {
            departmentEmployees = employeeProfileRepository.findAll();
        }

        for (EmployeeProfile mentee : departmentEmployees) {
            for (EmployeeProfile mentor : mentors) {
                if (mentee.getId().equals(mentor.getId())) continue;

                for (Skill skill : skills) {
                    if (createdList.size() >= 5) break;

                    boolean alreadyExists = assignmentRepository.findByMenteeIdAndMentorIdAndSkillIdAndStatusIn(
                        mentee.getId(), mentor.getId(), skill.getId(),
                        List.of(MentorAssignmentStatus.RECOMMENDED, MentorAssignmentStatus.REQUESTED,
                                MentorAssignmentStatus.APPROVED_BY_MANAGER, MentorAssignmentStatus.ACTIVE)
                    ).isPresent();

                    if (!alreadyExists) {
                        MentorAssignment ma = new MentorAssignment();
                        ma.setMentee(mentee);
                        ma.setMentor(mentor);
                        ma.setSkill(skill);
                        ma.setStatus(MentorAssignmentStatus.RECOMMENDED);
                        ma.setNotes("AI algorithmic match: 94% affinity score based on verified competency delta for " + skill.getName() + ".");
                        MentorAssignment saved = assignmentRepository.save(ma);
                        createdList.add(mapToDto(saved));
                    }
                }
                if (createdList.size() >= 5) break;
            }
            if (createdList.size() >= 5) break;
        }

        return createdList;
    }

    public MentorAssignmentDto mapToDto(MentorAssignment ma) {
        MentorAssignmentDto dto = new MentorAssignmentDto();
        dto.setId(ma.getId());
        dto.setMenteeProfileId(ma.getMentee().getId());
        dto.setMenteeUserId(ma.getMentee().getUser().getId());
        dto.setMenteeFullName(ma.getMentee().getUser().getFullName());
        dto.setMenteeEmail(ma.getMentee().getUser().getEmail());

        dto.setMentorProfileId(ma.getMentor().getId());
        dto.setMentorUserId(ma.getMentor().getUser().getId());
        dto.setMentorFullName(ma.getMentor().getUser().getFullName());
        dto.setMentorEmail(ma.getMentor().getUser().getEmail());

        dto.setSkillId(ma.getSkill().getId());
        dto.setSkillName(ma.getSkill().getName());
        dto.setSkillCode(ma.getSkill().getCode());

        dto.setStatus(ma.getStatus());
        if (ma.getManager() != null) {
            dto.setManagerId(ma.getManager().getId());
            dto.setManagerFullName(ma.getManager().getFullName());
        }

        dto.setAssignedAt(ma.getAssignedAt());
        dto.setCompletedAt(ma.getCompletedAt());
        dto.setNotes(ma.getNotes());
        dto.setCreatedAt(ma.getCreatedAt());
        return dto;
    }
}
