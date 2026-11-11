package com.orgkgi.service;

import com.orgkgi.dto.course.*;
import com.orgkgi.dto.skillgap.SkillGapItemDto;
import com.orgkgi.dto.skillgap.SkillGapReportDto;
import com.orgkgi.entity.*;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.repository.*;
import com.orgkgi.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CourseRecommendationService {

    private static final Logger log = LoggerFactory.getLogger(CourseRecommendationService.class);

    private final CourseRepository courseRepository;
    private final CourseSkillRepository courseSkillRepository;
    private final LearningPathCourseRepository learningPathCourseRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final SkillGapService skillGapService;
    private final CourseRecommendationRepository courseRecommendationRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public CourseRecommendationService(
            CourseRepository courseRepository,
            CourseSkillRepository courseSkillRepository,
            LearningPathCourseRepository learningPathCourseRepository,
            EmployeeProfileRepository employeeProfileRepository,
            SkillGapService skillGapService,
            CourseRecommendationRepository courseRecommendationRepository,
            NotificationRepository notificationRepository,
            UserRepository userRepository) {
        this.courseRepository = courseRepository;
        this.courseSkillRepository = courseSkillRepository;
        this.learningPathCourseRepository = learningPathCourseRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.skillGapService = skillGapService;
        this.courseRecommendationRepository = courseRecommendationRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CourseDto> getAllCourses() {
        List<Course> courses = courseRepository.findAll();
        List<CourseSkill> allCourseSkills = courseSkillRepository.findAllWithCourseAndSkill();
        Map<Long, List<CourseSkill>> courseSkillMap = allCourseSkills.stream()
                .collect(Collectors.groupingBy(cs -> cs.getCourse().getId()));

        return courses.stream()
                .map(c -> toCourseDto(c, courseSkillMap.getOrDefault(c.getId(), Collections.emptyList())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CourseRecommendationDto> getRecommendationsForCurrentUser() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));
        return generateCourseRecommendations(profile);
    }

    @Transactional(readOnly = true)
    public List<CourseRecommendationDto> getRecommendationsForEmployee(Long employeeProfileId) {
        EmployeeProfile profile = employeeProfileRepository.findById(employeeProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", employeeProfileId));

        Long userDeptId = profile.getUser().getDepartment() != null ? profile.getUser().getDepartment().getId() : null;
        SecurityUtils.validateUserAccess(profile.getUser().getId(), userDeptId);

        return generateCourseRecommendations(profile);
    }

    @Transactional(readOnly = true)
    public List<CourseRecommendationDto> generateCourseRecommendations(EmployeeProfile profile) {
        // 1. Fetch direct recommendations by Mentor, Manager, or Admin
        List<CourseRecommendation> directRecs = Collections.emptyList();
        try {
            directRecs = courseRecommendationRepository.findByEmployeeProfileIdWithDetails(profile.getId());
        } catch (Exception e) {
            log.warn("Could not load direct course recommendations for profileId={}: {}", profile.getId(), e.getMessage());
        }

        // 2. Fetch all courses and their skills
        List<Course> courses = courseRepository.findAll();
        List<CourseSkill> allCourseSkills = courseSkillRepository.findAllWithCourseAndSkill();
        Map<Long, List<CourseSkill>> courseSkillMap = allCourseSkills.stream()
                .collect(Collectors.groupingBy(cs -> cs.getCourse().getId()));

        List<CourseRecommendationDto> recommendations = new ArrayList<>();
        Set<Long> addedCourseIds = new HashSet<>();

        // Add direct recommendations from Mentor, Manager, Admin first
        for (CourseRecommendation cr : directRecs) {
            Course course = cr.getCourse();
            addedCourseIds.add(course.getId());
            List<CourseSkill> cSkills = courseSkillMap.getOrDefault(course.getId(), Collections.emptyList());
            CourseDto courseDto = toCourseDto(course, cSkills);

            String roleDisplay = cr.getRecommendedByRole();
            String senderName = cr.getRecommendedBy() != null ? cr.getRecommendedBy().getFullName() : "Leadership";
            String notePart = cr.getNotes() != null && !cr.getNotes().isBlank() ? ": \"" + cr.getNotes() + "\"" : "";
            String explanation = String.format("Directly recommended by your %s (%s)%s", roleDisplay, senderName, notePart);

            List<String> coveredSkills = cSkills.stream().map(cs -> cs.getSkill().getName()).toList();
            String primarySkill = !coveredSkills.isEmpty() ? coveredSkills.get(0) : "Core Competency";

            recommendations.add(new CourseRecommendationDto(
                    courseDto,
                    BigDecimal.valueOf(1.0000),
                    coveredSkills,
                    primarySkill,
                    cSkills.stream().mapToInt(CourseSkill::getTargetProficiencyGain).sum(),
                    explanation,
                    0,
                    roleDisplay,
                    senderName,
                    cr.getNotes()
            ));
        }

        // 3. Generate skill gap report and find gap-matching courses
        SkillGapReportDto gapReport = null;
        try {
            gapReport = skillGapService.generateReport(profile);
        } catch (Exception e) {
            log.warn("Could not generate skill gap report for profileId={}: {}", profile.getId(), e.getMessage());
        }

        List<SkillGapItemDto> gaps = gapReport != null && gapReport.getSkillGaps() != null
                ? gapReport.getSkillGaps().stream().filter(g -> g.getRawGap() != null && g.getRawGap() > 0).toList()
                : Collections.emptyList();

        Map<Long, SkillGapItemDto> gapMap = gaps.stream()
                .collect(Collectors.toMap(SkillGapItemDto::getSkillId, g -> g));

        List<CourseRecommendationDto> gapRecommendations = new ArrayList<>();

        for (Course course : courses) {
            if (addedCourseIds.contains(course.getId())) {
                continue;
            }

            // Check if course is already completed in any learning path
            boolean isCompleted = learningPathCourseRepository.isCourseCompletedByEmployee(profile.getId(), course.getId());
            if (isCompleted) {
                continue;
            }

            List<CourseSkill> courseSkills = courseSkillMap.getOrDefault(course.getId(), Collections.emptyList());
            if (courseSkills.isEmpty()) {
                continue;
            }

            // Check which skills covered match unresolved skill gaps
            List<CourseSkill> matchingSkills = new ArrayList<>();
            double totalWeightedGain = 0.0;
            int totalGain = 0;
            String primarySkill = null;
            double maxSkillImpact = -1.0;

            for (CourseSkill cs : courseSkills) {
                SkillGapItemDto gapItem = gapMap.get(cs.getSkill().getId());
                if (gapItem != null) {
                    matchingSkills.add(cs);
                    int effectiveGain = Math.min(gapItem.getRawGap(), cs.getTargetProficiencyGain());
                    totalGain += effectiveGain;
                    double weight = gapItem.getImportanceWeight() != null ? gapItem.getImportanceWeight().doubleValue() : 1.0;
                    double impact = effectiveGain * weight;
                    totalWeightedGain += impact;

                    if (impact > maxSkillImpact) {
                        maxSkillImpact = impact;
                        primarySkill = cs.getSkill().getName();
                    }
                }
            }

            if (!matchingSkills.isEmpty()) {
                // Gap-driven Scoring Algorithm
                double sGap = Math.min(1.0, totalWeightedGain / 6.0);
                double ratingVal = course.getRating() != null ? course.getRating().doubleValue() : 4.5;
                double sRating = Math.min(1.0, ratingVal / 5.0);

                int avgGap = (int) Math.round(matchingSkills.stream()
                        .mapToInt(cs -> gapMap.get(cs.getSkill().getId()).getRawGap())
                        .average().orElse(1.0));
                int courseDiff = course.getDifficultyNumeric();
                double sDiff;
                int diffDelta = Math.abs(avgGap - courseDiff);
                if (diffDelta == 0) sDiff = 1.0;
                else if (diffDelta == 1) sDiff = 0.85;
                else sDiff = 0.70;

                double compositeScore = (0.60 * sGap) + (0.25 * sRating) + (0.15 * sDiff);
                BigDecimal finalScore = BigDecimal.valueOf(compositeScore).setScale(4, RoundingMode.HALF_UP);

                List<String> coveredSkillNames = matchingSkills.stream()
                        .map(cs -> String.format("%s (+%d gain)", cs.getSkill().getName(), cs.getTargetProficiencyGain()))
                        .collect(Collectors.toList());

                String explanation = String.format("Bridges %d skill gap(s): %s. Course difficulty '%s', rating %.2f/5.00.",
                        matchingSkills.size(),
                        String.join(", ", coveredSkillNames),
                        course.getDifficultyLevel(),
                        ratingVal);

                CourseDto courseDto = toCourseDto(course, courseSkills);

                gapRecommendations.add(new CourseRecommendationDto(
                        courseDto,
                        finalScore,
                        coveredSkillNames,
                        primarySkill,
                        totalGain,
                        explanation,
                        0,
                        null,
                        null,
                        null
                ));
            }
        }

        // Sort gap recommendations: Score DESC, Rating DESC, Duration ASC, Course ID ASC
        gapRecommendations.sort(Comparator
                .comparing(CourseRecommendationDto::getRecommendationScore, Comparator.reverseOrder())
                .thenComparing((CourseRecommendationDto r) -> r.getCourse().getRating(), Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparingInt(r -> r.getCourse().getDurationHours())
                .thenComparingLong(r -> r.getCourse().getId())
        );

        for (CourseRecommendationDto gr : gapRecommendations) {
            recommendations.add(gr);
            addedCourseIds.add(gr.getCourse().getId());
        }

        // 4. Fallback Guarantee: Always provide recommendations from the course catalog
        // Ensure employee always has at least 5 rich recommended courses
        if (recommendations.size() < 5) {
            List<Course> catalogFallback = courses.stream()
                    .filter(c -> !addedCourseIds.contains(c.getId()))
                    .filter(c -> !learningPathCourseRepository.isCourseCompletedByEmployee(profile.getId(), c.getId()))
                    .sorted(Comparator.comparing((Course c) -> c.getRating() != null ? c.getRating() : BigDecimal.valueOf(4.0), Comparator.reverseOrder())
                            .thenComparingInt(Course::getDurationHours))
                    .toList();

            for (Course course : catalogFallback) {
                if (recommendations.size() >= 6) break;
                List<CourseSkill> cSkills = courseSkillMap.getOrDefault(course.getId(), Collections.emptyList());
                List<String> coveredSkills = cSkills.stream().map(cs -> cs.getSkill().getName()).toList();
                String targetRole = profile.getTargetJobRole() != null ? profile.getTargetJobRole().getTitle() : "Enterprise Competency";
                String primarySkill = !coveredSkills.isEmpty() ? coveredSkills.get(0) : "Foundational Technical Competency";
                double ratingVal = course.getRating() != null ? course.getRating().doubleValue() : 4.5;
                BigDecimal score = BigDecimal.valueOf(Math.min(0.92, (ratingVal / 5.0) * 0.95)).setScale(4, RoundingMode.HALF_UP);

                recommendations.add(new CourseRecommendationDto(
                        toCourseDto(course, cSkills),
                        score,
                        coveredSkills,
                        primarySkill,
                        cSkills.stream().mapToInt(CourseSkill::getTargetProficiencyGain).sum(),
                        String.format("Curated high-impact curriculum aligned with %s roadmap. Rating %.2f/5.00.", targetRole, ratingVal),
                        0,
                        null,
                        null,
                        null
                ));
            }
        }

        // Assign ranks
        for (int i = 0; i < recommendations.size(); i++) {
            recommendations.get(i).setMatchRank(i + 1);
        }

        return recommendations;
    }

    @Transactional
    public CourseRecommendationDto recommendCourse(RecommendCourseRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        String role;
        if (SecurityUtils.isAdmin()) {
            role = "ADMIN";
        } else if (SecurityUtils.isManager()) {
            role = "MANAGER";
        } else if (SecurityUtils.isMentor()) {
            role = "MENTOR";
        } else {
            throw new AccessDeniedException("Only Admins, Managers, or Mentors can recommend courses to employees.");
        }

        EmployeeProfile profile = employeeProfileRepository.findById(request.getEmployeeProfileId())
                .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", request.getEmployeeProfileId()));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        // Save or update CourseRecommendation
        CourseRecommendation recommendation = new CourseRecommendation(
                profile, course, currentUser, role, request.getNotes()
        );
        courseRecommendationRepository.save(recommendation);

        // Notify the recipient employee
        String title = String.format("Course Recommended by %s: %s", role, currentUser.getFullName());
        String noteTxt = request.getNotes() != null && !request.getNotes().isBlank() ? " Note: " + request.getNotes() : "";
        String message = String.format("%s (%s) has recommended the course \"%s\" for your learning roadmap.%s",
                currentUser.getFullName(), role, course.getTitle(), noteTxt);

        Notification notification = new Notification(
                profile.getUser(),
                title,
                message,
                "COURSE_RECOMMENDATION",
                "/dashboard",
                course.getId(),
                currentUser
        );
        notificationRepository.save(notification);

        List<CourseSkill> cSkills = courseSkillRepository.findByCourseId(course.getId());
        List<String> coveredSkills = cSkills.stream().map(cs -> cs.getSkill().getName()).toList();
        String primarySkill = !coveredSkills.isEmpty() ? coveredSkills.get(0) : "Engineering Competency";

        return new CourseRecommendationDto(
                toCourseDto(course, cSkills),
                BigDecimal.valueOf(1.0000),
                coveredSkills,
                primarySkill,
                cSkills.stream().mapToInt(CourseSkill::getTargetProficiencyGain).sum(),
                String.format("Directly recommended by your %s (%s)", role, currentUser.getFullName()),
                1,
                role,
                currentUser.getFullName(),
                request.getNotes()
        );
    }

    private CourseDto toCourseDto(Course course, List<CourseSkill> courseSkills) {
        List<CourseSkillGainDto> skillGains = courseSkills.stream()
                .map(cs -> new CourseSkillGainDto(cs.getSkill().getId(), cs.getSkill().getName(), cs.getTargetProficiencyGain()))
                .collect(Collectors.toList());

        return new CourseDto(
                course.getId(),
                course.getTitle(),
                course.getProvider(),
                course.getDurationHours(),
                course.getDifficultyLevel(),
                course.getRating(),
                course.getCourseUrl(),
                course.getDescription(),
                skillGains
        );
    }
}
