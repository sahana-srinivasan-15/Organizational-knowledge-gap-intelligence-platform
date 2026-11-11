package com.orgkgi.service;

import com.orgkgi.dto.mentoring.CreateMentoringSessionRequest;
import com.orgkgi.dto.mentoring.CreateMilestoneRequest;
import com.orgkgi.dto.mentoring.LearningMilestoneDto;
import com.orgkgi.dto.mentoring.MentoringSessionDto;
import com.orgkgi.entity.*;
import com.orgkgi.exception.BadRequestException;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.repository.*;
import com.orgkgi.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class MentoringTrackingService {

    private final MentoringSessionRepository sessionRepository;
    private final LearningMilestoneRepository milestoneRepository;
    private final MentorAssignmentRepository assignmentRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final UserRepository userRepository;
    private final LearningPathCourseRepository learningPathCourseRepository;

    public MentoringTrackingService(
            MentoringSessionRepository sessionRepository,
            LearningMilestoneRepository milestoneRepository,
            MentorAssignmentRepository assignmentRepository,
            EmployeeProfileRepository employeeProfileRepository,
            UserRepository userRepository,
            LearningPathCourseRepository learningPathCourseRepository) {
        this.sessionRepository = sessionRepository;
        this.milestoneRepository = milestoneRepository;
        this.assignmentRepository = assignmentRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.userRepository = userRepository;
        this.learningPathCourseRepository = learningPathCourseRepository;
    }

    @Transactional(readOnly = true)
    public List<MentoringSessionDto> getSessionsForAssignment(Long assignmentId) {
        MentorAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("MentorAssignment", "id", assignmentId));

        validateMentorshipParticipantAccess(assignment);

        return sessionRepository.findByMentorAssignmentIdOrderBySessionDateDesc(assignmentId)
                .stream().map(this::mapToSessionDto).collect(Collectors.toList());
    }

    @Transactional
    public MentoringSessionDto createSession(CreateMentoringSessionRequest request) {
        MentorAssignment assignment = assignmentRepository.findById(request.getMentorAssignmentId())
                .orElseThrow(() -> new ResourceNotFoundException("MentorAssignment", "id", request.getMentorAssignmentId()));

        validateMentorAccess(assignment);

        MentoringSession session = new MentoringSession();
        session.setMentorAssignment(assignment);
        session.setTopic(request.getTopic().trim());
        session.setSessionDate(request.getSessionDate());
        session.setDurationMinutes(request.getDurationMinutes() != null ? request.getDurationMinutes() : 45);
        session.setNotes(request.getNotes());
        session.setFeedback(request.getFeedback());
        session.setActionItems(request.getActionItems());
        session.setStatus(request.getStatus() != null ? request.getStatus() : "COMPLETED");
        session.setNextSessionDate(request.getNextSessionDate());

        MentoringSession saved = sessionRepository.save(session);
        return mapToSessionDto(saved);
    }

    @Transactional(readOnly = true)
    public List<LearningMilestoneDto> getMilestonesForAssignment(Long assignmentId) {
        MentorAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("MentorAssignment", "id", assignmentId));

        validateMentorshipParticipantAccess(assignment);

        return milestoneRepository.findByMentorAssignmentIdOrderByTargetDateAsc(assignmentId)
                .stream().map(this::mapToMilestoneDto).collect(Collectors.toList());
    }

    @Transactional
    public LearningMilestoneDto createMilestone(CreateMilestoneRequest request) {
        MentorAssignment assignment = null;
        if (request.getMentorAssignmentId() != null) {
            assignment = assignmentRepository.findById(request.getMentorAssignmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("MentorAssignment", "id", request.getMentorAssignmentId()));
            validateMentorAccess(assignment);
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        LearningMilestone milestone = new LearningMilestone();
        milestone.setMentorAssignment(assignment);
        milestone.setTitle(request.getTitle().trim());
        milestone.setDescription(request.getDescription());
        milestone.setTargetDate(request.getTargetDate());
        milestone.setStatus("PENDING");
        milestone.setCreatedByUser(currentUser);

        if (request.getLearningPathCourseId() != null) {
            LearningPathCourse lpc = learningPathCourseRepository.findById(request.getLearningPathCourseId()).orElse(null);
            milestone.setLearningPathCourse(lpc);
        }

        LearningMilestone saved = milestoneRepository.save(milestone);
        return mapToMilestoneDto(saved);
    }

    @Transactional
    public LearningMilestoneDto toggleMilestoneStatus(Long milestoneId, String newStatus) {
        LearningMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("LearningMilestone", "id", milestoneId));

        if (milestone.getMentorAssignment() != null) {
            validateMentorshipParticipantAccess(milestone.getMentorAssignment());
        }

        milestone.setStatus(newStatus != null ? newStatus.toUpperCase() : "COMPLETED");
        if ("COMPLETED".equalsIgnoreCase(newStatus)) {
            milestone.setCompletedDate(LocalDate.now());
        } else {
            milestone.setCompletedDate(null);
        }

        LearningMilestone saved = milestoneRepository.save(milestone);
        return mapToMilestoneDto(saved);
    }

    private void validateMentorAccess(MentorAssignment assignment) {
        if (SecurityUtils.isAdmin()) return;
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Long mentorUserId = assignment.getMentor().getUser().getId();
        if (!Objects.equals(currentUserId, mentorUserId)) {
            throw new BadRequestException("Only the assigned mentor or an administrator can record mentoring sessions or define milestones.");
        }
    }

    private void validateMentorshipParticipantAccess(MentorAssignment assignment) {
        if (SecurityUtils.isAdmin()) return;
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Long mentorUserId = assignment.getMentor().getUser().getId();
        Long menteeUserId = assignment.getMentee().getUser().getId();

        if (Objects.equals(currentUserId, mentorUserId) || Objects.equals(currentUserId, menteeUserId)) {
            return;
        }

        // Manager in same department
        Long managerDeptId = SecurityUtils.getCurrentUserDepartmentId();
        Long menteeDeptId = assignment.getMentee().getUser().getDepartment() != null
                ? assignment.getMentee().getUser().getDepartment().getId() : null;

        if (SecurityUtils.isManager() && Objects.equals(managerDeptId, menteeDeptId)) {
            return;
        }

        throw new BadRequestException("Unauthorized: You do not have permission to view or manage this mentorship record.");
    }

    private MentoringSessionDto mapToSessionDto(MentoringSession s) {
        MentoringSessionDto dto = new MentoringSessionDto();
        dto.setId(s.getId());
        dto.setMentorAssignmentId(s.getMentorAssignment().getId());
        dto.setMenteeProfileId(s.getMentorAssignment().getMentee().getId());
        dto.setMenteeFullName(s.getMentorAssignment().getMentee().getUser().getFullName());
        dto.setMentorProfileId(s.getMentorAssignment().getMentor().getId());
        dto.setMentorFullName(s.getMentorAssignment().getMentor().getUser().getFullName());
        dto.setSkillName(s.getMentorAssignment().getSkill() != null ? s.getMentorAssignment().getSkill().getName() : "Mentorship");
        dto.setTopic(s.getTopic());
        dto.setSessionDate(s.getSessionDate());
        dto.setDurationMinutes(s.getDurationMinutes());
        dto.setNotes(s.getNotes());
        dto.setFeedback(s.getFeedback());
        dto.setActionItems(s.getActionItems());
        dto.setStatus(s.getStatus());
        dto.setNextSessionDate(s.getNextSessionDate());
        dto.setCreatedAt(s.getCreatedAt());
        return dto;
    }

    private LearningMilestoneDto mapToMilestoneDto(LearningMilestone m) {
        LearningMilestoneDto dto = new LearningMilestoneDto();
        dto.setId(m.getId());
        dto.setMentorAssignmentId(m.getMentorAssignment() != null ? m.getMentorAssignment().getId() : null);
        dto.setLearningPathCourseId(m.getLearningPathCourse() != null ? m.getLearningPathCourse().getId() : null);
        dto.setTitle(m.getTitle());
        dto.setDescription(m.getDescription());
        dto.setTargetDate(m.getTargetDate());
        dto.setCompletedDate(m.getCompletedDate());
        dto.setStatus(m.getStatus());
        if (m.getCreatedByUser() != null) {
            dto.setCreatedByUserId(m.getCreatedByUser().getId());
            dto.setCreatedByFullName(m.getCreatedByUser().getFullName());
        }
        dto.setCreatedAt(m.getCreatedAt());
        return dto;
    }
}
