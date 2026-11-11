package com.orgkgi.service;

import com.orgkgi.dto.mentorship.MatchedSkillDto;
import com.orgkgi.dto.mentorship.MentorCandidateDto;
import com.orgkgi.dto.skillgap.SkillGapItemDto;
import com.orgkgi.dto.skillgap.SkillGapReportDto;
import com.orgkgi.entity.*;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.repository.EmployeeProfileRepository;
import com.orgkgi.repository.EmployeeSkillRepository;
import com.orgkgi.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MentorMatchingService {

    // Scoring algorithm weights (Sum = 1.0)
    public static final double WEIGHT_SKILL_AFFINITY = 0.50;
    public static final double WEIGHT_AVAILABILITY = 0.20;
    public static final double WEIGHT_CAPACITY = 0.15;
    public static final double WEIGHT_DEPT_AFFINITY = 0.15;

    private final EmployeeProfileRepository employeeProfileRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final SkillGapService skillGapService;

    public MentorMatchingService(
            EmployeeProfileRepository employeeProfileRepository,
            EmployeeSkillRepository employeeSkillRepository,
            SkillGapService skillGapService) {
        this.employeeProfileRepository = employeeProfileRepository;
        this.employeeSkillRepository = employeeSkillRepository;
        this.skillGapService = skillGapService;
    }

    @Transactional(readOnly = true)
    public List<MentorCandidateDto> getRecommendationsForCurrentUser() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        EmployeeProfile mentee = employeeProfileRepository.findByUserId(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));
        return findMentorRecommendations(mentee);
    }

    @Transactional(readOnly = true)
    public List<MentorCandidateDto> getRecommendationsForEmployee(Long employeeProfileId) {
        EmployeeProfile mentee = employeeProfileRepository.findById(employeeProfileId)
            .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "id", employeeProfileId));

        Long userDeptId = mentee.getUser().getDepartment() != null ? mentee.getUser().getDepartment().getId() : null;
        SecurityUtils.validateUserAccess(mentee.getUser().getId(), userDeptId);

        return findMentorRecommendations(mentee);
    }

    public List<MentorCandidateDto> findMentorRecommendations(EmployeeProfile mentee) {
        SkillGapReportDto gapReport = skillGapService.generateReport(mentee);

        // Identify target skills where mentee has a positive gap or is unassessed
        List<SkillGapItemDto> targetGapSkills = gapReport.getSkillGaps().stream()
            .filter(g -> (g.getRawGap() != null && g.getRawGap() > 0) || !"VERIFIED".equals(g.getAssessmentStatus()))
            .collect(Collectors.toList());

        if (targetGapSkills.isEmpty()) {
            return Collections.emptyList(); // No skill gaps to mentor
        }

        // Query all eligible mentor candidates dynamically from database
        List<EmployeeProfile> candidates = employeeProfileRepository.findAvailableMentorCandidates();

        List<MentorCandidateDto> recommendations = new ArrayList<>();

        for (EmployeeProfile candidate : candidates) {
            // 1. Prevent self-mentoring
            if (candidate.getId().equals(mentee.getId()) ||
                candidate.getUser().getId().equals(mentee.getUser().getId())) {
                continue;
            }

            // 2. Candidate user must be ACTIVE
            if (candidate.getUser().getStatus() != UserStatus.ACTIVE) {
                continue;
            }

            // 3. Workload capacity check
            int remainingCapacity = candidate.getMaxMentees() - candidate.getCurrentMenteeCount();
            if (remainingCapacity <= 0) {
                continue;
            }

            // 4. Evaluate verified skill matches
            List<EmployeeSkill> candidateSkills = employeeSkillRepository.findByEmployeeProfileId(candidate.getId());
            Map<Long, EmployeeSkill> candidateSkillMap = candidateSkills.stream()
                .filter(cs -> (cs.getVerificationStatus() == VerificationStatus.MANAGER_VERIFIED ||
                               cs.getVerificationStatus() == VerificationStatus.ASSESSED) &&
                              cs.getVerifiedProficiencyLevel() != null)
                .collect(Collectors.toMap(cs -> cs.getSkill().getId(), Function.identity(), (existing, replacing) -> existing));

            List<MatchedSkillDto> matchedSkills = new ArrayList<>();
            double totalGainWeighted = 0.0;
            double maxPossibleGapWeighted = 0.0;

            for (SkillGapItemDto gapItem : targetGapSkills) {
                double weight = gapItem.getImportanceWeight();
                int menteeLevel = gapItem.getVerifiedProficiency() != null ? gapItem.getVerifiedProficiency() : 0;
                int reqLevel = gapItem.getRequiredProficiency();
                int gapMagnitude = Math.max(1, reqLevel - menteeLevel);

                maxPossibleGapWeighted += (gapMagnitude * weight);

                EmployeeSkill cSkill = candidateSkillMap.get(gapItem.getSkillId());
                if (cSkill != null) {
                    int cLevel = cSkill.getVerifiedProficiencyLevel();
                    if (cLevel > menteeLevel) {
                        int gain = Math.min(cLevel - menteeLevel, reqLevel - menteeLevel);
                        if (gain > 0) {
                            totalGainWeighted += (gain * weight);
                            matchedSkills.add(new MatchedSkillDto(
                                gapItem.getSkillId(),
                                gapItem.getSkillName(),
                                gapItem.getSkillCode(),
                                gapItem.getVerifiedProficiency(),
                                gapItem.getRawGap(),
                                cLevel,
                                gain,
                                weight
                            ));
                        }
                    }
                }
            }

            // Exclude candidates who have zero verified skill match on gap areas
            if (matchedSkills.isEmpty()) {
                continue;
            }

            // Compute normalized score components (0.0 to 1.0)
            double skillAffinity = maxPossibleGapWeighted > 0
                ? Math.min(1.0, totalGainWeighted / maxPossibleGapWeighted)
                : 1.0;

            // Availability score (10 hours/week = 1.0 benchmark)
            double availabilityScore = Math.min(1.0, candidate.getMentorAvailabilityHrsPerWeek() / 10.0);

            // Capacity score
            double capacityScore = Math.min(1.0, (double) remainingCapacity / candidate.getMaxMentees());

            // Department affinity: 1.0 for same department, 0.5 for cross-department
            boolean sameDept = candidate.getUser().getDepartment() != null &&
                               mentee.getUser().getDepartment() != null &&
                               candidate.getUser().getDepartment().getId().equals(mentee.getUser().getDepartment().getId());
            double deptAffinity = sameDept ? 1.0 : 0.5;

            // Overall composite score
            double composite = (WEIGHT_SKILL_AFFINITY * skillAffinity) +
                               (WEIGHT_AVAILABILITY * availabilityScore) +
                               (WEIGHT_CAPACITY * capacityScore) +
                               (WEIGHT_DEPT_AFFINITY * deptAffinity);

            double roundedOverallScore = Math.round(composite * 1000.0) / 1000.0;

            // Explanation generation
            String primarySkill = matchedSkills.get(0).getSkillName();
            int primaryGain = matchedSkills.get(0).getProficiencyGain();
            String explanation = String.format(
                "Algorithmic match: Verified in %s (+%d proficiency gain) with %d hrs/wk availability and %d open mentee slot(s) in %s.",
                primarySkill,
                primaryGain,
                candidate.getMentorAvailabilityHrsPerWeek(),
                remainingCapacity,
                candidate.getUser().getDepartment() != null ? candidate.getUser().getDepartment().getName() : "General"
            );

            MentorCandidateDto dto = new MentorCandidateDto();
            dto.setMentorProfileId(candidate.getId());
            dto.setMentorUserId(candidate.getUser().getId());
            dto.setMentorFullName(candidate.getUser().getFullName());
            dto.setMentorEmail(candidate.getUser().getEmail());

            if (candidate.getUser().getDepartment() != null) {
                dto.setDepartmentId(candidate.getUser().getDepartment().getId());
                dto.setDepartmentName(candidate.getUser().getDepartment().getName());
            }

            if (candidate.getCurrentJobRole() != null) {
                dto.setCurrentJobRoleTitle(candidate.getCurrentJobRole().getTitle());
            }

            dto.setAvailableHoursPerWeek(candidate.getMentorAvailabilityHrsPerWeek());
            dto.setCurrentMenteeCount(candidate.getCurrentMenteeCount());
            dto.setMaxMentees(candidate.getMaxMentees());
            dto.setRemainingCapacity(remainingCapacity);

            dto.setOverallScore(roundedOverallScore);
            dto.setSkillAffinityScore(Math.round(skillAffinity * 1000.0) / 1000.0);
            dto.setAvailabilityScore(Math.round(availabilityScore * 1000.0) / 1000.0);
            dto.setCapacityScore(Math.round(capacityScore * 1000.0) / 1000.0);
            dto.setDepartmentAffinityScore(Math.round(deptAffinity * 1000.0) / 1000.0);
            dto.setExplanation(explanation);
            dto.setMatchedSkills(matchedSkills);

            recommendations.add(dto);
        }

        // Deterministic tie-breaking:
        // 1. Overall Score DESC
        // 2. Available Hours DESC
        // 3. Remaining Capacity DESC
        // 4. Mentor Profile ID ASC
        recommendations.sort((a, b) -> {
            int cmp = Double.compare(b.getOverallScore(), a.getOverallScore());
            if (cmp != 0) return cmp;

            cmp = Integer.compare(b.getAvailableHoursPerWeek(), a.getAvailableHoursPerWeek());
            if (cmp != 0) return cmp;

            cmp = Integer.compare(b.getRemainingCapacity(), a.getRemainingCapacity());
            if (cmp != 0) return cmp;

            return Long.compare(a.getMentorProfileId(), b.getMentorProfileId());
        });

        return recommendations;
    }
}
