package com.orgkgi.service;

import com.orgkgi.dto.manager.ManagerOverviewDto;
import com.orgkgi.dto.manager.TeamMemberProgressDto;
import com.orgkgi.dto.manager.TeamSkillGapSummaryDto;
import com.orgkgi.dto.skillgap.SkillGapItemDto;
import com.orgkgi.dto.skillgap.SkillGapReportDto;
import com.orgkgi.entity.*;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.repository.*;
import com.orgkgi.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ManagerAnalyticsService {

    private final UserRepository userRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final CourseApprovalRequestRepository approvalRequestRepository;
    private final LearningPathRepository learningPathRepository;
    private final LearningPathCourseRepository learningPathCourseRepository;
    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final CourseSkillRepository courseSkillRepository;
    private final SkillGapService skillGapService;

    public ManagerAnalyticsService(
            UserRepository userRepository,
            EmployeeProfileRepository employeeProfileRepository,
            CourseApprovalRequestRepository approvalRequestRepository,
            LearningPathRepository learningPathRepository,
            LearningPathCourseRepository learningPathCourseRepository,
            MentorAssignmentRepository mentorAssignmentRepository,
            CourseSkillRepository courseSkillRepository,
            SkillGapService skillGapService) {
        this.userRepository = userRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.approvalRequestRepository = approvalRequestRepository;
        this.learningPathRepository = learningPathRepository;
        this.learningPathCourseRepository = learningPathCourseRepository;
        this.mentorAssignmentRepository = mentorAssignmentRepository;
        this.courseSkillRepository = courseSkillRepository;
        this.skillGapService = skillGapService;
    }

    @Transactional(readOnly = true)
    public ManagerOverviewDto getDepartmentOverview() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        Long deptId = currentUser.getDepartment() != null ? currentUser.getDepartment().getId() : 1L;
        String deptName = currentUser.getDepartment() != null ? currentUser.getDepartment().getName() : "Engineering";

        ManagerOverviewDto overview = new ManagerOverviewDto();
        overview.setDepartmentId(deptId);
        overview.setDepartmentName(deptName);

        // Fetch team members in department (role = EMPLOYEE or MENTOR)
        List<User> departmentUsers = userRepository.findAll().stream()
                .filter(u -> u.getDepartment() != null && u.getDepartment().getId().equals(deptId))
                .filter(u -> u.getRole() == Role.EMPLOYEE || u.getRole() == Role.MENTOR)
                .collect(Collectors.toList());

        overview.setTotalManagedEmployees(departmentUsers.size());

        // Count course approval requests
        long pending = approvalRequestRepository.countByDepartmentIdAndStatus(deptId, CourseApprovalStatus.PENDING);
        long approved = approvalRequestRepository.countByDepartmentIdAndStatus(deptId, CourseApprovalStatus.APPROVED);
        long rejected = approvalRequestRepository.countByDepartmentIdAndStatus(deptId, CourseApprovalStatus.REJECTED);

        overview.setPendingCourseRequests(pending);
        overview.setApprovedCourseRequests(approved);
        overview.setRejectedCourseRequests(rejected);

        Map<String, Long> statusMap = new HashMap<>();
        statusMap.put("PENDING", pending);
        statusMap.put("APPROVED", approved);
        statusMap.put("REJECTED", rejected);
        overview.setRequestStatusDistribution(statusMap);

        // Build individual member progress and team skill gap aggregations
        List<TeamMemberProgressDto> memberDtos = new ArrayList<>();
        Map<Long, List<SkillGapItemDto>> gapsPerSkill = new HashMap<>();
        long currentlyLearningCount = 0;
        long fallingBehindCount = 0;
        long completedCoursesCount = 0;

        for (User member : departmentUsers) {
            EmployeeProfile profile = employeeProfileRepository.findByUserId(member.getId()).orElse(null);
            if (profile == null) continue;

            TeamMemberProgressDto mDto = new TeamMemberProgressDto();
            mDto.setEmployeeProfileId(profile.getId());
            mDto.setUserId(member.getId());
            mDto.setFullName(member.getFullName());
            mDto.setEmail(member.getEmail());
            mDto.setCurrentRoleTitle(profile.getCurrentJobRole() != null ? profile.getCurrentJobRole().getTitle() : "Member");
            mDto.setTargetRoleTitle(profile.getTargetJobRole() != null ? profile.getTargetJobRole().getTitle() : "Career Target");

            // Evaluate skill gaps
            try {
                SkillGapReportDto gapReport = skillGapService.generateReport(profile);
                if (gapReport != null) {
                    mDto.setReadinessScorePercentage(gapReport.getReadinessScorePercentage());
                    mDto.setVerifiedSkillsCount(gapReport.getVerifiedSkillsCount());
                    mDto.setGapSkillsCount(gapReport.getGapSkillsCount());

                    for (SkillGapItemDto gapItem : gapReport.getSkillGaps()) {
                        if (gapItem.getRawGap() != null && gapItem.getRawGap() > 0) {
                            gapsPerSkill.computeIfAbsent(gapItem.getSkillId(), k -> new ArrayList<>()).add(gapItem);
                        }
                    }
                }
            } catch (Exception ignored) {}

            // Evaluate active learning path
            Optional<LearningPath> pathOpt = learningPathRepository.findByEmployeeProfileIdAndStatus(profile.getId(), "ACTIVE");
            if (pathOpt.isPresent()) {
                LearningPath path = pathOpt.get();
                List<LearningPathCourse> courses = path.getLearningPathCourses();
                if (courses != null && !courses.isEmpty()) {
                    currentlyLearningCount++;
                    mDto.setActiveCoursesCount((int) courses.stream().filter(c -> "IN_PROGRESS".equalsIgnoreCase(c.getStatus())).count());

                    double avgProgress = courses.stream().mapToInt(LearningPathCourse::getProgressPercentage).average().orElse(0.0);
                    mDto.setOverallLearningProgressPercentage((int) Math.round(avgProgress));

                    long completed = courses.stream().filter(c -> "COMPLETED".equalsIgnoreCase(c.getStatus())).count();
                    completedCoursesCount += completed;

                    if (avgProgress >= 80.0) {
                        mDto.setCurrentLearningStatus("COMPLETED");
                    } else if (avgProgress < 25.0) {
                        mDto.setCurrentLearningStatus("FALLING_BEHIND");
                        fallingBehindCount++;
                    } else {
                        mDto.setCurrentLearningStatus("ON_TRACK");
                    }
                } else {
                    mDto.setActiveCoursesCount(0);
                    mDto.setOverallLearningProgressPercentage(0);
                    mDto.setCurrentLearningStatus("NOT_STARTED");
                }
            } else {
                mDto.setActiveCoursesCount(0);
                mDto.setOverallLearningProgressPercentage(0);
                mDto.setCurrentLearningStatus("NOT_STARTED");
            }

            // Assigned mentor lookup
            List<MentorAssignment> activeAssignments = mentorAssignmentRepository.findByMenteeIdAndStatus(profile.getId(), MentorAssignmentStatus.ACTIVE);
            if (!activeAssignments.isEmpty()) {
                mDto.setAssignedMentorName(activeAssignments.get(0).getMentor().getUser().getFullName());
            }

            memberDtos.add(mDto);
        }

        overview.setTeamMembers(memberDtos);
        overview.setEmployeesCurrentlyLearning(currentlyLearningCount);
        overview.setEmployeesFallingBehind(fallingBehindCount);
        overview.setTotalCompletedCourses(completedCoursesCount);

        // Compute priority skill gaps across team
        List<TeamSkillGapSummaryDto> teamGaps = new ArrayList<>();
        List<CourseSkill> allCourseSkills = courseSkillRepository.findAll();

        for (Map.Entry<Long, List<SkillGapItemDto>> entry : gapsPerSkill.entrySet()) {
            List<SkillGapItemDto> items = entry.getValue();
            if (items.isEmpty()) continue;

            SkillGapItemDto first = items.get(0);
            TeamSkillGapSummaryDto gapSummary = new TeamSkillGapSummaryDto();
            gapSummary.setSkillId(first.getSkillId());
            gapSummary.setSkillName(first.getSkillName());
            gapSummary.setSkillCode(first.getSkillCode());
            gapSummary.setCategoryName(first.getCategoryName());
            gapSummary.setAffectedEmployeesCount(items.size());

            double avgGap = items.stream().mapToInt(SkillGapItemDto::getRawGap).average().orElse(0.0);
            gapSummary.setAverageGapMagnitude(Math.round(avgGap * 10.0) / 10.0);

            if (items.size() >= 2 || avgGap >= 2.5) {
                gapSummary.setPriorityLevel("HIGH");
            } else {
                gapSummary.setPriorityLevel("MEDIUM");
            }

            // Find best course mapping for this skill
            allCourseSkills.stream()
                    .filter(cs -> cs.getSkill().getId().equals(first.getSkillId()))
                    .findFirst()
                    .ifPresent(cs -> {
                        gapSummary.setRecommendedCourseId(cs.getCourse().getId());
                        gapSummary.setRecommendedCourseTitle(cs.getCourse().getTitle());
                    });

            teamGaps.add(gapSummary);
        }

        teamGaps.sort((a, b) -> Integer.compare(b.getAffectedEmployeesCount(), a.getAffectedEmployeesCount()));
        overview.setPrioritySkillGaps(teamGaps);

        return overview;
    }
}
