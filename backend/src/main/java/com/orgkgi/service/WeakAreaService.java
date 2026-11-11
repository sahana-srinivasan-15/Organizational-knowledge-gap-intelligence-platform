package com.orgkgi.service;

import com.orgkgi.dto.weakarea.*;
import com.orgkgi.entity.*;
import com.orgkgi.exception.BadRequestException;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.exception.UnauthorizedAccessException;
import com.orgkgi.repository.*;
import com.orgkgi.security.SecurityUtils;
import com.orgkgi.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class WeakAreaService {

    private final EmployeeProfileRepository employeeProfileRepository;
    private final JobRoleSkillRepository jobRoleSkillRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final AssessmentSubmissionRepository assessmentSubmissionRepository;
    private final SkillMaterialRepository skillMaterialRepository;
    private final WeakAreaReviewRepository weakAreaReviewRepository;
    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final SkillRepository skillRepository;
    private final CourseSkillRepository courseSkillRepository;

    public WeakAreaService(
            EmployeeProfileRepository employeeProfileRepository,
            JobRoleSkillRepository jobRoleSkillRepository,
            EmployeeSkillRepository employeeSkillRepository,
            AssessmentSubmissionRepository assessmentSubmissionRepository,
            SkillMaterialRepository skillMaterialRepository,
            WeakAreaReviewRepository weakAreaReviewRepository,
            MentorAssignmentRepository mentorAssignmentRepository,
            SkillRepository skillRepository,
            CourseSkillRepository courseSkillRepository) {
        this.employeeProfileRepository = employeeProfileRepository;
        this.jobRoleSkillRepository = jobRoleSkillRepository;
        this.employeeSkillRepository = employeeSkillRepository;
        this.assessmentSubmissionRepository = assessmentSubmissionRepository;
        this.skillMaterialRepository = skillMaterialRepository;
        this.weakAreaReviewRepository = weakAreaReviewRepository;
        this.mentorAssignmentRepository = mentorAssignmentRepository;
        this.skillRepository = skillRepository;
        this.courseSkillRepository = courseSkillRepository;
    }

    @Transactional(readOnly = true)
    public List<WeakAreaDto> getWeakAreasForCurrentUser() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));
        return getWeakAreasForEmployee(profile.getId());
    }

    @Transactional(readOnly = true)
    public List<WeakAreaDto> getWeakAreasForEmployee(Long employeeProfileId) {
        EmployeeProfile profile = employeeProfileRepository.findById(employeeProfileId)
            .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", employeeProfileId));

        Long userDeptId = profile.getUser().getDepartment() != null ? profile.getUser().getDepartment().getId() : null;
        SecurityUtils.validateUserAccess(profile.getUser().getId(), userDeptId);

        JobRole targetRole = profile.getTargetJobRole() != null ? profile.getTargetJobRole() : profile.getCurrentJobRole();
        if (targetRole == null) {
            return Collections.emptyList();
        }

        List<JobRoleSkill> roleSkills = jobRoleSkillRepository.findByJobRoleId(targetRole.getId());
        List<EmployeeSkill> employeeSkills = employeeSkillRepository.findByEmployeeProfileId(profile.getId());
        Map<Long, EmployeeSkill> empSkillMap = employeeSkills.stream()
            .collect(Collectors.toMap(es -> es.getSkill().getId(), Function.identity(), (a, b) -> a));

        List<AssessmentSubmission> submissions = assessmentSubmissionRepository
            .findByEmployeeProfileIdOrderByAttemptedAtDesc(profile.getId());

        List<MentorAssignment> assignments = mentorAssignmentRepository.findByMentorId(profile.getId());
        List<MentorAssignment> menteeAssignments = mentorAssignmentRepository.findAll().stream()
            .filter(ma -> ma.getMentee() != null && ma.getMentee().getId().equals(profile.getId()))
            .collect(Collectors.toList());

        Map<Long, MentorAssignment> mentorBySkill = new HashMap<>();
        for (MentorAssignment ma : menteeAssignments) {
            if (ma.getSkill() != null && (ma.getStatus() == MentorAssignmentStatus.APPROVED_BY_MANAGER || ma.getStatus() == MentorAssignmentStatus.ACTIVE)) {
                mentorBySkill.put(ma.getSkill().getId(), ma);
            }
        }

        List<WeakAreaReview> allReviews = weakAreaReviewRepository.findByEmployeeProfileIdOrderByCreatedAtDesc(profile.getId());
        Map<Long, List<WeakAreaReview>> reviewsBySkill = allReviews.stream()
            .collect(Collectors.groupingBy(r -> r.getSkill().getId()));

        List<WeakAreaDto> result = new ArrayList<>();

        for (JobRoleSkill req : roleSkills) {
            Skill skill = req.getSkill();
            if (skill == null) continue;

            EmployeeSkill es = empSkillMap.get(skill.getId());
            int requiredLevel = req.getRequiredProficiencyLevel() != null ? req.getRequiredProficiencyLevel() : 3;

            Integer currentProf = null;
            if (es != null) {
                currentProf = es.getVerifiedProficiencyLevel() != null ? es.getVerifiedProficiencyLevel() : es.getCurrentProficiencyLevel();
            }

            int currentVal = currentProf != null ? currentProf : 0;
            int gap = Math.max(0, requiredLevel - currentVal);

            // Find relevant diagnostic assessment via courses mapped to skill
            Double diagnosticScore = null;
            Boolean diagnosticPassed = null;
            List<CourseSkill> courseSkillsForSkill = courseSkillRepository.findBySkillId(skill.getId());
            Set<Long> courseIdsForSkill = courseSkillsForSkill.stream()
                .map(cs -> cs.getCourse().getId())
                .collect(Collectors.toSet());

            for (AssessmentSubmission sub : submissions) {
                if (sub.getAssessment() != null && sub.getAssessment().getCourse() != null) {
                    Long cId = sub.getAssessment().getCourse().getId();
                    if (courseIdsForSkill.contains(cId)) {
                        diagnosticScore = sub.getScore() != null ? sub.getScore().doubleValue() : null;
                        diagnosticPassed = sub.getPassed();
                        break;
                    }
                }
            }

            boolean isWeak = gap > 0 || (diagnosticPassed != null && !diagnosticPassed) || (diagnosticScore != null && diagnosticScore < 70.0);
            String reason;

            if (gap > 0 && diagnosticPassed != null && !diagnosticPassed) {
                reason = "Competency gap of -" + gap + " level(s) and diagnostic assessment score of " + String.format("%.0f", diagnosticScore) + "%";
            } else if (gap > 0) {
                reason = "Verified proficiency (Level " + currentVal + ") is below target role requirement (Level " + requiredLevel + ")";
            } else if (diagnosticPassed != null && !diagnosticPassed) {
                reason = "Diagnostic assessment score of " + String.format("%.0f", diagnosticScore) + "% requires targeted remedial review";
            } else if (currentProf == null) {
                reason = "Skill unassessed for target role requirement";
                isWeak = true;
            } else {
                reason = "Proficiency standard satisfied";
            }

            WeakAreaDto dto = new WeakAreaDto();
            dto.setSkillId(skill.getId());
            dto.setSkillName(skill.getName());
            dto.setSkillCode(skill.getCode());
            dto.setCategoryName(skill.getCategory() != null ? skill.getCategory().getName() : "Core");
            dto.setCurrentProficiency(currentVal);
            dto.setRequiredProficiency(requiredLevel);
            dto.setGap(gap);
            dto.setIsWeakArea(isWeak);
            dto.setReason(reason);
            dto.setDiagnosticScore(diagnosticScore);
            dto.setDiagnosticPassed(diagnosticPassed);

            MentorAssignment ma = mentorBySkill.get(skill.getId());
            if (ma != null && ma.getMentor() != null && ma.getMentor().getUser() != null) {
                dto.setMentorId(ma.getMentor().getId());
                dto.setMentorName(ma.getMentor().getUser().getFullName());
            }

            // Load tailored materials
            List<SkillMaterial> materials = skillMaterialRepository.findBySkillIdOrderByDifficultyLevelAsc(skill.getId());
            dto.setMaterials(materials.stream().map(this::mapMaterialToDto).collect(Collectors.toList()));

            // Load reviews
            List<WeakAreaReview> skillReviews = reviewsBySkill.getOrDefault(skill.getId(), Collections.emptyList());
            dto.setReviews(skillReviews.stream().map(this::mapReviewToDto).collect(Collectors.toList()));

            result.add(dto);
        }

        // Sort so that weak areas appear first, followed by largest gap
        result.sort((a, b) -> {
            if (Boolean.TRUE.equals(a.getIsWeakArea()) && !Boolean.TRUE.equals(b.getIsWeakArea())) return -1;
            if (!Boolean.TRUE.equals(a.getIsWeakArea()) && Boolean.TRUE.equals(b.getIsWeakArea())) return 1;
            return Integer.compare(b.getGap(), a.getGap());
        });

        return result;
    }

    @Transactional
    public WeakAreaReviewDto submitEmployeeReview(Long skillId, SubmitMaterialReviewRequest request) {
        UserPrincipal principal = SecurityUtils.getCurrentUserPrincipal();
        Long currentUserId = principal.getId();

        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));

        Skill skill = skillRepository.findById(skillId)
            .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", skillId));

        SkillMaterial material = null;
        if (request.getMaterialId() != null) {
            material = skillMaterialRepository.findById(request.getMaterialId()).orElse(null);
        }

        WeakAreaReview review = new WeakAreaReview();
        review.setEmployeeProfile(profile);
        review.setSkill(skill);
        review.setMaterial(material);
        review.setRating(request.getRating());
        review.setReviewText(request.getReviewText());
        review.setCompletionStatus(request.getCompletionStatus() != null ? request.getCompletionStatus() : "REVIEWED");
        review.setCreatedAt(OffsetDateTime.now());
        review.setUpdatedAt(OffsetDateTime.now());

        WeakAreaReview saved = weakAreaReviewRepository.save(review);
        return mapReviewToDto(saved);
    }

    @Transactional
    public WeakAreaReviewDto submitMentorFeedback(Long employeeProfileId, Long skillId, SubmitMentorReviewFeedbackRequest request) {
        UserPrincipal principal = SecurityUtils.getCurrentUserPrincipal();
        Long currentUserId = principal.getId();

        EmployeeProfile mentorProfile = employeeProfileRepository.findByUserId(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));

        EmployeeProfile menteeProfile = employeeProfileRepository.findById(employeeProfileId)
            .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", employeeProfileId));

        Skill skill = skillRepository.findById(skillId)
            .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", skillId));

        // Find existing review or create a new advisory review record
        Optional<WeakAreaReview> existingReviewOpt = weakAreaReviewRepository
            .findFirstByEmployeeProfileIdAndSkillIdOrderByCreatedAtDesc(employeeProfileId, skillId);

        WeakAreaReview review;
        if (existingReviewOpt.isPresent()) {
            review = existingReviewOpt.get();
        } else {
            review = new WeakAreaReview();
            review.setEmployeeProfile(menteeProfile);
            review.setSkill(skill);
            review.setRating(5);
            review.setReviewText("Mentor initiated advisory milestone.");
        }

        review.setMentor(mentorProfile);
        review.setMentorFeedback(request.getMentorFeedback());
        if (request.getCompletionStatus() != null && !request.getCompletionStatus().isBlank()) {
            review.setCompletionStatus(request.getCompletionStatus());
        }
        review.setUpdatedAt(OffsetDateTime.now());

        WeakAreaReview saved = weakAreaReviewRepository.save(review);
        return mapReviewToDto(saved);
    }

    public SkillMaterialDto mapMaterialToDto(SkillMaterial m) {
        SkillMaterialDto dto = new SkillMaterialDto();
        dto.setId(m.getId());
        dto.setSkillId(m.getSkill().getId());
        dto.setSkillName(m.getSkill().getName());
        dto.setTitle(m.getTitle());
        dto.setDescription(m.getDescription());
        dto.setMaterialType(m.getMaterialType());
        dto.setDifficultyLevel(m.getDifficultyLevel());
        dto.setEstimatedMinutes(m.getEstimatedMinutes());
        dto.setUrl(m.getUrl());
        dto.setProvider(m.getProvider());
        dto.setCreatedAt(m.getCreatedAt());
        return dto;
    }

    public WeakAreaReviewDto mapReviewToDto(WeakAreaReview r) {
        WeakAreaReviewDto dto = new WeakAreaReviewDto();
        dto.setId(r.getId());
        if (r.getEmployeeProfile() != null) {
            dto.setEmployeeProfileId(r.getEmployeeProfile().getId());
            if (r.getEmployeeProfile().getUser() != null) {
                dto.setEmployeeName(r.getEmployeeProfile().getUser().getFullName());
            }
        }
        if (r.getSkill() != null) {
            dto.setSkillId(r.getSkill().getId());
            dto.setSkillName(r.getSkill().getName());
        }
        if (r.getMaterial() != null) {
            dto.setMaterialId(r.getMaterial().getId());
            dto.setMaterialTitle(r.getMaterial().getTitle());
        }
        dto.setRating(r.getRating());
        dto.setReviewText(r.getReviewText());
        if (r.getMentor() != null) {
            dto.setMentorId(r.getMentor().getId());
            if (r.getMentor().getUser() != null) {
                dto.setMentorName(r.getMentor().getUser().getFullName());
            }
        }
        dto.setMentorFeedback(r.getMentorFeedback());
        dto.setCompletionStatus(r.getCompletionStatus());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setUpdatedAt(r.getUpdatedAt());
        return dto;
    }
}
