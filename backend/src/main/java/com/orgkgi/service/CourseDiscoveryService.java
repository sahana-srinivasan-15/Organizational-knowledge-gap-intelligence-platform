package com.orgkgi.service;

import com.orgkgi.dto.discovery.CourseComparisonDto;
import com.orgkgi.dto.discovery.ExternalCourseDto;
import com.orgkgi.dto.skillgap.SkillGapItemDto;
import com.orgkgi.dto.skillgap.SkillGapReportDto;
import com.orgkgi.entity.Course;
import com.orgkgi.entity.CourseSkill;
import com.orgkgi.entity.EmployeeProfile;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.repository.CourseRepository;
import com.orgkgi.repository.CourseSkillRepository;
import com.orgkgi.repository.EmployeeProfileRepository;
import com.orgkgi.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CourseDiscoveryService {

    private final CourseRepository courseRepository;
    private final CourseSkillRepository courseSkillRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final SkillGapService skillGapService;

    public CourseDiscoveryService(
            CourseRepository courseRepository,
            CourseSkillRepository courseSkillRepository,
            EmployeeProfileRepository employeeProfileRepository,
            SkillGapService skillGapService) {
        this.courseRepository = courseRepository;
        this.courseSkillRepository = courseSkillRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.skillGapService = skillGapService;
    }

    @Transactional(readOnly = true)
    public List<ExternalCourseDto> searchCourses(
            String keyword,
            String provider,
            String difficulty,
            Boolean isFree,
            Integer maxDurationHours,
            Long employeeProfileId) {

        List<Course> allCourses = courseRepository.findAll();
        Map<Long, List<CourseSkill>> courseSkillsMap = courseSkillRepository.findAll().stream()
                .collect(Collectors.groupingBy(cs -> cs.getCourse().getId()));

        // Resolve gap map for personalized scoring if employee context provided or available
        Map<Long, SkillGapItemDto> gapMap = new HashMap<>();
        String targetRoleTitle = null;

        Long resolvedProfileId = employeeProfileId;
        if (resolvedProfileId == null) {
            try {
                Long currentUserId = SecurityUtils.getCurrentUserId();
                Optional<EmployeeProfile> opt = employeeProfileRepository.findByUserId(currentUserId);
                if (opt.isPresent()) {
                    resolvedProfileId = opt.get().getId();
                }
            } catch (Exception ignored) {}
        }

        if (resolvedProfileId != null) {
            try {
                EmployeeProfile profile = employeeProfileRepository.findById(resolvedProfileId).orElse(null);
                if (profile != null && profile.getTargetJobRole() != null) {
                    targetRoleTitle = profile.getTargetJobRole().getTitle();
                    SkillGapReportDto report = skillGapService.generateReport(profile);
                    if (report != null && report.getSkillGaps() != null) {
                        for (SkillGapItemDto item : report.getSkillGaps()) {
                            if (item.getRawGap() != null && item.getRawGap() > 0) {
                                gapMap.put(item.getSkillId(), item);
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

        final String finalTargetRole = targetRoleTitle;
        List<ExternalCourseDto> results = new ArrayList<>();

        for (Course course : allCourses) {
            List<CourseSkill> cSkills = courseSkillsMap.getOrDefault(course.getId(), Collections.emptyList());
            List<String> skillNames = cSkills.stream().map(cs -> cs.getSkill().getName()).collect(Collectors.toList());

            // 1. Keyword search (title, description, provider, or skills covered)
            if (keyword != null && !keyword.trim().isEmpty()) {
                String kw = keyword.trim().toLowerCase();
                boolean matchesTitle = course.getTitle().toLowerCase().contains(kw);
                boolean matchesDesc = course.getDescription() != null && course.getDescription().toLowerCase().contains(kw);
                boolean matchesProvider = course.getProvider() != null && course.getProvider().toLowerCase().contains(kw);
                boolean matchesSkills = skillNames.stream().anyMatch(s -> s.toLowerCase().contains(kw));

                if (!matchesTitle && !matchesDesc && !matchesProvider && !matchesSkills) {
                    continue;
                }
            }

            // 2. Provider filter
            if (provider != null && !provider.trim().isEmpty() && !"ALL".equalsIgnoreCase(provider)) {
                if (course.getProvider() == null || !course.getProvider().equalsIgnoreCase(provider.trim())) {
                    continue;
                }
            }

            // 3. Difficulty filter
            if (difficulty != null && !difficulty.trim().isEmpty() && !"ALL".equalsIgnoreCase(difficulty)) {
                if (!course.getDifficultyLevel().equalsIgnoreCase(difficulty.trim())) {
                    continue;
                }
            }

            // 4. Duration filter
            if (maxDurationHours != null && maxDurationHours > 0) {
                if (course.getDurationHours() != null && course.getDurationHours() > maxDurationHours) {
                    continue;
                }
            }

            ExternalCourseDto dto = mapToExternalCourseDto(course, cSkills);

            // 5. Free status filter
            if (isFree != null) {
                if (isFree && !Boolean.TRUE.equals(dto.getIsFree())) continue;
                if (!isFree && Boolean.TRUE.equals(dto.getIsFree())) continue;
            }

            // 6. Compute skill gap relevance & dynamic explainable recommendation
            double matchScore = 0.0;
            List<String> matchingGapSkills = new ArrayList<>();

            for (CourseSkill cs : cSkills) {
                SkillGapItemDto gapItem = gapMap.get(cs.getSkill().getId());
                if (gapItem != null) {
                    double weight = gapItem.getImportanceWeight() != null ? gapItem.getImportanceWeight() : 1.0;
                    matchScore += (cs.getTargetProficiencyGain() * weight * 15.0);
                    matchingGapSkills.add(String.format("%s (Gap: +%d, %s)",
                            cs.getSkill().getName(), gapItem.getRawGap(), gapItem.getCriticality()));
                }
            }

            // Factor in rating
            if (course.getRating() != null) {
                matchScore += (course.getRating().doubleValue() * 5.0);
            }

            dto.setMatchRelevanceScore(Math.round(matchScore * 10.0) / 10.0);

            if (!matchingGapSkills.isEmpty()) {
                dto.setRecommended(true);
                dto.setRecommendationReason(String.format(
                        "Recommended because this course addresses your verified skill gap in %s for your target role '%s'.",
                        String.join(", ", matchingGapSkills),
                        finalTargetRole != null ? finalTargetRole : "Target Position"
                ));
            } else {
                dto.setRecommended(false);
                dto.setRecommendationReason("Covers foundational competency: " + String.join(", ", skillNames) + ".");
            }

            results.add(dto);
        }

        // Sort descending by relevance score, then rating
        results.sort((a, b) -> {
            int cmp = Double.compare(
                    b.getMatchRelevanceScore() != null ? b.getMatchRelevanceScore() : 0.0,
                    a.getMatchRelevanceScore() != null ? a.getMatchRelevanceScore() : 0.0
            );
            if (cmp != 0) return cmp;
            return b.getRating().compareTo(a.getRating());
        });

        return results;
    }

    @Transactional(readOnly = true)
    public CourseComparisonDto compareCourses(List<Long> courseIds, Long employeeProfileId) {
        if (courseIds == null || courseIds.isEmpty()) {
            return new CourseComparisonDto(Collections.emptyList(), null, "No courses selected for comparison.");
        }

        List<ExternalCourseDto> list = new ArrayList<>();
        for (Long id : courseIds) {
            Course c = courseRepository.findById(id).orElse(null);
            if (c != null) {
                List<CourseSkill> cSkills = courseSkillRepository.findByCourseId(c.getId());
                list.add(mapToExternalCourseDto(c, cSkills));
            }
        }

        if (list.isEmpty()) {
            return new CourseComparisonDto(Collections.emptyList(), null, "Selected courses not found.");
        }

        // Determine best recommended course based on rating, duration, and price
        ExternalCourseDto best = list.stream()
                .max(Comparator.comparing(ExternalCourseDto::getRating)
                        .thenComparing(c -> Boolean.TRUE.equals(c.getIsFree()) ? 1 : 0))
                .orElse(list.get(0));

        String summary = String.format(
                "Comparing %d courses across %s. '%s' from %s is currently recommended with a %.2f rating.",
                list.size(),
                list.stream().map(ExternalCourseDto::getProvider).distinct().collect(Collectors.joining(", ")),
                best.getTitle(),
                best.getProvider(),
                best.getRating()
        );

        return new CourseComparisonDto(list, best.getTitle(), summary);
    }

    @Transactional(readOnly = true)
    public List<ExternalCourseDto> getAlternativesForCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        List<CourseSkill> courseSkills = courseSkillRepository.findByCourseId(course.getId());
        Set<Long> targetSkillIds = courseSkills.stream().map(cs -> cs.getSkill().getId()).collect(Collectors.toSet());

        List<Course> all = courseRepository.findAll();
        Map<Long, List<CourseSkill>> allSkills = courseSkillRepository.findAll().stream()
                .collect(Collectors.groupingBy(cs -> cs.getCourse().getId()));

        List<ExternalCourseDto> alternatives = new ArrayList<>();
        for (Course c : all) {
            if (c.getId().equals(course.getId())) continue;
            List<CourseSkill> cSkills = allSkills.getOrDefault(c.getId(), Collections.emptyList());
            boolean overlaps = cSkills.stream().anyMatch(cs -> targetSkillIds.contains(cs.getSkill().getId()));
            if (overlaps) {
                ExternalCourseDto dto = mapToExternalCourseDto(c, cSkills);
                dto.setRecommendationReason("Suggested alternative covering common skill: " +
                        cSkills.stream().map(cs -> cs.getSkill().getName()).collect(Collectors.joining(", ")));
                alternatives.add(dto);
            }
        }

        alternatives.sort(Comparator.comparing(ExternalCourseDto::getRating).reversed());
        return alternatives.stream().limit(4).collect(Collectors.toList());
    }

    private ExternalCourseDto mapToExternalCourseDto(Course course, List<CourseSkill> courseSkills) {
        ExternalCourseDto dto = new ExternalCourseDto();
        dto.setId(course.getId());
        dto.setTitle(course.getTitle());
        dto.setProvider(course.getProvider() != null ? course.getProvider() : "External");
        dto.setCourseUrl(course.getCourseUrl() != null ? course.getCourseUrl() : "#");
        dto.setDescription(course.getDescription());
        dto.setDurationHours(course.getDurationHours());
        dto.setDifficultyLevel(course.getDifficultyLevel());
        dto.setRating(course.getRating() != null ? course.getRating() : new BigDecimal("4.50"));

        // Estimate price and metadata from provider
        String provider = dto.getProvider().toLowerCase();
        if (provider.contains("youtube") || provider.contains("internal")) {
            dto.setPrice(BigDecimal.ZERO);
            dto.setIsFree(true);
            dto.setCertificateAvailable(false);
            dto.setInstructor(provider.contains("internal") ? "Internal Senior Architect" : "Verified Educator");
        } else if (provider.contains("edx")) {
            dto.setPrice(BigDecimal.ZERO); // Audit free, verified cert optional
            dto.setIsFree(true);
            dto.setCertificateAvailable(true);
            dto.setInstructor("University Faculty");
        } else if (provider.contains("coursera")) {
            dto.setPrice(new BigDecimal("49.00"));
            dto.setIsFree(false);
            dto.setCertificateAvailable(true);
            dto.setInstructor("Specialization Professor");
        } else {
            // Udemy / other
            dto.setPrice(new BigDecimal("29.99"));
            dto.setIsFree(false);
            dto.setCertificateAvailable(true);
            dto.setInstructor("Industry Practitioner");
        }

        dto.setReviewCount(120 + (int) (course.getId() * 37) % 850);
        dto.setLanguage("English");
        dto.setSkillsCovered(courseSkills.stream().map(cs -> cs.getSkill().getName()).collect(Collectors.toList()));
        return dto;
    }
}
